<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('steadfast_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Encrypted via 'encrypted' cast on the model — Laravel Crypt at rest.
            $table->text('api_key');
            $table->text('secret_key');
            $table->boolean('is_valid')->default(false);
            $table->timestamp('last_validated_at')->nullable();
            $table->timestamps();

            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('steadfast_credentials');
    }
};
