<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('type', 60);
            $table->string('title');
            $table->string('message');
            $table->json('data')->nullable();
            $table->string('action_url')->nullable();
            $table->string('icon', 60)->nullable();
            $table->string('color', 30)->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index('read_at');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_notifications');
    }
};
