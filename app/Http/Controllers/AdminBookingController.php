<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\PosSale;
use App\Models\Room;
use App\Services\AvailabilityService;
use App\Services\BookingService;
use App\Services\GuestMessenger;
use App\Services\PosService;
use App\Services\PricingService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AdminBookingController extends Controller
{
    private const TRANSITIONS = [
        'PENDING' => ['CONFIRMED', 'CANCELLED'], 'AWAITING_PAYMENT' => ['CONFIRMED', 'CANCELLED'],
        'PAID' => ['CONFIRMED', 'CANCELLED'], 'CONFIRMED' => ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
        'CHECKED_IN' => ['CHECKED_OUT'], 'CHECKED_OUT' => ['COMPLETED'],
    ];

    private const TABS = ['all', 'unpaid', 'paid', 'direct', 'airbnb', 'cancelled'];

    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        $filters = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'status' => ['nullable', 'in:PENDING,AWAITING_PAYMENT,PAID,CONFIRMED,CHECKED_IN,CHECKED_OUT,COMPLETED,CANCELLED,EXPIRED,NO_SHOW'],
            'search' => ['nullable', 'string', 'max:120'],
            'tab' => ['nullable', 'in:'.implode(',', self::TABS)],
            'source' => ['nullable', 'in:'.implode(',', array_keys(Booking::SOURCES))],
            'sort' => ['nullable', 'in:guest,unit,stay,balance,created'],
            'dir' => ['nullable', 'in:asc,desc'],
            'open' => ['nullable', 'integer'],
        ]);
        $query = Booking::query()->select('bookings.*')->with(['property:id,name', 'room:id,name', 'payments' => fn ($payments) => $payments->where('status', 'PENDING')])
            ->withSum(['payments as paid_amount' => fn ($payments) => $payments->where('status', 'PAID')], 'amount')
            ->withSum(['posSales as open_charges' => fn ($sales) => $sales->where('status', 'UNPAID')], 'total')
            ->where('bookings.tenant_id', $tenantId);
        if (! empty($filters['from'])) {
            $query->whereDate('bookings.created_at', '>=', $filters['from']);
        }
        if (! empty($filters['to'])) {
            $query->whereDate('bookings.created_at', '<=', $filters['to']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        match ($filters['tab'] ?? 'all') {
            'unpaid' => $query->whereIn('payment_status', ['UNPAID', 'PARTIALLY_PAID', 'PENDING'])->whereNotIn('status', ['CANCELLED', 'EXPIRED', 'NO_SHOW']),
            'paid' => $query->where('payment_status', 'PAID'),
            'direct' => $query->whereIn('source', Booking::DIRECT_SOURCES),
            'airbnb' => $query->where('source', 'airbnb'),
            'cancelled' => $query->whereIn('status', ['CANCELLED', 'EXPIRED', 'NO_SHOW']),
            default => null,
        };
        if (! empty($filters['source'])) {
            $query->where('source', $filters['source']);
        }
        if (! empty($filters['search'])) {
            $term = '%'.$filters['search'].'%';
            $query->where(fn ($q) => $q->where('reference', 'like', $term)->orWhere('guest_name', 'like', $term)
                ->orWhere('guest_email', 'like', $term)->orWhere('guest_phone', 'like', $term)
                ->orWhereHas('room', fn ($room) => $room->where('name', 'like', $term)));
        }
        $dir = $filters['dir'] ?? 'desc';
        match ($filters['sort'] ?? 'created') {
            'guest' => $query->orderBy('guest_name', $dir),
            'unit' => $query->orderBy(Room::select('name')->whereColumn('rooms.id', 'bookings.room_id'), $dir),
            'stay' => $query->orderBy('check_in', $dir),
            'balance' => $query->orderByRaw('(bookings.total - coalesce((select sum(amount) from payments where payments.booking_id = bookings.id and payments.status = ?), 0)) '.($dir === 'asc' ? 'asc' : 'desc'), ['PAID']),
            default => $query->orderBy('bookings.created_at', $dir)->orderBy('bookings.id', $dir),
        };

        return Inertia::render('Admin/Bookings', [
            'bookings' => $query->paginate(30)->withQueryString(),
            'filters' => $filters,
            'active' => Booking::where('tenant_id', $tenantId)->whereIn('status', ['PENDING', 'AWAITING_PAYMENT', 'PAID', 'CONFIRMED', 'CHECKED_IN'])
                ->where(fn ($q) => $q->whereNotIn('status', ['PENDING', 'AWAITING_PAYMENT'])->orWhere('expires_at', '>', now()))->count(),
            'sources' => Booking::SOURCES,
        ]);
    }

    /** Everything the booking drawer shows, as JSON so any page can open it. */
    public function show(Request $request, Booking $booking)
    {
        abort_unless($booking->tenant_id === $request->user()->tenant_id, 404);
        $booking->load(['property:id,name', 'room:id,name,maximum_occupancy', 'price', 'payments' => fn ($q) => $q->latest(),
            'posSales' => fn ($q) => $q->with('items')->latest(), 'messages' => fn ($q) => $q->latest('created_at')->limit(10)]);
        $settings = $request->user()->tenant->settings;
        [$in, $out] = $booking->times($settings);
        $paid = $booking->paidAmount();
        $openCharges = $booking->openCharges();
        $expired = in_array($booking->status, ['PENDING', 'AWAITING_PAYMENT'], true) && $booking->expires_at?->isPast();

        return response()->json([
            'booking' => [...$booking->only('id', 'reference', 'guest_name', 'guest_email', 'guest_phone', 'guests', 'status', 'payment_status',
                'source', 'notes', 'group_code', 'room_id', 'deposit_amount'),
                'check_in' => $booking->check_in->toDateString(), 'check_out' => $booking->check_out->toDateString(),
                'check_in_time' => $in, 'check_out_time' => $out, 'nights' => (int) $booking->check_in->diffInDays($booking->check_out),
                'expires_at' => $booking->expires_at?->toIso8601String(), 'created_at' => $booking->created_at->toIso8601String(),
                'unit' => $booking->room?->name, 'property' => $booking->property?->name, 'total' => (float) $booking->total],
            'price' => $booking->price,
            'paid' => $paid,
            'balance' => max(0, round((float) $booking->total - $paid, 2)),
            'open_charges' => $openCharges,
            'payments' => $booking->payments->map(fn (Payment $p) => $p->only('id', 'method', 'amount', 'status', 'reference', 'payer_reference', 'paid_at', 'created_at')),
            'charges' => $booking->posSales->map(fn (PosSale $s) => [...$s->only('id', 'number', 'total', 'status', 'payment_method', 'created_at'),
                'items' => $s->items->map(fn ($i) => $i->only('name', 'quantity', 'amount'))]),
            'messages' => $booking->messages->map(fn ($m) => $m->only('event', 'subject', 'status', 'created_at')),
            'transitions' => $expired ? [] : (self::TRANSITIONS[$booking->status] ?? []),
            'expired' => $expired,
            'group' => $booking->group_code ? Booking::with('room:id,name')->where('tenant_id', $booking->tenant_id)->where('group_code', $booking->group_code)
                ->get()->map(fn (Booking $b) => ['id' => $b->id, 'unit' => $b->room?->name, 'status' => $b->status]) : [],
        ]);
    }

    /** Which units are free for the dates, with the price each would cost. Staff skip the advance-notice window. */
    public function availability(Request $request, AvailabilityService $availability, PricingService $pricing)
    {
        $data = $request->validate(['check_in' => 'required|date_format:Y-m-d', 'check_out' => 'required|date_format:Y-m-d|after:check_in',
            'guests' => 'nullable|integer|min:1|max:100']);
        $guests = (int) ($data['guests'] ?? 1);
        $rooms = Room::with('property.tenant')->where('tenant_id', $request->user()->tenant_id)->where('active', true)->orderBy('name')->get();
        $nights = (int) CarbonImmutable::parse($data['check_in'])->diffInDays(CarbonImmutable::parse($data['check_out']));

        $settings = $request->user()->tenant->settings;

        return response()->json(['nights' => $nights, 'check_in_time' => $settings['check_in_time'], 'check_out_time' => $settings['check_out_time'], 'units' => $rooms->map(function (Room $room) use ($data, $guests, $availability, $pricing) {
            $error = $availability->stayLengthError($room, $data['check_in'], $data['check_out']);
            $free = ! $error && $availability->available($room, $data['check_in'], $data['check_out']);
            $total = null;
            if (! $error) {
                try {
                    $total = $pricing->quote($room, $data['check_in'], $data['check_out'], min($guests, $room->maximum_occupancy))['total'];
                } catch (\InvalidArgumentException) {
                    $total = null;
                }
            }

            return ['id' => $room->id, 'name' => $room->name, 'property' => $room->property->name, 'max_guests' => $room->maximum_occupancy,
                'available' => $free, 'reason' => $error ?? ($free ? null : 'Booked or blocked for these dates'), 'total' => $total];
        })->values()]);
    }

    public function store(Request $request, BookingService $service)
    {
        $data = $request->validate(['room_id' => 'required_without:room_ids|integer', 'room_ids' => 'nullable|array|min:1|max:20', 'room_ids.*' => 'integer|distinct',
            'check_in' => 'required|date|after_or_equal:today', 'check_out' => 'required|date|after:check_in', 'guests' => 'required|integer|min:1|max:100',
            'guest_name' => 'required|string|max:120', 'guest_email' => 'nullable|email|max:255', 'guest_phone' => 'nullable|string|max:120',
            'source' => 'nullable|in:'.implode(',', array_keys(Booking::SOURCES)), 'check_in_time' => 'nullable|date_format:H:i',
            'check_out_time' => 'nullable|date_format:H:i', 'notes' => 'nullable|string|max:1000', 'confirm' => 'nullable|boolean']);
        $roomIds = $data['room_ids'] ?? [$data['room_id']];
        $rooms = Room::where('tenant_id', $request->user()->tenant_id)->where('active', true)->whereIn('id', $roomIds)->get()->keyBy('id');
        abort_unless($rooms->count() === count(array_unique($roomIds)), 404);
        $group = count($roomIds) > 1 ? 'GRP-'.strtoupper(substr((string) Str::ulid(), -8)) : null;
        foreach ($rooms as $room) {
            if ($data['guests'] > $room->maximum_occupancy) {
                throw ValidationException::withMessages(['guests' => "{$room->name} fits up to {$room->maximum_occupancy} guests."]);
            }
        }
        $bookings = DB::transaction(fn () => collect($roomIds)->map(function (int $id) use ($rooms, $data, $service, $group, $request) {
            $booking = $service->create($rooms[$id], [...$data, 'group_code' => $group]);
            if ($request->boolean('confirm')) {
                $booking->update(['status' => 'CONFIRMED', 'expires_at' => null]);
            }
            $this->audit($request, $booking, 'booking.manual_created');

            return $booking;
        }));

        return back()->with('success', $bookings->count() > 1
            ? "Group booking created: {$bookings->count()} units ({$group})."
            : 'Booking created: '.$bookings->first()->reference);
    }

    /** Front-desk edits that don't change price or dates. */
    public function update(Request $request, Booking $booking)
    {
        abort_unless($booking->tenant_id === $request->user()->tenant_id, 404);
        $data = $request->validate(['guest_name' => 'required|string|max:120', 'guest_email' => 'nullable|email|max:255',
            'guest_phone' => 'nullable|string|max:120', 'source' => 'required|in:'.implode(',', array_keys(Booking::SOURCES)),
            'check_in_time' => 'nullable|date_format:H:i', 'check_out_time' => 'nullable|date_format:H:i', 'notes' => 'nullable|string|max:1000']);
        $booking->update($data);
        $this->audit($request, $booking, 'booking.updated');

        return back()->with('success', 'Booking details saved.');
    }

    public function status(Request $request, Booking $booking)
    {
        abort_unless($booking->tenant_id === $request->user()->tenant_id, 404);
        $data = $request->validate(['status' => 'required|in:CONFIRMED,CHECKED_IN,CHECKED_OUT,COMPLETED,CANCELLED,NO_SHOW']);
        abort_if(in_array($booking->status, ['PENDING', 'AWAITING_PAYMENT'], true) && $booking->expires_at?->isPast(), 422);
        abort_unless(in_array($data['status'], self::TRANSITIONS[$booking->status] ?? [], true), 422);
        if ($data['status'] === 'CHECKED_OUT' && ($open = $booking->openCharges()) > 0) {
            throw ValidationException::withMessages(['status' => 'Settle '.number_format($open, 2).' in room charges before checking out.']);
        }
        $booking->update(['status' => $data['status'], 'expires_at' => null]);
        $this->audit($request, $booking, 'booking.status_changed');

        return back()->with('success', match ($data['status']) {
            'CHECKED_IN' => $booking->guest_name.' checked in.', 'CHECKED_OUT' => $booking->guest_name.' checked out.',
            default => 'Booking updated.',
        });
    }

    public function payment(Request $request, Booking $booking, GuestMessenger $messenger)
    {
        abort_unless($booking->tenant_id === $request->user()->tenant_id, 404);
        $data = $request->validate(['amount' => 'required|numeric|min:0.01', 'method' => 'required|in:cash,bank_transfer,gcash,maya',
            'payer_reference' => 'nullable|string|max:100']);
        abort_unless(! in_array($booking->status, ['CANCELLED', 'EXPIRED', 'COMPLETED'], true), 422);
        abort_if(in_array($booking->status, ['PENDING', 'AWAITING_PAYMENT'], true) && $booking->expires_at?->isPast(), 422);
        $statusBefore = $booking->status;
        $booking = DB::transaction(function () use ($request, $booking, $data) {
            $booking = Booking::whereKey($booking->id)->lockForUpdate()->firstOrFail();
            abort_unless($booking->paidAmount() + (float) $data['amount'] <= (float) $booking->total + 0.001, 422);
            Payment::create(['tenant_id' => $booking->tenant_id, 'booking_id' => $booking->id,
                'method' => $data['method'], 'provider' => 'manual', 'status' => 'PAID', 'amount' => $data['amount'],
                'reference' => 'PAY-'.strtoupper(substr((string) Str::ulid(), -10)), 'payer_reference' => $data['payer_reference'] ?? null, 'paid_at' => now()]);
            $booking->syncPaymentStatus();
            $this->audit($request, $booking, 'payment.recorded');

            return $booking;
        });
        $this->receipt($messenger, $booking, $statusBefore);

        return back()->with('success', 'Payment recorded.');
    }

    /** Pay off every POS purchase charged to the room, usually at check-out. */
    public function settleCharges(Request $request, Booking $booking, PosService $pos)
    {
        abort_unless($booking->tenant_id === $request->user()->tenant_id, 404);
        $data = $request->validate(['method' => 'required|in:cash,gcash,maya,card,bank_transfer', 'reference' => 'nullable|string|max:100']);
        $settled = $pos->settle($request->user(), $booking->posSales()->where('status', 'UNPAID')->get(), $data['method'], $data['reference'] ?? null);
        abort_if($settled <= 0, 422, 'There are no open room charges.');

        return back()->with('success', 'Room charges settled.');
    }

    /** Confirm or reject a payment the guest reported at checkout (GCash, bank transfer, …). */
    public function review(Request $request, Payment $payment, GuestMessenger $messenger)
    {
        abort_unless($payment->tenant_id === $request->user()->tenant_id, 404);
        $data = $request->validate(['decision' => 'required|in:approve,reject', 'amount' => 'nullable|numeric|min:0.01']);
        abort_unless($payment->status === 'PENDING', 422);
        $statusBefore = $payment->booking->status;
        $booking = DB::transaction(function () use ($request, $payment, $data) {
            $booking = Booking::whereKey($payment->booking_id)->lockForUpdate()->firstOrFail();
            if ($data['decision'] === 'approve') {
                $amount = (float) ($data['amount'] ?? $payment->amount);
                abort_unless($booking->paidAmount() + $amount <= (float) $booking->total + 0.001, 422);
                $payment->update(['status' => 'PAID', 'amount' => $amount, 'paid_at' => now()]);
            } else {
                $payment->update(['status' => 'FAILED']);
            }
            $booking->syncPaymentStatus();
            $this->audit($request, $booking, $data['decision'] === 'approve' ? 'payment.approved' : 'payment.rejected');

            return $booking;
        });
        if ($data['decision'] === 'approve') {
            $this->receipt($messenger, $booking, $statusBefore);
        }

        return back()->with('success', $data['decision'] === 'approve' ? 'Payment approved.' : 'Payment rejected. The guest can pay again before the hold ends.');
    }

    /** A payment that confirms the booking is covered by the confirmation email; later payments get a receipt. */
    private function receipt(GuestMessenger $messenger, Booking $booking, string $statusBefore): void
    {
        if (! ($booking->status === 'CONFIRMED' && $statusBefore !== 'CONFIRMED')) {
            $messenger->send($booking->fresh(), 'payment_received');
        }
    }

    private function audit(Request $request, Booking $booking, string $action): void
    {
        AuditLog::create(['actor_user_id' => $request->user()->id, 'tenant_id' => $booking->tenant_id,
            'action' => $action, 'entity_type' => 'Booking', 'entity_id' => $booking->id,
            'metadata' => ['reference' => $booking->reference, 'status' => $booking->status], 'ip_address' => $request->ip()]);
    }
}
