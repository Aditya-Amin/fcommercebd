<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds dedupe locks for the renewal-reminder scheduler so each user receives
 * each notification (T-3, T-1, expired) at most once per subscription cycle,
 * regardless of how many times the daily command runs.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->timestamp('expiry_3d_notified_at')->nullable()->after('expiry_date');
            $table->timestamp('expiry_1d_notified_at')->nullable()->after('expiry_3d_notified_at');
            $table->timestamp('expired_notified_at')->nullable()->after('expiry_1d_notified_at');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn([
                'expiry_3d_notified_at',
                'expiry_1d_notified_at',
                'expired_notified_at',
            ]);
        });
    }
};
