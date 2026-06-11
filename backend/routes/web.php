<?php

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
    return view('welcome');
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

// Admin Dashboard
Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/',                    [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/subscriptions',       [DashboardController::class, 'subscriptions'])->name('subscriptions');
    Route::get('/users',               [DashboardController::class, 'users'])->name('users');
    Route::get('/users/{user}/activity', [DashboardController::class, 'userActivity'])->name('users.activity');

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
