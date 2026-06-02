<?php

use App\Http\Controllers\Api\AiGenerateController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BkashController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\FacebookController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SteadfastController;
use App\Http\Controllers\Api\SubscriptionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public
Route::get('/plans', [SubscriptionController::class, 'plans']);
Route::get('/categories', [CategoryController::class, 'index']);

// Auth (public — register + login). Throttled to limit brute-force attempts.
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// bKash → Laravel callback (PUBLIC; bKash hits this with no auth headers).
// Throttled to absorb retries without blowing up.
Route::middleware('throttle:60,1')
    ->get('/bkash/callback', [BkashController::class, 'callback']);

// Simulate-mode bKash payoff (PUBLIC; only active when BKASH_SIMULATE=true).
Route::middleware('throttle:60,1')
    ->get('/bkash/simulate-pay', [BkashController::class, 'simulatePay']);

// bKash → Laravel server-to-server webhook (PUBLIC, signature-verified inside the handler).
Route::middleware('throttle:120,1')
    ->post('/bkash/webhook', [BkashController::class, 'webhook']);

// Facebook OAuth callback (PUBLIC; Facebook redirects the browser here without auth).
// State token from /api/facebook/connect resolves the user inside the handler.
Route::middleware('throttle:60,1')
    ->get('/facebook/callback', [FacebookController::class, 'callback']);

// Authenticated routes that must remain accessible even when the subscription
// has expired — these are the "renew + sign out" surface plus /me so the
// frontend can render the expired UI.
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me',     [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::post('/bkash/create-payment',  [BkashController::class, 'createPayment']);
    Route::post('/bkash/execute-payment', [BkashController::class, 'executePayment']);
    Route::post('/bkash/query-payment',   [BkashController::class, 'queryPayment']);

    Route::get('/subscriptions',         [SubscriptionController::class, 'index']);
    Route::get('/subscriptions/active',  [SubscriptionController::class, 'active']);

    // In-app notifications stay open so renewal reminders are still visible.
    Route::get('/notifications',                    [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count',       [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/mark-all-read',     [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::delete('/notifications/{notification}',  [NotificationController::class, 'destroy']);
});

// Feature endpoints — gated by an active subscription. Expired users get a
// 403 with code=subscription_expired; free-tier (never-purchased) users still
// pass through and see the existing locked-features dashboard.
Route::middleware(['auth:sanctum', 'subscription.active'])->group(function () {
    // Products (CRUD scoped to authenticated user).
    Route::post('/products/upload-image', [ProductController::class, 'uploadImage']);
    Route::apiResource('products', ProductController::class);

    // Categories (any authenticated user can add new ones).
    Route::post('/categories', [CategoryController::class, 'store']);

    // Facebook Page integration.
    Route::post('/facebook/connect',           [FacebookController::class, 'connect']);
    Route::get('/facebook/pages',              [FacebookController::class, 'pages']);
    Route::delete('/facebook/pages/{page}',    [FacebookController::class, 'disconnect']);
    Route::post('/facebook/post',              [FacebookController::class, 'post']);
    Route::get('/facebook/posts',              [FacebookController::class, 'posts']);
    Route::delete('/facebook/posts/{post}',    [FacebookController::class, 'cancelPost']);
    Route::get('/facebook/quota',              [FacebookController::class, 'quota']);

    // AI post generation from a product.
    Route::post('/ai/generate-post', [AiGenerateController::class, 'generate']);

    // Steadfast Courier — credential management + delivery booking + status.
    Route::get('/steadfast/credentials',     [SteadfastController::class, 'showCredentials']);
    Route::post('/steadfast/credentials',    [SteadfastController::class, 'saveCredentials']);
    Route::delete('/steadfast/credentials',  [SteadfastController::class, 'deleteCredentials']);
    Route::get('/steadfast/balance',         [SteadfastController::class, 'balance']);
    Route::get('/steadfast/consignments',    [SteadfastController::class, 'listConsignments']);
    Route::post('/steadfast/consignments',   [SteadfastController::class, 'createConsignment']);
    Route::get('/steadfast/consignments/{invoice}',                 [SteadfastController::class, 'showConsignment']);
    Route::post('/steadfast/consignments/{invoice}/sync-status',    [SteadfastController::class, 'syncStatus']);
});

// Admin-only (gate with your real admin middleware in production)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/bkash/token',  [BkashController::class, 'token']);   // debug
    Route::post('/bkash/refund', [BkashController::class, 'refund']);
});
