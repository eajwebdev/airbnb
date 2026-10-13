<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\PosSale;
use App\Models\Room;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/** Front-desk view of a single day: who arrives, who leaves, who stays, and what is owed. */
class OperationsService
{
    /** Statuses that still expect the guest to arrive or that are already in the unit. */
    public const ACTIVE = ['PENDING', 'AWAITING_PAYMENT', 'PAID', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED'];

    public function inventory(int $tenantId): int
    {
        return (int) Room::where('tenant_id', $tenantId)->where('active', true)->sum('quantity');
    }

    /** Bookings touching the day that are not cancelled, expired or lapsed holds. */
    public function bookingsAround(int $tenantId, CarbonImmutable $from, CarbonImmutable $to): Collection
    {
        return Booking::with('room:id,name,property_id', 'property:id,name')
            ->withSum(['payments as paid_amount' => fn ($q) => $q->where('status', 'PAID')], 'amount')
            ->withSum(['posSales as open_charges' => fn ($q) => $q->where('status', 'UNPAID')], 'total')
            ->where('tenant_id', $tenantId)->whereIn('status', self::ACTIVE)
            ->whereDate('check_in', '<=', $to->toDateString())->whereDate('check_out', '>=', $from->toDateString())
            ->where(fn ($q) => $q->whereNotIn('status', ['PENDING', 'AWAITING_PAYMENT'])->orWhereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->orderBy('check_in')->get();
    }

    public function day(int $tenantId, CarbonImmutable $date, array $settings): array
    {
        $date = $date->startOfDay();
        $iso = $date->toDateString();
        $bookings = $this->bookingsAround($tenantId, $date, $date);
        $arrivals = $bookings->filter(fn (Booking $b) => $b->check_in->toDateString() === $iso && $b->status !== 'NO_SHOW');
        $departures = $bookings->filter(fn (Booking $b) => $b->check_out->toDateString() === $iso);
        $inHouse = $bookings->filter(fn (Booking $b) => $b->check_in->toDateString() <= $iso && $b->check_out->toDateString() > $iso);
        $inventory = $this->inventory($tenantId);
        $occupied = $inHouse->count();
        $revenue = fn (CarbonImmutable $day) => round((float) Payment::where('tenant_id', $tenantId)->where('status', 'PAID')
            ->whereBetween('paid_at', [$day->startOfDay(), $day->endOfDay()])->sum('amount')
            + (float) PosSale::where('tenant_id', $tenantId)->where('status', 'PAID')
                ->whereBetween('paid_at', [$day->startOfDay(), $day->endOfDay()])->sum('total'), 2);
        $balance = fn (Collection $list) => round($list->sum(fn (Booking $b) => $this->balance($b)), 2);

        return [
            'date' => $iso,
            'inventory' => $inventory,
            'occupied' => min($occupied, $inventory),
            'occupancy' => $inventory > 0 ? round(100 * min($occupied, $inventory) / $inventory) : 0,
            'arrivals' => $arrivals->values()->map(fn (Booking $b) => $this->row($b, $settings, 'arrival'))->all(),
            'departures' => $departures->values()->map(fn (Booking $b) => $this->row($b, $settings, 'departure'))->all(),
            'inHouse' => $inHouse->count(),
            'revenueToday' => $revenue($date),
            'revenueYesterday' => $revenue($date->subDay()),
            'revenueWeek' => collect(range(6, 0))->map(fn (int $back) => $revenue($date->subDays($back)))->all(),
            'balanceDue' => $balance($arrivals->merge($inHouse)->unique('id')),
            'balanceAtCheckIn' => $balance($arrivals),
        ];
    }

    /** Stay balance plus any POS purchases charged to the room. */
    public function balance(Booking $booking): float
    {
        return max(0, round((float) $booking->total - (float) ($booking->paid_amount ?? 0), 2)) + round((float) ($booking->open_charges ?? 0), 2);
    }

    public function row(Booking $b, array $settings, string $kind): array
    {
        [$in, $out] = $b->times($settings);

        return ['id' => $b->id, 'reference' => $b->reference, 'guest_name' => $b->guest_name, 'guest_phone' => $b->guest_phone,
            'unit' => $b->room?->name, 'property' => $b->property?->name, 'room_id' => $b->room_id, 'guests' => $b->guests,
            'check_in' => $b->check_in->toDateString(), 'check_out' => $b->check_out->toDateString(),
            'time' => $kind === 'arrival' ? $in : $out, 'check_in_time' => $in, 'check_out_time' => $out,
            'nights' => (int) $b->check_in->diffInDays($b->check_out), 'status' => $b->status, 'payment_status' => $b->payment_status,
            'source' => $b->source ?? 'direct', 'total' => (float) $b->total, 'paid' => round((float) ($b->paid_amount ?? 0), 2),
            'open_charges' => round((float) ($b->open_charges ?? 0), 2), 'balance' => $this->balance($b)];
    }
}
