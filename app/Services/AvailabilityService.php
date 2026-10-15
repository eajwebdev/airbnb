<?php

namespace App\Services;

use App\Models\BlockedDate;
use App\Models\Booking;
use App\Models\Room;
use App\Models\SeasonalRate;
use App\Models\Tenant;
use Carbon\CarbonImmutable;

class AvailabilityService
{
    public function available(Room $room, string $checkIn, string $checkOut): bool
    {
        $start = CarbonImmutable::parse($checkIn);
        $end = CarbonImmutable::parse($checkOut);
        $tenant = $room->property->tenant;
        if ($checkIn >= $checkOut || $this->stayLengthError($room, $checkIn, $checkOut) || ! $room->active || ! $tenant->acceptsBookings()) {
            return false;
        }
        $blocked = BlockedDate::where('room_id', $room->id)
            ->whereDate('starts_on', '<', $checkOut)->whereDate('ends_on', '>', $checkIn)->exists();
        if ($blocked) {
            return false;
        }
        $bookings = Booking::where('room_id', $room->id)
            ->whereDate('check_in', '<', $checkOut)->whereDate('check_out', '>', $checkIn)
            ->where(function ($q) {
                $q->whereIn('status', Booking::OCCUPYING)
                    ->orWhere(function ($hold) {
                        $hold->whereIn('status', ['PENDING', 'AWAITING_PAYMENT'])->where('expires_at', '>', now());
                    });
            })->get(['check_in', 'check_out']);
        for ($night = $start; $night->lt($end); $night = $night->addDay()) {
            $date = $night->toDateString();
            $occupied = $bookings->filter(fn (Booking $booking) => $booking->check_in->toDateString() <= $date && $booking->check_out->toDateString() > $date)->count();
            if ($occupied >= $room->quantity) {
                return false;
            }
        }

        return true;
    }

    public function stayLengthError(Room $room, string $checkIn, string $checkOut): ?string
    {
        $nights = $this->nights($checkIn, $checkOut);
        if ($error = $this->lengthMessage($nights, ...$room->stayLimits())) {
            return $error;
        }
        $season = SeasonalRate::forStay($room, $checkIn, $checkOut)
            ->filter(fn (SeasonalRate $season) => $season->min_nights > $nights)->sortByDesc('min_nights')->first();

        return $season ? "Stays during {$season->name} need at least {$season->min_nights} nights." : null;
    }

    /** For catalog search: only an error when no active room of the tenant accepts this many nights. */
    public function searchLengthError(Tenant $tenant, string $checkIn, string $checkOut): ?string
    {
        $nights = $this->nights($checkIn, $checkOut);
        $limits = Room::where('tenant_id', $tenant->id)->where('active', true)->get()
            ->map(fn (Room $room) => $room->stayLimits($tenant->settings));
        if ($limits->contains(fn (array $limit) => ! $this->lengthMessage($nights, ...$limit))) {
            return null;
        }

        return $this->lengthMessage($nights, $limits->min(0) ?? $tenant->setting('min_nights'), $limits->max(1) ?? $tenant->setting('max_nights'));
    }

    private function nights(string $checkIn, string $checkOut): int
    {
        return (int) CarbonImmutable::parse($checkIn)->diffInDays(CarbonImmutable::parse($checkOut));
    }

    private function lengthMessage(int $nights, int $min, int $max): ?string
    {
        return match (true) {
            $nights < $min => "Stays require at least {$min} ".str('night')->plural($min).'.',
            $nights > $max => "Stays are limited to {$max} ".str('night')->plural($max).'.',
            default => null,
        };
    }

    /** Guest-facing limits on how soon and how far ahead a stay can start. Staff bookings skip these. */
    public function bookingWindowError(Tenant $tenant, string $checkIn): ?string
    {
        $start = CarbonImmutable::parse($checkIn)->startOfDay();
        ['advance_notice_days' => $notice, 'booking_window_days' => $window] = $tenant->settings;
        if ($start->lt(today()->addDays($notice))) {
            return $notice === 0 ? 'Choose a check-in date from today onward.'
                : "Bookings need at least {$notice} ".str('day')->plural($notice).' notice.';
        }
        if ($start->gt(today()->addDays($window))) {
            return "Bookings open up to {$window} days ahead.";
        }

        return null;
    }
}
