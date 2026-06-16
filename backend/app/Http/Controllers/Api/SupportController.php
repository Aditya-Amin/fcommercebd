<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportController extends Controller
{
    /** GET /api/support/tickets — list the authenticated user's tickets */
    public function index(Request $request): JsonResponse
    {
        $tickets = SupportTicket::where('user_id', $request->user()->id)
            ->with(['messages' => fn ($q) => $q->latest('created_at')->limit(1)])
            ->latest('last_message_at')
            ->latest('created_at')
            ->get()
            ->map(fn ($t) => $this->ticketShape($t));

        return response()->json(['data' => $tickets]);
    }

    /** POST /api/support/tickets — open a new ticket */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:200'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $ticket = SupportTicket::create([
            'ticket_id'       => SupportTicket::generateTicketId(),
            'user_id'         => $request->user()->id,
            'subject'         => $data['subject'],
            'status'          => SupportTicket::STATUS_OPEN,
            'last_message_at' => now(),
        ]);

        SupportMessage::create([
            'support_ticket_id' => $ticket->id,
            'sender_type'       => 'user',
            'sender_name'       => $request->user()->name,
            'message'           => $data['message'],
        ]);

        $ticket->load('messages');

        return response()->json(['data' => $this->ticketShape($ticket)], 201);
    }

    /** GET /api/support/tickets/{ticket} — ticket detail + all messages */
    public function show(Request $request, SupportTicket $ticket): JsonResponse
    {
        abort_if($ticket->user_id !== $request->user()->id, 403);

        $ticket->load('messages');

        return response()->json(['data' => $this->ticketShape($ticket, true)]);
    }

    /** POST /api/support/tickets/{ticket}/messages — user sends a reply */
    public function reply(Request $request, SupportTicket $ticket): JsonResponse
    {
        abort_if($ticket->user_id !== $request->user()->id, 403);
        abort_if(! $ticket->isOpen(), 422, 'This ticket is closed.');

        $data = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $msg = SupportMessage::create([
            'support_ticket_id' => $ticket->id,
            'sender_type'       => 'user',
            'sender_name'       => $request->user()->name,
            'message'           => $data['message'],
        ]);

        $ticket->update(['last_message_at' => now()]);

        return response()->json(['data' => $this->messageShape($msg)], 201);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function ticketShape(SupportTicket $t, bool $withMessages = false): array
    {
        $last = $t->messages->last();

        $shape = [
            'id'              => $t->id,
            'ticket_id'       => $t->ticket_id,
            'subject'         => $t->subject,
            'status'          => $t->status,
            'last_message_at' => $t->last_message_at?->toIso8601String(),
            'created_at'      => $t->created_at->toIso8601String(),
            'last_message'    => $last ? mb_substr($last->message, 0, 80) : null,
        ];

        if ($withMessages) {
            $shape['messages'] = $t->messages->map(fn ($m) => $this->messageShape($m))->values()->all();
        }

        return $shape;
    }

    private function messageShape(SupportMessage $m): array
    {
        return [
            'id'          => $m->id,
            'sender_type' => $m->sender_type,
            'sender_name' => $m->sender_name,
            'message'     => $m->message,
            'created_at'  => $m->created_at->toIso8601String(),
        ];
    }
}
