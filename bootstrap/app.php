<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [\App\Http\Middleware\EnsureUserIsActive::class, \App\Http\Middleware\HandleInertiaRequests::class]);
        $middleware->alias([
            'role' => \App\Http\Middleware\RequireRole::class,
            'tenant.active' => \App\Http\Middleware\RequireActiveTenant::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // A refused action (abort(422)) from an Inertia form comes back as a toast instead of an error page.
        $exceptions->render(function (HttpExceptionInterface $e, Request $request) {
            if ($request->header('X-Inertia') && $e->getStatusCode() === 422 && ! $request->isMethod('GET')) {
                return back()->withErrors(['action' => $e->getMessage() ?: 'That change is not allowed right now.']);
            }
        });
    })->create();
