<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\PosItem;
use App\Models\Property;
use App\Models\Room;
use App\Services\CleaningService;
use App\Services\DashboardMetrics;
use App\Services\DashboardPeriod;
use App\Services\OperationsService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function admin(Request $request, OperationsService $operations, CleaningService $cleaning)
    {
        if ($request->user()->role === 'STAFF') {
            return redirect()->route('admin.tasks.mine');
        }
        $data = $request->validate(['date' => ['nullable', 'date_format:Y-m-d'], 'months' => ['nullable', 'in:3,6,12']]);
        $tenant = $request->user()->tenant;
        $settings = $tenant->settings;
        $date = CarbonImmutable::parse($data['date'] ?? today()->toDateString());
        $day = $operations->day($tenant->id, $date, $settings);
        $tasks = $cleaning->forDay($tenant->id, $date, $settings);

        return Inertia::render('Admin/Dashboard', [
            'tenant' => $tenant->only('business_name', 'subscription_status'),
            'today' => today()->toDateString(),
            'day' => $day,
            'properties' => Property::where('tenant_id', $tenant->id)->count(),
            'units' => Room::where('tenant_id', $tenant->id)->where('active', true)->count(),
            'trend' => $this->revenueTrend($tenant->id, (int) ($data['months'] ?? 12)),
            'months' => (int) ($data['months'] ?? 12),
            'target' => $settings['monthly_revenue_target'],
            'attention' => $this->attention($tenant->id, $date, $settings, $tasks->all(), $day),
            'cleaning' => $tasks,
        ]);
    }

    /** Arrivals and departures for one day as a spreadsheet for the front desk. */
    public function exportDay(Request $request, OperationsService $operations)
    {
        $data = $request->validate(['date' => ['nullable', 'date_format:Y-m-d']]);
        $tenant = $request->user()->tenant;
        $date = CarbonImmutable::parse($data['date'] ?? today()->toDateString());
        $day = $operations->day($tenant->id, $date, $tenant->settings);

        return response()->streamDownload(function () use ($day) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Type', 'Time', 'Guest', 'Contact', 'Unit', 'Guests', 'Nights', 'Source', 'Status', 'Total', 'Paid', 'Balance', 'Reference']);
            foreach (['arrivals' => 'Arrival', 'departures' => 'Departure'] as $key => $label) {
                foreach ($day[$key] as $row) {
                    fputcsv($out, array_map(fn ($v) => preg_match('/^[\s]*[=+\-@]/u', (string) $v) ? "'".$v : $v, [$label, $row['time'], $row['guest_name'],
                        $row['guest_phone'], $row['unit'], $row['guests'], $row['nights'], $row['source'], $row['status'],
                        $row['total'], $row['paid'], $row['balance'], $row['reference']]));
                }
            }
            fclose($out);
        }, 'front-desk_'.$date->toDateString().'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** Booked stay value per check-in month, oldest first, ending with the current month. */
    private function revenueTrend(int $tenantId, int $months): array
    {
        $start = CarbonImmutable::today()->startOfMonth()->subMonths($months - 1);
        $bookings = Booking::where('tenant_id', $tenantId)->whereIn('status', Booking::OCCUPYING)
            ->whereDate('check_in', '>=', $start->toDateString())->whereDate('check_in', '<=', today()->endOfMonth()->toDateString())
            ->get(['check_in', 'total']);

        return collect(range(0, $months - 1))->map(function (int $i) use ($start, $bookings) {
            $month = $start->addMonths($i);

            return ['month' => $month->format('Y-m'), 'label' => $month->format('M'),
                'booked' => round((float) $bookings->filter(fn (Booking $b) => $b->check_in->format('Y-m') === $month->format('Y-m'))->sum('total'), 2)];
        })->all();
    }

    /** Things the front desk should act on for the day, most urgent first. */
    private function attention(int $tenantId, CarbonImmutable $date, array $settings, array $tasks, array $day): array
    {
        $items = [];
        $iso = $date->toDateString();
        $isToday = $date->isToday();
        $now = now()->format('H:i');
        foreach (Payment::with('booking:id,guest_name')->where('tenant_id', $tenantId)->where('status', 'PENDING')->latest()->limit(10)->get() as $payment) {
            $items[] = ['tone' => 'warn', 'title' => 'Verify '.str_replace('_', ' ', $payment->method).' payment', 'booking_id' => $payment->booking_id,
                'detail' => ($payment->booking?->guest_name ?? 'Guest').' reported '.number_format((float) $payment->amount, 2)];
        }
        $inHouse = Booking::with('room:id,name')->where('tenant_id', $tenantId)->where('status', 'CHECKED_IN')->whereDate('check_out', '<=', $iso)->get();
        foreach ($inHouse as $b) {
            $dueOut = $b->check_out->toDateString() < $iso || ($isToday && $now > $b->times($settings)[1]);
            if ($dueOut) {
                $items[] = ['tone' => 'danger', 'title' => 'Check-out overdue', 'booking_id' => $b->id,
                    'detail' => "{$b->guest_name} · {$b->room?->name} was due out ".$b->check_out->format('M j').' '.$b->times($settings)[1]];
            }
        }
        $noShows = Booking::with('room:id,name')->where('tenant_id', $tenantId)->whereIn('status', ['CONFIRMED', 'PAID'])
            ->whereDate('check_in', '<', $iso)->whereDate('check_out', '>', $iso)->get();
        foreach ($noShows as $b) {
            $items[] = ['tone' => 'danger', 'title' => 'Guest has not checked in', 'booking_id' => $b->id,
                'detail' => "{$b->guest_name} · {$b->room?->name} was due ".$b->check_in->format('M j')];
        }
        foreach ($day['arrivals'] as $row) {
            if ($row['balance'] > 0 && ! in_array($row['status'], ['CHECKED_IN', 'CHECKED_OUT', 'COMPLETED'], true)) {
                $items[] = ['tone' => 'info', 'title' => 'Collect balance at check-in', 'booking_id' => $row['id'],
                    'detail' => "{$row['guest_name']} · {$row['unit']} owes ".number_format($row['balance'], 2)];
            }
        }
        foreach ($day['departures'] as $row) {
            if ($row['open_charges'] > 0) {
                $items[] = ['tone' => 'warn', 'title' => 'Open room charges', 'booking_id' => $row['id'],
                    'detail' => "{$row['guest_name']} · {$row['unit']} has ".number_format($row['open_charges'], 2).' in POS charges'];
            }
        }
        if ($isToday) {
            foreach (Booking::where('tenant_id', $tenantId)->whereIn('status', ['PENDING', 'AWAITING_PAYMENT'])->whereBetween('expires_at', [now(), now()->addHours(3)])->get() as $b) {
                $items[] = ['tone' => 'info', 'title' => 'Unpaid hold expiring', 'booking_id' => $b->id,
                    'detail' => "{$b->guest_name} · releases at ".$b->expires_at->format('g:i A')];
            }
        }
        foreach ($tasks as $task) {
            if ($task['risk']) {
                $items[] = ['tone' => 'danger', 'title' => 'Cleaning at risk', 'href' => '/admin/cleaning?date='.$iso,
                    'detail' => "{$task['unit']} must be ready by {$task['ready_by']}"];
            } elseif (! $task['assigned_to'] && $task['status'] !== 'DONE') {
                $items[] = ['tone' => 'info', 'title' => 'Assign a cleaner', 'href' => '/admin/cleaning?date='.$iso,
                    'detail' => "{$task['unit']} turnover has no cleaner yet"];
            }
        }
        foreach (PosItem::where('tenant_id', $tenantId)->where('active', true)->where('track_stock', true)->where('stock', '<=', 3)->orderBy('stock')->limit(5)->get() as $item) {
            $items[] = ['tone' => 'info', 'title' => 'Low stock', 'href' => '/admin/settings/pos-items', 'detail' => "{$item->name}: {$item->stock} left"];
        }
        $rank = ['danger' => 0, 'warn' => 1, 'info' => 2];
        usort($items, fn ($a, $b) => $rank[$a['tone']] <=> $rank[$b['tone']]);

        return array_map(fn ($item) => ['key' => md5($iso.$item['title'].$item['detail']), ...$item], $items);
    }

    public function superadmin(Request $request, DashboardMetrics $metrics)
    {
        return Inertia::render('Superadmin/Dashboard', [
            ...$metrics->superadmin(new DashboardPeriod($request)),
        ]);
    }

    public function account(Request $request)
    {
        return Inertia::render('Guest/Bookings', ['bookings' => Booking::with('property', 'room')->where('user_id', $request->user()->id)->latest()->get()]);
    }

    public function branding(Request $request)
    {
        return Inertia::render('Admin/Branding', ['tenant' => $request->user()->tenant]);
    }

    public function updateBranding(Request $request)
    {
        $data = $request->validate([
            'business_name' => ['required', 'string', 'max:120'],
            'business_email' => ['nullable', 'email', 'max:255'],
            'business_phone' => ['nullable', 'string', 'max:30'],
            'logo' => ['nullable', 'url:http,https', 'max:2048'],
            'hero_headline' => ['nullable', 'string', 'max:160'],
            'hero_description' => ['nullable', 'string', 'max:500'],
            'hero_image' => ['nullable', 'url:http,https', 'max:2048'],
            'business_address' => ['nullable', 'string', 'max:255'],
            'primary_color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'secondary_color' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ]);
        $request->user()->tenant->update($data);

        return back()->with('success', 'Branding updated.');
    }
}
