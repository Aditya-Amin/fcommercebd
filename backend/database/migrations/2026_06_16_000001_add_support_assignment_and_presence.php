<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Which agent owns a ticket. NULL = unassigned (no agent free at creation),
        // sits in the shared queue until an agent claims it or one frees up.
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->foreignId('assigned_admin_id')
                ->nullable()
                ->after('user_id')
                ->constrained('admins')
                ->nullOnDelete();

            // Powers the load query (count active tickets per agent) and the
            // "my assigned tickets" filter in the agent dashboard.
            $table->index(['assigned_admin_id', 'status']);
        });

        // Agent presence + availability — the inputs to least-connections routing.
        Schema::table('admins', function (Blueprint $table) {
            // Agent toggles this when they start/stop accepting chats.
            $table->boolean('is_available')->default(false);
            // Heartbeat timestamp; "online" = available AND seen within the threshold.
            $table->timestamp('last_seen_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropForeign(['assigned_admin_id']);
            $table->dropIndex(['assigned_admin_id', 'status']);
            $table->dropColumn('assigned_admin_id');
        });

        Schema::table('admins', function (Blueprint $table) {
            $table->dropColumn(['is_available', 'last_seen_at']);
        });
    }
};
