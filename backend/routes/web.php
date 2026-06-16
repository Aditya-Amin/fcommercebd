<?php

use App\Http\Controllers\Admin\AdminNotificationController;
use App\Http\Controllers\Admin\AdminSupportController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Api\BkashController;
use App\Http\Controllers\Api\SslCommerzController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return redirect()->route('admin.login');
});

// Mock bKash payment simulator (only active when BKASH_SIMULATE=true in .env)
// Uses GET-only routes so no CSRF token is required (dev-only, not a security concern).
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/bkash/simulate',         [BkashController::class, 'simulateShow'])->name('bkash.simulate.show');
    Route::get('/bkash/simulate/success', [BkashController::class, 'simulateSuccess'])->name('bkash.simulate.success');
    Route::get('/bkash/simulate/failure', [BkashController::class, 'simulateFailure'])->name('bkash.simulate.failure');
});

// SSLCommerz callbacks — SSLCommerz POSTs to these after payment
// CSRF is excluded for these in VerifyCsrfToken middleware
Route::prefix('sslcommerz')->name('sslcommerz.')->middleware('throttle:60,1')->group(function () {
    Route::post('/success', [SslCommerzController::class, 'success'])->name('success');
    Route::post('/fail',    [SslCommerzController::class, 'fail'])->name('fail');
    Route::post('/cancel',  [SslCommerzController::class, 'cancel'])->name('cancel');
    Route::post('/ipn',     [SslCommerzController::class, 'ipn'])->name('ipn');
});

// Admin Auth (unauthenticated)
Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/login',    [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login',   [AuthController::class, 'login']);
    Route::post('/logout',  [AuthController::class, 'logout'])->name('logout');
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register',[AuthController::class, 'register']);
});

// Admin Dashboard (protected)
Route::prefix('admin')->name('admin.')->middleware('admin')->group(function () {
    Route::get('/',                    [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/subscriptions',       [DashboardController::class, 'subscriptions'])->name('subscriptions');
    Route::get('/ai-cost',             [DashboardController::class, 'aiCost'])->name('ai-cost');
    Route::post('/subscriptions/sms',  [DashboardController::class, 'sendSubscriptionSms'])->name('subscriptions.sms');
    Route::get('/users',               [DashboardController::class, 'users'])->name('users');
    Route::get('/users/{user}/activity', [DashboardController::class, 'userActivity'])->name('users.activity');
    Route::post('/users/{user}/quota',          [DashboardController::class, 'updateUserQuota'])->name('users.quota.update');
    Route::post('/users/{user}/quota/reset',    [DashboardController::class, 'resetUserQuota'])->name('users.quota.reset');
    Route::post('/users/{user}/ai-quota',       [DashboardController::class, 'updateUserAiQuota'])->name('users.ai-quota.update');
    Route::post('/users/{user}/ai-quota/reset', [DashboardController::class, 'resetUserAiQuota'])->name('users.ai-quota.reset');
    Route::post('/users/{user}/sms-quota',       [DashboardController::class, 'updateUserSmsQuota'])->name('users.sms-quota.update');
    Route::post('/users/{user}/sms-quota/reset', [DashboardController::class, 'resetUserSmsQuota'])->name('users.sms-quota.reset');
    Route::post('/users/{user}/plan',            [DashboardController::class, 'assignPlan'])->name('users.plan.assign');
    Route::post('/users/{user}/send-sms',        [DashboardController::class, 'sendUserSms'])->name('users.send-sms');
    Route::delete('/users/{user}',     [DashboardController::class, 'destroyUser'])->name('users.destroy');

    // Support tickets
    Route::prefix('support')->name('support.')->group(function () {
        Route::get('/',                              [AdminSupportController::class, 'index'])->name('index');
        // Presence — declared before /{ticket} so they aren't captured as ticket ids.
        Route::post('/heartbeat',                    [AdminSupportController::class, 'heartbeat'])->name('heartbeat');
        Route::post('/availability',                 [AdminSupportController::class, 'availability'])->name('availability');
        Route::get('/{ticket}',                      [AdminSupportController::class, 'show'])->name('show');
        Route::get('/{ticket}/messages',             [AdminSupportController::class, 'messages'])->name('messages');
        Route::post('/{ticket}/reply',               [AdminSupportController::class, 'reply'])->name('reply');
        Route::post('/{ticket}/status',              [AdminSupportController::class, 'updateStatus'])->name('status');
    });

    // Admin notifications
    Route::prefix('notifications')->name('notifications.')->group(function () {
        Route::get('/',                                      [AdminNotificationController::class, 'index'])->name('index');
        Route::get('/unread-count',                          [AdminNotificationController::class, 'unreadCount'])->name('unread-count');
        Route::post('/mark-all-read',                        [AdminNotificationController::class, 'markAllRead'])->name('mark-all-read');
        Route::post('/{notification}/read',                  [AdminNotificationController::class, 'markRead'])->name('mark-read');
        Route::delete('/all',                                [AdminNotificationController::class, 'destroyAll'])->name('destroy-all');
        Route::delete('/{notification}',                     [AdminNotificationController::class, 'destroy'])->name('destroy');
    });

    // Admin accounts CRUD (Super Admin only)
    Route::prefix('admins')->name('admins.')->middleware('super_admin')->group(function () {
        Route::get('/',              [AuthController::class, 'index'])->name('index');
        Route::post('/',             [AuthController::class, 'store'])->name('store');
        Route::get('/{admin}/edit',  [AuthController::class, 'edit'])->name('edit');
        Route::put('/{admin}',       [AuthController::class, 'update'])->name('update');
        Route::delete('/{admin}',    [AuthController::class, 'destroy'])->name('destroy');
    });

    // Settings
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/image-generation',        [SettingsController::class, 'imageGeneration'])->name('image-generation');
        Route::post('/image-generation',       [SettingsController::class, 'saveImageGeneration'])->name('image-generation.save');
        Route::get('/facebook-post',           [SettingsController::class, 'facebookPost'])->name('facebook-post');
        Route::post('/facebook-post',          [SettingsController::class, 'saveFacebookPost'])->name('facebook-post.save');
        Route::get('/sms-api',                 [SettingsController::class, 'smsApi'])->name('sms-api');
        Route::post('/sms-api',                [SettingsController::class, 'saveSmsApi'])->name('sms-api.save');
    });
});
