<?php

namespace App\Services\Support;

use App\Models\Admin;
use App\Models\SupportTicket;
use Illuminate\Support\Facades\DB;

/**
 * Least-connections routing for support tickets.
 *
 * Picks the online agent with the fewest active (open/in_progress) tickets,
 * breaking ties by the longest-idle agent so load spreads evenly. The whole
 * selection runs inside a transaction with a row lock on the candidate agents
 * so two tickets arriving at the same instant can't both grab the same agent.
 */
class SupportAssignmentService
{
    /**
     * Route a ticket to the best available agent.
     *
     * @return Admin|null  the assigned agent, or null if none were online
     *                     (ticket is left unassigned in the shared queue).
     */
    public function assign(SupportTicket $ticket): ?Admin
    {
        return DB::transaction(function () use ($ticket) {
            $agent = Admin::query()
                ->receivingChats()
                ->withCount(['assignedTickets as active_load' => function ($q) {
                    $q->whereIn('status', [
                        SupportTicket::STATUS_OPEN,
                        SupportTicket::STATUS_IN_PROGRESS,
                    ]);
                }])
                ->orderBy('active_load')   // fewest active chats first
                ->orderBy('last_seen_at')  // tie-break: longest idle gets the next one
                ->lockForUpdate()          // serialize concurrent assignment
                ->first();

            if (! $agent) {
                return null;
            }

            $ticket->forceFill([
                'assigned_admin_id' => $agent->id,
                'status'            => SupportTicket::STATUS_IN_PROGRESS,
            ])->save();

            return $agent;
        });
    }

    /**
     * Let an agent claim an unassigned ticket (e.g. when they open or reply to
     * one from the shared queue). Idempotent: if it's already assigned to
     * someone else, the existing owner is kept and returned unchanged.
     */
    public function claim(SupportTicket $ticket, Admin $agent): Admin
    {
        return DB::transaction(function () use ($ticket, $agent) {
            $fresh = SupportTicket::whereKey($ticket->id)->lockForUpdate()->first();

            if ($fresh->assigned_admin_id === null) {
                $fresh->forceFill(['assigned_admin_id' => $agent->id])->save();
                $ticket->assigned_admin_id = $agent->id;
            }

            return $fresh->assignedAdmin ?? $agent;
        });
    }
}
