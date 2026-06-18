<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Mail\NewUserAdminAlertMail;
use App\Mail\UserWelcomeMail;
use App\Models\Admin;
use App\Models\User;
use App\Services\Admin\AdminNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * SPA auth via Sanctum bearer tokens.
 *
 *   POST /api/register   public  → { token, user }
 *   POST /api/login      public  → { token, user }
 *   POST /api/logout     sanctum → revokes current token
 *   GET  /api/me         sanctum → current user + active subscription
 *
 * Pattern:
 *   - Register/login generate a NEW Sanctum token each call (one per device
 *     is fine; the SPA persists it in localStorage["auth.token"]).
 *   - Logout revokes only the current bearer token, not all sessions.
 *   - Subscription lookup happens inside UserResource so /me is one round-trip.
 */
class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Pick a deterministic-ish avatar color so the dashboard avatar is
        // stable for the user across devices.
        $colors = ['#3362FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
        $avatarColor = $colors[crc32($data['email']) % count($colors)];

        $user = User::create([
            'name'         => $data['name'],
            'email'        => strtolower($data['email']),
            'password'     => Hash::make($data['password']),
            'business'     => $data['business'] ?? null,
            'phone'        => $data['phone'] ?? null,
            'avatar_color' => $avatarColor,
        ]);

        $token = $user->createToken('spa')->plainTextToken;

        AdminNotificationService::userRegistered($user);

        // Welcome email to the new user
        try {
            Mail::to($user->email)->send(new UserWelcomeMail($user));
        } catch (\Throwable $e) {
            Log::error('UserWelcomeMail failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }

        // Alert email to every super admin
        try {
            $superAdmins = Admin::where('role', 'super_admin')->get();
            foreach ($superAdmins as $admin) {
                Mail::to($admin->email)->send(new NewUserAdminAlertMail($user));
            }
        } catch (\Throwable $e) {
            Log::error('NewUserAdminAlertMail failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }

        return response()->json([
            'token' => $token,
            'user'  => new UserResource($user->fresh()),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $creds = $request->validated();

        $user = User::where('email', strtolower($creds['email']))->first();

        if (! $user || ! Hash::check($creds['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('spa')->plainTextToken;

        AdminNotificationService::userLoggedIn($user);

        return response()->json([
            'token' => $token,
            'user'  => new UserResource($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        // Revoke ONLY the current token. Other devices stay logged in.
        $user  = $request->user();
        $token = $user->currentAccessToken();
        if ($token) $token->delete();

        AdminNotificationService::userLoggedOut($user);

        return response()->json(['data' => ['loggedOut' => true]]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new UserResource($request->user()),
        ]);
    }
}




