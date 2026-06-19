<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedSmallInteger('fb_posts_limit_duration_days')->nullable()->after('fb_posts_limit_override');
            $table->unsignedSmallInteger('ai_generations_limit_duration_days')->nullable()->after('ai_generations_limit_override');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'fb_posts_limit_duration_days',
                'ai_generations_limit_duration_days',
            ]);
        });
    }
};
