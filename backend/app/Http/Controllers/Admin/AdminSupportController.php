<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportMessage;
use App\Models\SupportTicket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AdminSupportController extends Controller
{
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
        $ticket->load(['user', 'messages']);
        return view('admin.support.show', compact('ticket'));
    }

    /** POST /admin/support/{ticket}/reply */
    public function reply(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        SupportMessage::create([
            'support_ticket_id' => $ticket->id,
            'sender_type'       => 'admin',
            'sender_name'       => auth('admin')->user()->name,
            'message'           => $data['message'],
        ]);

        $ticket->update([
            'status'          => SupportTicket::STATUS_IN_PROGRESS,
            'last_message_at' => now(),
        ]);

        return back()->with('success', 'Reply sent.');
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
