<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Persists every Steadfast booking submitted through our backend so we can
 * (a) prove what was sent, (b) re-render the tracking pill without re-hitting
 * Steadfast on every page load, and (c) reconcile statuses on the schedule.
 *
 * Note: there's no FK to an `orders` table because the Order backend isn't
 * built yet (see project_tech_debt.md). The frontend correlates rows by the
 * `invoice` field, which it generates from its order id.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('steadfast_consignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('invoice');                 // Frontend's order id (e.g. ORD-1043)
            $table->unsignedBigInteger('consignment_id')->nullable();
            $table->string('tracking_code')->nullable();
            $table->string('status')->default('in_review');
            $table->string('recipient_name');
            $table->string('recipient_phone', 20);
            $table->string('alternative_phone', 20)->nullable();
            $table->string('recipient_email')->nullable();
            $table->string('recipient_address', 500);
            $table->decimal('cod_amount', 10, 2)->default(0);
            $table->string('note', 500)->nullable();
            $table->string('item_description', 500)->nullable();
            $table->unsignedTinyInteger('delivery_type')->nullable(); // 0=home, 1=hub
            $table->json('raw_response')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'invoice']);  // matches Steadfast's invoice uniqueness
            $table->index('tracking_code');
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('steadfast_consignments');
    }
};
