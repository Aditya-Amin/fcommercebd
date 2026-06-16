<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function showLogin()
    {
        if (Auth::guard('admin')->check()) {
            return redirect()->route('admin.dashboard');
        }
        return view('admin.auth.login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (Auth::guard('admin')->attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();
            return redirect()->intended(route('admin.dashboard'));
        }

        return back()->withErrors(['email' => 'Invalid credentials.'])->onlyInput('email');
    }

    public function logout(Request $request)
    {
        Auth::guard('admin')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('admin.login');
    }

    // --- Registration (CRUD for admin accounts) ---

    public function showRegister()
    {
        return view('admin.auth.register');
    }

    public function register(Request $request)
    {
        $request->validate([
            'name'     => ['required', 'string', 'max:120'],
            'email'    => ['required', 'email', 'max:191'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        // Only pre-approved emails (added via Admin Accounts page) can register
        $admin = Admin::where('email', $request->email)->first();

        if (!$admin) {
            return back()->withInput()->withErrors([
                'email' => 'This email is not authorized to access the admin dashboard.',
            ]);
        }

        if ($admin->password) {
            return back()->withInput()->withErrors([
                'email' => 'This email already has an account. Please log in instead.',
            ]);
        }

        $admin->update([
            'name'     => $request->name,
            'password' => $request->password,
        ]);

        Auth::guard('admin')->login($admin);

        return redirect()->route('admin.dashboard');
    }

    // --- Admin account management (CRUD) ---

    public function index()
    {
        $admins = Admin::latest()->paginate(20);
        return view('admin.auth.index', compact('admins'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email', 'max:191', 'unique:admins,email'],
            'role'  => ['required', 'in:admin,super_admin'],
        ]);

        Admin::create([
            'email'    => $request->email,
            'role'     => $request->role,
            'name'     => '',
            'password' => null,
        ]);

        return back()->with('success', 'Admin added successfully.');
    }

    public function edit(Admin $admin)
    {
        return view('admin.auth.edit', compact('admin'));
    }

    public function update(Request $request, Admin $admin)
    {
        $data = $request->validate([
            'name'  => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:191', 'unique:admins,email,' . $admin->id],
            'role'  => ['required', 'in:admin,super_admin'],
        ]);

        if ($request->filled('password')) {
            $request->validate([
                'password' => ['confirmed', Password::min(8)],
            ]);
            $data['password'] = $request->password;
        }

        $admin->update($data);

        return back()->with('success', 'Admin account updated.');
    }

    public function destroy(Admin $admin)
    {
        if ($admin->id === Auth::guard('admin')->id()) {
            return back()->withErrors(['error' => 'You cannot delete your own account.']);
        }
        $admin->delete();
        return redirect()->route('admin.admins.index')->with('success', 'Admin deleted.');
    }
}
