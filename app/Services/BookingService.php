<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\PromoCode;
use App\Models\Room;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BookingService
{
    public function __construct(private AvailabilityService $availability, private PricingService $pricing) {}

    public function create(Room $room, array $data, ?int $userId = null): Booking
    {
        return DB::transaction(function () use ($room, $data, $userId) {
            $room = Room::with('property.tenant')->whereKey($room->id)->lockForUpdate()->firstOrFail();
            $settings = $room->property->tenant->settings;
            if ($error = $this->availability->stayLengthError($room, $data['check_in'], $data['check_out'])) {
                throw ValidationException::withMessages(['check_out' => $error]);
            }
            if (! $this->availability->available($room, $data['check_in'], $data['check_out'])) {
                throw ValidationException::withMessages(['check_in' => 'This room is unavailable for those dates.']);
            }
            $nights = (int) CarbonImmutable::parse($data['check_in'])->diffInDays(CarbonImmutable::parse($data['check_out']));
            $promo = filled($data['promo_code'] ?? null) ? PromoCode::findForStay($room->tenant_id, $data['promo_code'], $nights, lock: true) : null;
            try {
                $quote = $this->pricing->quote($room, $data['check_in'], $data['check_out'], (int) $data['guests'], $promo, $data['add_ons'] ?? []);
            } catch (\InvalidArgumentException $e) {
                throw ValidationException::withMessages(['check_out' => $e->getMessage()]);
            }
            $booking = Booking::create([
                'reference' => $settings['reference_prefix'].'-'.now()->format('Y').'-'.strtoupper(substr((string) Str::ulid(), -8)),
                'tenant_id' => $room->tenant_id, 'property_id' => $room->property_id, 'room_id' => $room->id,
                'user_id' => $userId, 'guest_name' => $data['guest_name'], 'guest_email' => $data['guest_email'] ?? null,
                'guest_phone' => $data['guest_phone'] ?? null, 'check_in' => $data['check_in'],
                'source' => $data['source'] ?? 'direct', 'group_code' => $data['group_code'] ?? null, 'notes' => $data['notes'] ?? null,
                'check_in_time' => $data['check_in_time'] ?? null, 'check_out_time' => $data['check_out_time'] ?? null,
                'check_out' => $data['check_out'], 'guests' => $data['guests'], 'total' => $quote['total'], 'promo_code_id' => $promo?->id,
                ...$this->depositTerms($quote['total'], $data['check_in'], $settings),
                'expires_at' => now()->addMinutes($settings['hold_minutes']),
            ]);
            $booking->price()->create($quote);
            AuditLog::create(['actor_user_id' => $userId, 'tenant_id' => $booking->tenant_id,
                'action' => 'booking.created', 'entity_type' => 'Booking', 'entity_id' => $booking->id,
                'metadata' => ['reference' => $booking->reference, 'total' => $booking->total]]);

            return $booking;
        });
    }

    private function depositTerms(float $total, string $checkIn, array $settings): array
    {
        $percent = $settings['deposit_percent'];
        if ($percent >= 100) {
            return ['deposit_amount' => $total, 'balance_due_on' => null];
        }
        $due = CarbonImmutable::parse($checkIn)->subDays($settings['balance_due_days']);

        return ['deposit_amount' => round($total * $percent / 100, 2), 'balance_due_on' => ($due->lt(today()) ? today() : $due)->toDateString()];
    }
}
