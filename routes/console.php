<?php

use App\Models\Booking;
use App\Models\Tenant;
use App\Services\GuestMessenger;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('bookings:expire-holds', function () {
    $count = Booking::whereIn('status', ['PENDING', 'AWAITING_PAYMENT'])
        ->where('expires_at', '<=', now())->update(['status' => 'EXPIRED']);
    $this->info("Expired {$count} booking holds.");
})->purpose('Expire checkout holds that have passed their deadline');

Artisan::command('subscriptions:expire', function () {
    $active = Tenant::where('subscription_status', 'ACTIVE')->where('subscription_ends_at', '<=', now())
        ->update(['subscription_status' => 'EXPIRED']);
    $trials = Tenant::where('subscription_status', 'TRIAL')->where('trial_ends_at', '<=', now())
        ->update(['subscription_status' => 'EXPIRED']);
    $this->info('Expired '.($active + $trials).' subscriptions.');
})->purpose('Expire ended subscriptions and trials');

Artisan::command('bookings:send-reminders', function (GuestMessenger $messenger) {
    $sent = 0;
    Tenant::where('status', 'ACTIVE')->each(function (Tenant $tenant) use ($messenger, &$sent) {
        $template = $messenger->template($tenant, 'pre_arrival');
        if (! $template['enabled']) {
            return;
        }
        // A window rather than an exact day, so a missed run still catches up; send() skips bookings already reminded.
        Booking::where('tenant_id', $tenant->id)->where('status', 'CONFIRMED')
            ->whereDate('check_in', '>=', today())->whereDate('check_in', '<=', today()->addDays((int) $template['send_days_before']))
            ->each(function (Booking $booking) use ($messenger, &$sent) {
                $sent += $messenger->send($booking, 'pre_arrival')?->status === 'SENT' ? 1 : 0;
            });
    });
    $this->info("Sent {$sent} pre-arrival reminders.");
})->purpose('Email guests before their stay');

Schedule::command('bookings:expire-holds')->everyMinute()->withoutOverlapping();
Schedule::command('subscriptions:expire')->daily()->withoutOverlapping();
Schedule::command('bookings:send-reminders')->hourly()->withoutOverlapping();
