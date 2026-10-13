<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Demo credentials must never be created by a normal production seed.
        if (config('platform.demo_mode') && ! app()->environment('production')) {
            $this->call(DemoSeeder::class);
        } else {
            $this->call(SubscriptionPlanSeeder::class);
        }
    }
}
