<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds a structured `limits` JSON column to plans.
 *
 * The existing `features` JSON is marketing copy (human-readable bullets);
 * `limits` is queryable per-resource caps used by gating code:
 *
 *   { "fbPosts": 30, "aiGenerations": 5, "sms": 10 }
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->json('limits')->nullable()->after('features');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn('limits');
        });
    }
};
