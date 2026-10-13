<?php

namespace App\Http\Middleware;

use App\Models\CleaningTask;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => ['user' => $request->user()?->only('id', 'name', 'email', 'role', 'tenant_id')],
            'demo' => config('platform.demo_mode'),
            'currency' => $request->user()?->tenant?->setting('currency') ?? config('platform.tenant_defaults.currency'),
            'flash' => ['success' => $request->session()->get('success')],
            // Badge on "My tasks": open cleaning assignments up to today.
            'myTaskCount' => fn () => $request->user()?->role === 'STAFF'
                ? CleaningTask::where('assigned_to', $request->user()->id)->where('status', '!=', 'DONE')
                    ->whereDate('date', '<=', today()->toDateString())->whereDate('date', '>=', today()->subDays(14)->toDateString())->count()
                : 0,
        ]);
    }
}
