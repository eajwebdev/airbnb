<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function loginPage()
    {
        return Inertia::render('Auth/Login');
    }

    public function registerPage()
    {
        return Inertia::render('Auth/Register');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        if (! Auth::attempt([...$credentials, fn ($query) => $query->whereNull('deactivated_at')], $request->boolean('remember'))) {
            return back()->withErrors(['email' => 'The credentials are invalid.']);
        }
        $request->session()->regenerate();

        return redirect()->intended($this->dashboard($request->user()->role));
    }

    public function register(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:120', 'email' => 'required|email|unique:users,email', 'password' => 'required|string|min:8|confirmed']);
        $user = User::create(['name' => $data['name'], 'email' => $data['email'], 'password' => Hash::make($data['password']), 'role' => 'GUEST']);
        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('account.bookings');
    }

    public function demo(Request $request)
    {
        abort_unless(config('platform.demo_mode'), 404);
        $data = $request->validate(['role' => 'required|in:superadmin,admin,staff,guest']);
        $user = User::where('email', $data['role'].'@example.com')->where('role', strtoupper($data['role']))->firstOrFail();
        Auth::login($user);
        $request->session()->regenerate();

        return redirect($this->dashboard($user->role));
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }

    private function dashboard(string $role): string
    {
        return match ($role) {
            'SUPERADMIN' => route('superadmin.dashboard'), 'ADMIN' => route('admin.dashboard'), 'STAFF' => route('admin.tasks.mine'), default => route('account.bookings')
        };
    }
}
