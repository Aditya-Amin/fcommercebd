@extends('admin.layout')
@section('title', $ticket->ticket_id . ' — Support')
@section('page-title', 'Support Ticket')

@section('content')

{{-- Back + header --}}
<div class="flex items-center justify-between gap-4 mb-6 flex-wrap">
    <div class="flex items-center gap-4">
        <a href="{{ route('admin.support.index') }}"
           class="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition">
            <i class="fa-solid fa-arrow-left"></i> Back to Tickets
        </a>
        <div>
            <span class="font-mono text-sm font-semibold text-violet-400">{{ $ticket->ticket_id }}</span>
            <span class="ml-2 text-gray-400 text-xs">·</span>
            <span class="ml-2 text-sm text-gray-200">{{ $ticket->subject }}</span>
        </div>
    </div>

    {{-- Status badge + change --}}
    <form method="POST" action="{{ route('admin.support.status', $ticket) }}" class="flex items-center gap-2">
        @csrf
        @php
            $statusColors = [
                'open'        => 'bg-blue-900/50 text-blue-400 border-blue-700/40',
                'in_progress' => 'bg-amber-900/50 text-amber-400 border-amber-700/40',
                'resolved'    => 'bg-green-900/50 text-green-400 border-green-700/40',
                'closed'      => 'bg-gray-700 text-gray-400 border-gray-600/40',
            ];
        @endphp
        <select name="status"
                class="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-violet-500">
            @foreach(['open'=>'Open','in_progress'=>'In Progress','resolved'=>'Resolved','closed'=>'Closed'] as $val=>$label)
            <option value="{{ $val }}" {{ $ticket->status === $val ? 'selected' : '' }}>{{ $label }}</option>
            @endforeach
        </select>
        <button type="submit" class="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded-lg transition">
            Update Status
        </button>
    </form>
</div>

@if(session('success'))
    <div class="flex items-center gap-3 rounded-xl bg-green-900/40 border border-green-700/50 px-4 py-3 mb-4 text-sm text-green-300">
        <i class="fa-solid fa-circle-check"></i> {{ session('success') }}
    </div>
@endif

<div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

    {{-- Chat panel --}}
    <div class="lg:col-span-2 card flex flex-col" style="height:600px">

        {{-- Messages --}}
        <div id="chat-scroll" class="flex-1 overflow-y-auto p-5 space-y-4">
            @forelse($ticket->messages as $msg)
            @php $isAdmin = $msg->sender_type === 'admin'; @endphp
            <div class="flex {{ $isAdmin ? 'justify-end' : 'justify-start' }} gap-2">
                @if(!$isAdmin)
                <div class="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
                    {{ strtoupper(substr($ticket->user->name ?? '?', 0, 1)) }}
                </div>
                @endif
                <div class="max-w-[72%]">
                    <p class="text-[10px] text-gray-500 mb-1 {{ $isAdmin ? 'text-right' : '' }}">
                        {{ $msg->sender_name }} · {{ $msg->created_at->format('M j, g:i A') }}
                    </p>
                    <div class="px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                        {{ $isAdmin
                            ? 'bg-violet-600 text-white rounded-tr-sm'
                            : 'bg-gray-700/60 text-gray-200 rounded-tl-sm' }}">
                        {{ $msg->message }}
                    </div>
                </div>
                @if($isAdmin)
                <div class="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
                    A
                </div>
                @endif
            </div>
            @empty
            <p class="text-center text-gray-500 text-xs py-8">No messages yet.</p>
            @endforelse
        </div>

        {{-- Reply box --}}
        <div class="border-t border-gray-700/40 p-4">
            @if($ticket->status === 'closed')
            <p class="text-xs text-gray-500 text-center py-2">This ticket is closed. Update the status to reply.</p>
            @else
            <form method="POST" action="{{ route('admin.support.reply', $ticket) }}" class="flex gap-3 items-end">
                @csrf
                <textarea name="message" rows="2" required placeholder="Type your reply…"
                          class="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200
                                 focus:outline-none focus:border-violet-500 resize-none placeholder-gray-500"></textarea>
                <button type="submit"
                        class="flex-shrink-0 inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700
                               text-white text-sm font-medium px-4 py-2.5 rounded-xl transition">
                    <i class="fa-solid fa-paper-plane text-xs"></i> Send
                </button>
            </form>
            @endif
        </div>
    </div>

    {{-- Ticket info sidebar --}}
    <div class="space-y-4">
        <div class="card p-5">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">User Info</h3>
            <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-full bg-violet-700 flex items-center justify-center text-sm font-bold">
                    {{ strtoupper(substr($ticket->user->name ?? '?', 0, 1)) }}
                </div>
                <div>
                    <p class="text-sm font-semibold text-white">{{ $ticket->user->name ?? 'Deleted' }}</p>
                    <p class="text-xs text-gray-400">{{ $ticket->user->email ?? '' }}</p>
                </div>
            </div>
            @if($ticket->user)
            <a href="{{ route('admin.users.activity', $ticket->user) }}"
               class="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition">
                <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> View user activity
            </a>
            @endif
        </div>

        <div class="card p-5">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Ticket Info</h3>
            <div class="space-y-3 text-xs">
                <div class="flex justify-between">
                    <span class="text-gray-500">Ticket ID</span>
                    <span class="font-mono text-violet-400">{{ $ticket->ticket_id }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-500">Created</span>
                    <span class="text-gray-300">{{ $ticket->created_at->format('M j, Y') }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-500">Messages</span>
                    <span class="text-gray-300">{{ $ticket->messages->count() }}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-500">Last activity</span>
                    <span class="text-gray-300">{{ ($ticket->last_message_at ?? $ticket->created_at)?->diffForHumans() }}</span>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    // Auto-scroll chat to bottom on load
    const el = document.getElementById('chat-scroll');
    if (el) el.scrollTop = el.scrollHeight;
</script>

@endsection
