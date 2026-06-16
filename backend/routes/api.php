



<?php

use App\Http\Controllers\Admin\PurchasesController;
use App\Http\Controllers\Api\AiGenerateController;
use App\Http\Controllers\Api\SslCommerzController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BkashController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\FacebookController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\SupportController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SmsController;
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

    // Category management — basic feature, not gated behind subscription.
    // POST creates user-owned categories; GET is public but also here so
    // authenticated users can optionally call it with auth headers.
    Route::post('/categories', [CategoryController::class, 'store']);

    Route::post('/bkash/create-payment',  [BkashController::class, 'createPayment']);
    Route::post('/bkash/execute-payment', [BkashController::class, 'executePayment']);
    Route::post('/bkash/query-payment',   [BkashController::class, 'queryPayment']);

    // SSLCommerz — initiate payment (callbacks come via web routes, not API)
    Route::post('/sslcommerz/initiate', [SslCommerzController::class, 'initiate']);

    Route::get('/subscriptions',         [SubscriptionController::class, 'index']);
    Route::get('/subscriptions/active',  [SubscriptionController::class, 'active']);

    // Read-only quota meters — must stay reachable even when the subscription
    // has expired/locked, so the dashboard shows the true 0/locked state
    // instead of falling back to a stale localStorage counter.
    Route::get('/facebook/quota', [FacebookController::class, 'quota']);
    Route::get('/ai/usage',       [AiGenerateController::class, 'usage']);

    // In-app notifications stay open so renewal reminders are still visible.
    Route::get('/notifications',                    [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count',       [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/mark-all-read',     [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::delete('/notifications/{notification}',  [NotificationController::class, 'destroy']);

    // Support tickets — open to all authenticated users (even expired subscriptions)
    Route::get('/support/tickets',                              [SupportController::class, 'index']);
    Route::post('/support/tickets',                             [SupportController::class, 'store']);
    Route::get('/support/tickets/{ticket}',                     [SupportController::class, 'show']);
    Route::get('/support/tickets/{ticket}/messages',            [SupportController::class, 'messages']);
    Route::post('/support/tickets/{ticket}/messages',           [SupportController::class, 'reply']);
});

// Feature endpoints — gated by an active subscription. Expired users get a
// 403 with code=subscription_expired; free-tier (never-purchased) users still
// pass through and see the existing locked-features dashboard.
Route::middleware(['auth:sanctum', 'subscription.active'])->group(function () {
    // Products (CRUD scoped to authenticated user).
    Route::post('/products/upload-image', [ProductController::class, 'uploadImage']);
    Route::apiResource('products', ProductController::class);

    // Facebook Page integration.
    Route::post('/facebook/connect',           [FacebookController::class, 'connect']);
    Route::get('/facebook/pages',              [FacebookController::class, 'pages']);
    Route::delete('/facebook/pages/{page}',    [FacebookController::class, 'disconnect']);
    Route::post('/facebook/post',              [FacebookController::class, 'post']);
    Route::get('/facebook/posts',              [FacebookController::class, 'posts']);
    Route::delete('/facebook/posts/{post}',    [FacebookController::class, 'cancelPost']);

    // AI post generation from a product (creating a post is gated; reading the
    // quota meter at /ai/usage is not — see the always-on group above).
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

// ── SMS usage (auth required; SmsBalanceService handles quota internally) ─────
Route::middleware('auth:sanctum')->prefix('user/sms')->group(function () {
    Route::get('/stats', [SmsController::class, 'stats']);   // quota card data
    Route::post('/send',  [SmsController::class, 'send']);   // deduct + dispatch
    Route::get('/log',    [SmsController::class, 'log']);    // recent send history
});

// ── Dev-only package activation (local env guard inside controller) ───────────
// Lets the /test/activate-package page bypass bKash for quick testing.
Route::middleware('auth:sanctum')->prefix('dev')->group(function () {
    Route::get('/packages',          [PackageController::class, 'index']);
    Route::post('/activate-package', [PackageController::class, 'activate']);
});

// Admin-only (gate with your real admin middleware in production)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/bkash/token',  [BkashController::class, 'token']);   // debug
    Route::post('/bkash/refund', [BkashController::class, 'refund']);

    // Purchase dashboard — lists all transactions with user + plan + subscription data
    Route::get('/admin/purchases',         [PurchasesController::class, 'index']);
    Route::get('/admin/purchases/summary', [PurchasesController::class, 'summary']);
});
