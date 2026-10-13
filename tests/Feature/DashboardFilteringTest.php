<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardFilteringTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DemoSeeder::class);
    }

    public function test_admin_dashboard_follows_selected_day_and_tenant(): void
    {
        $admin = User::where('email', 'admin@example.com')->firstOrFail();
        $day = today()->addDays(8)->toDateString();
        $this->actingAs($admin)->get('/admin?date='.$day)
            ->assertInertia(fn (Assert $page) => $page->component('Admin/Dashboard')->where('day.date', $day)->has('day.arrivals', 1)
                ->where('day.arrivals.0.reference', 'EAJ-DEMO-CONFIRMED'));
        $this->get('/admin?date=2020-01-01')
            ->assertInertia(fn (Assert $page) => $page->has('day.arrivals', 0)->where('day.revenueToday', 0));
        $this->actingAs(User::where('email', 'admin2@example.com')->firstOrFail())->get('/admin?date='.$day)
            ->assertInertia(fn (Assert $page) => $page->has('day.arrivals', 0));
    }

    public function test_superadmin_and_booking_filters_use_actual_records(): void
    {
        $today = today()->toDateString();
        $owner = User::where('email', 'superadmin@example.com')->firstOrFail();
        $this->actingAs($owner)->get('/superadmin?from='.$today.'&to='.$today)
            ->assertInertia(fn (Assert $page) => $page->component('Superadmin/Dashboard')->where('metrics.bookings', 5));
        $admin = User::where('email', 'admin@example.com')->firstOrFail();
        $this->actingAs($admin)->get('/admin/bookings?status=CANCELLED')
            ->assertInertia(fn (Assert $page) => $page->component('Admin/Bookings')->has('bookings.data', 1)->where('bookings.data.0.status', 'CANCELLED'));
        $this->get('/admin/bookings?from=2020-01-01&to=2020-01-31')
            ->assertInertia(fn (Assert $page) => $page->component('Admin/Bookings')->has('bookings.data', 0));
    }

    public function test_occupancy_uses_stay_nights_and_real_inventory(): void
    {
        Booking::where('reference', 'EAJ-DEMO-CONFIRMED')->update([
            'check_in' => today(), 'check_out' => today()->addDay(),
        ]);
        $today = today()->toDateString();
        $admin = User::where('email', 'admin@example.com')->firstOrFail();
        $this->actingAs($admin)->get('/admin')
            ->assertInertia(fn (Assert $page) => $page->component('Admin/Dashboard')->where('day.occupied', 1)->where('day.inventory', 14)->where('day.occupancy', 7));
        $this->get('/admin/insights?range=custom&from='.$today.'&to='.$today)
            ->assertInertia(fn (Assert $page) => $page->component('Admin/Insights')->where('analytics.metrics.occupancy', 7.1)->where('analytics.series.0.occupancy', 7.1));
    }

    public function test_reports_and_csv_export_follow_period_and_tenant(): void
    {
        $today = today()->toDateString();
        $admin = User::where('email', 'admin@example.com')->firstOrFail();
        $this->actingAs($admin)->get('/admin/reports?from='.$today.'&to='.$today)->assertRedirect('/admin/insights?from='.$today.'&to='.$today);
        $this->get('/admin/insights?from='.$today.'&to='.$today)
            ->assertInertia(fn (Assert $page) => $page->component('Admin/Insights')->where('range', 'custom')->has('analytics.units', 6));
        $export = $this->get('/admin/reports/export?from='.$today.'&to='.$today)
            ->assertDownload('bookings_'.$today.'_to_'.$today.'.csv');
        $this->assertStringContainsString('EAJ-DEMO-CONFIRMED', $export->streamedContent());
        $this->assertStringNotContainsString('EAJ-DEMO-MANUAL', $export->streamedContent());
    }
}
