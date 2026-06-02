<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('facebook_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('facebook_page_id')->constrained('facebook_pages')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();

            $table->enum('type', ['text', 'photo', 'link', 'multi_photo'])->default('text');
            $table->text('message')->nullable();
            $table->string('link_url', 800)->nullable();
            // for single-photo: image_url; multi: stored in image_urls JSON
            $table->string('image_url', 800)->nullable();
            $table->json('image_urls')->nullable();
            $table->json('hashtags')->nullable();

            // lifecycle
            $table->enum('status', [
                'queued', 'scheduled', 'publishing', 'published',
                'failed', 'rejected', 'cancelled'
            ])->default('queued');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('published_at')->nullable();

            // facebook response
            $table->string('fb_post_id', 128)->nullable();
            $table->string('fb_permalink', 800)->nullable();

            // failure / moderation
            $table->string('error_code', 80)->nullable();
            $table->text('error_message')->nullable();
            $table->json('moderation_flags')->nullable();
            $table->unsignedSmallInteger('attempts')->default(0);

            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['facebook_page_id', 'status']);
            $table->index('scheduled_at');
            $table->index('published_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facebook_posts');
    }
};
