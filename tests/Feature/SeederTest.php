<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_normal_seed_creates_plans_without_demo_credentials(): void
    {
        config(['platform.demo_mode' => false]);
        $this->seed();

        $this->assertDatabaseCount('subscription_plans', 2);
        $this->assertDatabaseCount('tenants', 0);
        $this->assertDatabaseCount('users', 0);
        $this->assertEquals(29988, SubscriptionPlan::where('code', 'ANNUAL')->value('billing_price'));

        SubscriptionPlan::where('code', 'MONTHLY')->update(['billing_price' => 3999]);
        $this->seed();
        $this->assertEquals(3999, SubscriptionPlan::where('code', 'MONTHLY')->value('billing_price'));
    }

    public function test_demo_seed_populates_two_tenants_and_is_repeatable(): void
    {
        $this->seed(DemoSeeder::class);
        $this->seed(DemoSeeder::class);

        $this->assertDatabaseCount('subscription_plans', 2);
        $this->assertDatabaseCount('tenants', 2);
        $this->assertDatabaseCount('users', 5);
        $this->assertDatabaseCount('properties', 4);
        $this->assertDatabaseCount('rooms', 7);
        $this->assertDatabaseCount('bookings', 5);
        $this->assertDatabaseCount('booking_prices', 5);
        $this->assertDatabaseCount('payments', 3);
        $this->assertDatabaseCount('blocked_dates', 1);

        $island = Tenant::where('slug', 'island-collection')->firstOrFail();
        $cebu = Tenant::where('slug', 'cebu-heritage-stays')->firstOrFail();
        $this->assertTrue($island->acceptsBookings());
        $this->assertTrue($cebu->acceptsBookings());
        $this->assertEquals(1, $island->subscriptions()->firstOrFail()->commitment_months);
        $this->assertEquals(12, $cebu->subscriptions()->firstOrFail()->commitment_months);
        $this->assertEquals(29988, $cebu->subscriptions()->firstOrFail()->billing_total);

        $admin = User::where('email', 'admin@example.com')->firstOrFail();
        $admin2 = User::where('email', 'admin2@example.com')->firstOrFail();
        $this->assertEquals($island->id, $admin->tenant_id);
        $this->assertEquals($cebu->id, $admin2->tenant_id);
        $this->assertTrue(Hash::check('Password123!', $admin->password));

        $confirmed = Booking::where('reference', 'EAJ-DEMO-CONFIRMED')->firstOrFail();
        $this->assertEquals('CONFIRMED', $confirmed->status);
        $this->assertEquals('PAID', $confirmed->payment_status);
        $this->assertEquals($confirmed->total, $confirmed->price->total);
        $this->assertDatabaseHas('payments', ['booking_id' => $confirmed->id, 'status' => 'PAID']);
    }

    public function test_database_seed_in_demo_mode_includes_demo_data(): void
    {
        config(['platform.demo_mode' => true]);
        $this->seed();
        $this->assertDatabaseHas('users', ['email' => 'superadmin@example.com', 'role' => 'SUPERADMIN']);
        $this->assertDatabaseHas('properties', ['slug' => 'azure-coast-villas', 'status' => 'PUBLISHED']);
    }

    public function test_production_seed_never_creates_demo_accounts_even_if_demo_flag_is_on(): void
    {
        $this->app['env'] = 'production';
        config(['platform.demo_mode' => true]);
        $this->artisan('db:seed', ['--force' => true])->assertExitCode(0);

        $this->assertDatabaseCount('subscription_plans', 2);
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('tenants', 0);
    }
}
