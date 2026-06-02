<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('facebook_pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('page_id', 64)->index();
            $table->string('page_name');
            $table->string('category')->nullable();
            $table->string('picture_url', 500)->nullable();
            $table->unsignedBigInteger('fan_count')->nullable();
            // page access token — encrypted at the application layer (cast: 'encrypted')
            $table->text('access_token');
            // user access token (long-lived) — kept for re-fetching pages later
            $table->text('user_access_token')->nullable();
            $table->timestamp('token_expiry')->nullable();
            // tasks/permissions granted on the page
            $table->json('permissions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'page_id']);
            $table->index(['user_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facebook_pages');
    }
};
