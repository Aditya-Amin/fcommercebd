<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Add 'trial' to the subscriptions.status enum so free-signup trials (see
 * TrialService) can be stored. MySQL enum change via raw ALTER — no dbal needed.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE `subscriptions` MODIFY `status` ENUM('pending','active','trial','failed','expired','cancelled') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        // Demote any trials so the value fits the narrower enum again.
        DB::table('subscriptions')->where('status', 'trial')->update(['status' => 'cancelled']);
        DB::statement("ALTER TABLE `subscriptions` MODIFY `status` ENUM('pending','active','failed','expired','cancelled') NOT NULL DEFAULT 'pending'");
    }
};
