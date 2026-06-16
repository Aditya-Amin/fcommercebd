<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportMessage;
use App\Models\SupportTicket;
use App\Services\Support\SupportAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AdminSupportController extends Controller
{
    public function __construct(private SupportAssignmentService $assignment)
    {
    }

    /** GET /admin/support */
    public function index(Request $request): View
    {
        $status  = $request->query('status');
        $search  = $request->query('search');

        $tickets = SupportTicket::with(['user', 'messages' => fn ($q) => $q->latest('created_at')->limit(1)])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($search, fn ($q) => $q->where(function ($q2) use ($search) {
                $q2->where('ticket_id', 'like', "%{$search}%")
                   ->orWhere('subject', 'like', "%{$search}%")
                   ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")
                       ->orWhere('email', 'like', "%{$search}%"));
            }))
            ->latest('last_message_at')
            ->latest('created_at')
            ->paginate(20)
            ->withQueryString();

        $counts = [
            'all'         => SupportTicket::count(),
            'open'        => SupportTicket::where('status', 'open')->count(),
            'in_progress' => SupportTicket::where('status', 'in_progress')->count(),
            'resolved'    => SupportTicket::where('status', 'resolved')->count(),
            'closed'      => SupportTicket::where('status', 'closed')->count(),
        ];

        return view('admin.support.index', compact('tickets', 'counts', 'status', 'search'));
    }

    /** GET /admin/support/{ticket} */
    public function show(SupportTicket $ticket): View
    {
        $ticket->load(['user', 'assignedAdmin', 'messages']);
        return view('admin.support.show', compact('ticket'));
    }

    /** POST /admin/support/{ticket}/reply — sends a reply and renders the page. */
    public function reply(Request $request, SupportTicket $ticket): RedirectResponse|JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $msg = $this->storeAdminReply($ticket, $data['message']);

        // The chat UI sends replies via fetch() and expects JSON back so it can
        // append the bubble without a full page reload. Plain form posts still
        // get the classic redirect.
        if ($request->wantsJson() || $request->boolean('ajax')) {
            return response()->json(['data' => $this->messageShape($msg)], 201);
        }

        return back()->with('success', 'Reply sent.');
    }

    /**
     * GET /admin/support/{ticket}/messages?after_id=N — cursor delta poll.
     * Returns only messages newer than after_id so the agent's chat updates
     * in near-real-time without WebSockets.
     */
    public function messages(Request $request, SupportTicket $ticket): JsonResponse
    {
        $afterId = (int) $request->query('after_id', 0);

        $messages = $ticket->messages()
            ->when($afterId > 0, fn ($q) => $q->where('id', '>', $afterId))
            ->orderBy('id')
            ->get()
            ->map(fn ($m) => $this->messageShape($m))
            ->values()
            ->all();

        return response()->json([
            'data'   => $messages,
            'status' => $ticket->status,
        ]);
    }

    /**
     * POST /admin/support/heartbeat — presence ping from the agent dashboard
     * (~every 30s). Keeps last_seen_at fresh so routing knows the agent is online.
     */
    public function heartbeat(): JsonResponse
    {
        $admin = auth('admin')->user();
        $admin->forceFill(['last_seen_at' => now()])->save();

        return response()->json([
            'is_available' => (bool) $admin->is_available,
            'active_load'  => $admin->assignedTickets()
                ->whereIn('status', [SupportTicket::STATUS_OPEN, SupportTicket::STATUS_IN_PROGRESS])
                ->count(),
        ]);
    }

    /** POST /admin/support/availability — agent toggles "accepting chats". */
    public function availability(Request $request): JsonResponse
    {
        $data = $request->validate(['available' => ['required', 'boolean']]);

        $admin = auth('admin')->user();
        $admin->forceFill([
            'is_available' => $data['available'],
            'last_seen_at' => now(),
        ])->save();

        return response()->json(['is_available' => (bool) $admin->is_available]);
    }

    /** Create an admin reply, auto-claiming the ticket if it's unassigned. */
    private function storeAdminReply(SupportTicket $ticket, string $message): SupportMessage
    {
        $admin = auth('admin')->user();

        // Replying to a ticket from the shared queue claims ownership of it.
        if ($ticket->assigned_admin_id === null) {
            $this->assignment->claim($ticket, $admin);
        }

        $msg = SupportMessage::create([
            'support_ticket_id' => $ticket->id,
            'sender_type'       => 'admin',
            'sender_name'       => $admin->name,
            'message'           => $message,
        ]);

        $ticket->update([
            'status'          => SupportTicket::STATUS_IN_PROGRESS,
            'last_message_at' => now(),
        ]);

        return $msg;
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

    /** POST /admin/support/{ticket}/status */
    public function updateStatus(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:open,in_progress,resolved,closed'],
        ]);

        $ticket->update(['status' => $data['status']]);

        return back()->with('success', 'Ticket status updated.');
    }
}
