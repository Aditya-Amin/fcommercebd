<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * sms_balances
 * ─────────────────────────────────────────────────────────────────────────────
 * One row per user per active subscription period.
 *
 * Created automatically when a subscription is activated (by SmsBalanceService).
 * used_sms is incremented on every successful send; remaining_sms is a generated
 * column so it stays consistent without a separate UPDATE.
 *
 * When a subscription expires and the user renews, a NEW row is inserted —
 * the old row is kept as history.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('sms_balances', function (Blueprint $table) {
            $table->id();

            // The user who owns this balance
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            // The subscription this balance belongs to.
            // Nullable so we can create a balance for free/demo users later if needed.
            $table->foreignId('subscription_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            // Total SMS allocated for this period (copied from plan.limits.sms on activation)
            $table->unsignedInteger('total_sms')->default(0);

            // Running count of SMS consumed in this period
            $table->unsignedInteger('used_sms')->default(0);

            // Period window — mirrors the subscription's start/expiry dates
            $table->timestamp('period_start')->nullable();
            $table->timestamp('period_end')->nullable();   // "reset_at" in the API response

            $table->timestamps();

            // One active balance per user — prevents accidental duplicates
            $table->unique(['user_id', 'subscription_id']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_balances');
    }
};
