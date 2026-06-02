<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // type taxonomy — kept as string (not enum) so adding new types
            // doesn't require a migration. Validate in NotificationService.
            $table->string('type', 64);

            $table->string('title');
            $table->text('message');

            // Arbitrary structured payload (orderId, postId, etc.)
            $table->json('data')->nullable();

            // Optional deep-link target inside the SPA (e.g. "/orders").
            $table->string('action_url', 500)->nullable();

            // Optional icon override (kebab-case names mapped on the frontend).
            $table->string('icon', 64)->nullable();

            $table->enum('priority', ['low', 'normal', 'high'])->default('normal');

            // null = unread; timestamp = when user read it
            $table->timestamp('read_at')->nullable();

            $table->timestamps();

            // Hot path: bell badge query (unread count for current user)
            $table->index(['user_id', 'read_at']);
            // List queries are ordered by created_at desc
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
