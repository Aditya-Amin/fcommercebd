<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-user admin overrides for the AI-generation quota — mirrors the FB-post
 * override columns. See PlanQuotaService::aiGenerationsLimit/Used.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('ai_generations_limit_override')->nullable()->after('fb_posts_reset_at');
            $table->timestamp('ai_generations_reset_at')->nullable()->after('ai_generations_limit_override');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['ai_generations_limit_override', 'ai_generations_reset_at']);
        });
    }
};
