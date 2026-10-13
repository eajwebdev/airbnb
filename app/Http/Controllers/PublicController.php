<?php

namespace App\Http\Controllers;

use App\Models\AddOn;
use App\Models\Booking;
use App\Models\PromoCode;
use App\Models\Property;
use App\Models\Room;
use App\Models\Tenant;
use App\Services\AvailabilityService;
use App\Payments\PaymentService;
use App\Services\BookingService;
use App\Services\GuestMessenger;
use App\Services\PricingService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PublicController extends Controller
{
    public function home(Request $request)
    {
        $tenant = $this->siteTenant($request);

        return Inertia::render('Public/Home', ['tenant' => $tenant,
            'featured' => $tenant ? Property::with(['rooms' => fn ($rooms) => $rooms->where('active', true)])->where('tenant_id', $tenant->id)->where('status', 'PUBLISHED')->where('featured', true)->get() : [],
            'hero' => $tenant ? Property::where('tenant_id', $tenant->id)->where('status', 'PUBLISHED')->whereNotNull('cover_image')->first() : null]);
    }

    public function platform()
    {
        return Inertia::render('Platform/Home');
    }

    public function stays(Request $request, AvailabilityService $availability)
    {
        $tenant = $this->siteTenant($request);
        $filters = $request->validate([
            'location' => ['nullable', 'string', 'max:120'],
            'check_in' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:today'],
            'check_out' => ['nullable', 'date_format:Y-m-d', 'after:check_in'],
            'guests' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        if ($request->filled('check_in') xor $request->filled('check_out')) {
            throw ValidationException::withMessages(['check_out' => 'Choose both check-in and check-out dates.']);
        }
        if ($tenant && ! empty($filters['check_in']) && ! empty($filters['check_out'])) {
            if ($error = $availability->bookingWindowError($tenant, $filters['check_in'])) {
                throw ValidationException::withMessages(['check_in' => $error]);
            }
            if ($error = $availability->searchLengthError($tenant, $filters['check_in'], $filters['check_out'])) {
                throw ValidationException::withMessages(['check_out' => $error]);
            }
        }
        $q = Property::with(['rooms' => fn ($rooms) => $rooms->where('active', true)])->where('status', 'PUBLISHED');
        $q->where('tenant_id', $tenant?->id ?? 0);
        if (! empty($filters['location'])) {
            $q->where(fn ($query) => $query->where('city', 'like', '%'.$filters['location'].'%')->orWhere('province', 'like', '%'.$filters['location'].'%')->orWhere('name', 'like', '%'.$filters['location'].'%'));
        }
        if (! empty($filters['check_in']) && ! empty($filters['check_out'])) {
            $matching = $q->get()->filter(fn (Property $property) => $property->rooms->contains(fn (Room $room) => $room->maximum_occupancy >= ($filters['guests'] ?? 1) && $availability->available($room, $filters['check_in'], $filters['check_out'])))->pluck('id');
            $q->whereIn('id', $matching);
        } elseif (! empty($filters['guests'])) {
            $q->whereHas('rooms', fn ($rooms) => $rooms->where('maximum_occupancy', '>=', $filters['guests'])->where('active', true));
        }

        return Inertia::render('Public/Stays', ['tenant' => $tenant, 'properties' => $q->paginate(12)->withQueryString(), 'filters' => $filters]);
    }

    public function show(Request $request, Property $property)
    {
        abort_unless($property->status === 'PUBLISHED', 404);
        $selection = $request->validate([
            'check_in' => ['nullable', 'date_format:Y-m-d'],
            'check_out' => ['nullable', 'date_format:Y-m-d', 'after:check_in'],
            'guests' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        if (isset($selection['guests'])) {
            $selection['guests'] = (int) $selection['guests'];
        }

        $property->load(['rooms' => fn ($rooms) => $rooms->where('active', true), 'tenant']);
        $addOns = AddOn::where('tenant_id', $property->tenant_id)->where('active', true)->orderBy('sort_order')->orderBy('id')
            ->get(['id', 'name', 'description', 'price', 'pricing', 'max_quantity', 'room_ids'])
            ->filter(fn (AddOn $addOn) => $property->rooms->contains(fn (Room $room) => $addOn->appliesToRoom($room->id)))->values();

        return Inertia::render('Public/Stay', ['property' => $property, 'tenant' => $property->tenant, 'bookable' => $property->tenant->acceptsBookings(),
            'selection' => $selection, 'addOns' => $addOns]);
    }

    public function availability(Request $request, AvailabilityService $service)
    {
        $data = $request->validate(['room_id' => 'required|exists:rooms,id', 'check_in' => 'required|date|after_or_equal:today', 'check_out' => 'required|date|after:check_in']);

        $room = Room::with('property.tenant')->findOrFail($data['room_id']);
        $message = $service->bookingWindowError($room->property->tenant, $data['check_in'])
            ?? $service->stayLengthError($room, $data['check_in'], $data['check_out']);

        return response()->json(['available' => ! $message && $service->available($room, $data['check_in'], $data['check_out']), 'message' => $message]);
    }

    /** Live price breakdown for the stay page, using the same rules as booking. */
    public function quote(Request $request, AvailabilityService $availability, PricingService $pricing)
    {
        if ($request->query() === [] && $request->acceptsHtml()) {
            return redirect()->route('quotation');
        }

        $data = $request->validate(['room_id' => 'required|exists:rooms,id', 'check_in' => 'required|date_format:Y-m-d|after_or_equal:today',
            'check_out' => 'required|date_format:Y-m-d|after:check_in', 'guests' => 'required|integer|min:1|max:100',
            'promo_code' => 'nullable|string|max:20', 'add_ons' => 'nullable|array|max:30', 'add_ons.*' => 'integer|min:0|max:50']);
        $room = Room::with('property.tenant')->findOrFail($data['room_id']);
        abort_unless($room->active && $room->property->status === 'PUBLISHED', 404);
        if ($data['guests'] > $room->maximum_occupancy) {
            throw ValidationException::withMessages(['guests' => "This room fits up to {$room->maximum_occupancy} guests."]);
        }
        $tenant = $room->property->tenant;
        if ($error = $availability->bookingWindowError($tenant, $data['check_in'])) {
            throw ValidationException::withMessages(['check_in' => $error]);
        }
        if ($error = $availability->stayLengthError($room, $data['check_in'], $data['check_out'])) {
            throw ValidationException::withMessages(['check_out' => $error]);
        }
        $nights = (int) CarbonImmutable::parse($data['check_in'])->diffInDays(CarbonImmutable::parse($data['check_out']));
        $promo = filled($data['promo_code'] ?? null) ? PromoCode::findForStay($tenant->id, $data['promo_code'], $nights) : null;

        return response()->json(['nights' => $nights, 'tax_label' => $tenant->setting('tax_label'),
            ...$pricing->quote($room, $data['check_in'], $data['check_out'], (int) $data['guests'], $promo, $data['add_ons'] ?? [])]);
    }

    public function book(Request $request, BookingService $service, AvailabilityService $availability)
    {
        $data = $request->validate([
            'room_id' => 'required|exists:rooms,id', 'check_in' => 'required|date|after_or_equal:today',
            'check_out' => 'required|date|after:check_in', 'guests' => 'required|integer|min:1|max:100',
            'guest_name' => 'required|string|max:120', 'guest_email' => 'required|email|max:255', 'guest_phone' => 'nullable|string|max:30',
            'promo_code' => 'nullable|string|max:20', 'add_ons' => 'nullable|array|max:30', 'add_ons.*' => 'integer|min:0|max:50',
        ]);
        $room = Room::with('property.tenant')->findOrFail($data['room_id']);
        abort_unless($room->property->status === 'PUBLISHED' && $data['guests'] <= $room->maximum_occupancy, 422);
        if ($error = $availability->bookingWindowError($room->property->tenant, $data['check_in'])) {
            throw ValidationException::withMessages(['check_in' => $error]);
        }
        $booking = $service->create($room, [...$data, 'source' => 'website'], $request->user()?->id);
        $request->session()->put('booking_reference', $booking->reference);

        return redirect()->route('checkout.show', $booking->reference);
    }

    public function checkout(Request $request, string $reference, PaymentService $payments)
    {
        $booking = Booking::with('property.tenant', 'room', 'price')->where('reference', $reference)->firstOrFail();
        abort_unless(($request->user() && $request->user()->id === $booking->user_id) || $request->session()->get('booking_reference') === $reference, 403);

        return Inertia::render('Public/Checkout', ['booking' => $booking, 'tenant' => $booking->property->tenant,
            'paymentOptions' => $payments->options($booking->property->tenant), 'amountDueNow' => $booking->amountDueNow()]);
    }

    public function pay(Request $request, string $reference, PaymentService $payments, GuestMessenger $messenger)
    {
        $data = $request->validate(['method' => 'required|string|max:30', 'payer_reference' => 'nullable|string|max:100', 'accept_policies' => 'boolean']);
        $booking = Booking::where('reference', $reference)->firstOrFail();
        abort_unless(($request->user() && $request->user()->id === $booking->user_id) || $request->session()->get('booking_reference') === $reference, 403);
        abort_unless($booking->tenant->acceptsBookings() && in_array($booking->status, ['PENDING', 'AWAITING_PAYMENT'], true) && $booking->expires_at?->isFuture(), 422);
        $settings = $booking->tenant->settings;
        if (($settings['house_rules'] !== '' || $settings['cancellation_policy'] !== '') && ! ($data['accept_policies'] ?? false)) {
            throw ValidationException::withMessages(['accept_policies' => 'Please accept the house rules and cancellation policy to continue.']);
        }
        $gateway = $payments->gateway($booking->tenant, $data['method']);
        if (! $gateway) {
            throw ValidationException::withMessages(['method' => 'Choose one of the payment options shown.']);
        }
        $payment = DB::transaction(function () use ($booking, $data, $gateway) {
            $booking = Booking::whereKey($booking->id)->lockForUpdate()->firstOrFail();
            abort_unless(in_array($booking->status, ['PENDING', 'AWAITING_PAYMENT'], true) && $booking->expires_at?->isFuture(), 422);

            $booking->update(['policies_accepted_at' => ($data['accept_policies'] ?? false) ? now() : null]);

            return $gateway->start($booking, $data);
        });
        if ($payment->status === 'PENDING') {
            $messenger->send($booking->fresh(), 'booking_received');
        }

        return redirect()->route('booking.success', $booking->reference);
    }

    public function success(Request $request, string $reference, PaymentService $payments)
    {
        $booking = Booking::with('property.tenant', 'room', 'payments')->where('reference', $reference)->firstOrFail();
        abort_unless(($request->user() && $request->user()->id === $booking->user_id) || $request->session()->get('booking_reference') === $reference, 403);
        $pending = $booking->payments->firstWhere('status', 'PENDING');

        return Inertia::render('Public/Success', ['booking' => $booking->makeHidden('payments'), 'tenant' => $booking->property->tenant,
            'pendingPayment' => $pending ? [...$pending->only('method', 'amount', 'payer_reference'),
                'option' => collect($payments->options($booking->tenant))->firstWhere('method', $pending->method)] : null,
            'amountPaid' => $booking->paidAmount(), 'balanceDue' => $booking->balanceDue()]);
    }

    public function legal(Request $request, string $page)
    {
        $tenant = $this->siteTenant($request);
        $key = ['privacy' => 'privacy_policy', 'terms' => 'terms_of_service'][$page];
        abort_unless($tenant && $tenant->setting($key) !== '', 404);

        return Inertia::render('Public/Legal', ['tenant' => $tenant, 'page' => $page,
            'title' => $page === 'privacy' ? 'Privacy policy' : 'Terms of service', 'body' => $tenant->setting($key)]);
    }

    private function siteTenant(Request $request): ?Tenant
    {
        if ($request->filled('tenant')) {
            return Tenant::where('slug', $request->input('tenant'))->firstOrFail();
        }

        return Tenant::where('status', 'ACTIVE')->orderBy('id')->first();
    }
}
