<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * sms_logs
 * ─────────────────────────────────────────────────────────────────────────────
 * Immutable audit trail — one row per SMS send attempt.
 * Never updated after insert; status reflects the outcome at send time.
 *
 * status values:
 *   sent   — delivered to the real SMS gateway (greenweb driver)
 *   failed — gateway rejected or returned an error
 *   mock   — SMS_MOCK=true or LOG driver active; no real send happened
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('sms_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            // Which balance was debited for this send
            $table->foreignId('sms_balance_id')
                ->nullable()
                ->constrained('sms_balances')
                ->nullOnDelete();

            // The normalized BD phone number (11 digits, no country code)
            $table->string('recipient_number', 15);

            // Message body (up to 612 chars = 4 concatenated SMS)
            $table->string('message', 612);

            $table->enum('status', ['sent', 'failed', 'mock'])->default('mock');

            // Raw response from the SMS gateway (null for mock/log sends)
            $table->json('gateway_response')->nullable();

            $table->timestamp('created_at')->useCurrent();

            // Indexes for the usage-log API (user's recent sends)
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_logs');
    }
};
