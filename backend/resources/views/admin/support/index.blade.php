@extends('admin.layout')
@section('title', 'Support Tickets')
@section('page-title', 'Support Tickets')

@section('content')

@if(session('success'))
    <div class="flex items-center gap-3 rounded-xl bg-green-900/40 border border-green-700/50 px-4 py-3 mb-6 text-sm text-green-300">
        <i class="fa-solid fa-circle-check"></i> {{ session('success') }}
    </div>
@endif

{{-- Status filter tabs --}}
<div class="flex items-center gap-2 mb-5 flex-wrap">
    @foreach([''=>'All','open'=>'Open','in_progress'=>'In Progress','resolved'=>'Resolved','closed'=>'Closed'] as $val => $label)
    @php
        $active = ($status ?? '') === $val;
        $count  = $val === '' ? $counts['all'] : ($counts[$val] ?? 0);
    @endphp
    <a href="{{ route('admin.support.index', array_merge(request()->except(['status','page']), $val ? ['status'=>$val] : [])) }}"
       class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition
              {{ $active ? 'bg-violet-600 text-white' : 'bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700' }}">
        {{ $label }}
        <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold {{ $active ? 'bg-white/20 text-white' : 'bg-gray-600 text-gray-300' }}">
            {{ $count }}
        </span>
    </a>
    @endforeach

    {{-- Search --}}
    <form class="ml-auto flex items-center gap-2" method="GET" action="{{ route('admin.support.index') }}">
        @if($status) <input type="hidden" name="status" value="{{ $status }}"> @endif
        <div class="relative">
            <input type="text" name="search" value="{{ $search ?? '' }}" placeholder="Search ticket / user…"
                   class="bg-gray-800 text-sm rounded-lg pl-9 pr-4 py-1.5 w-56 focus:outline-none focus:ring-1 focus:ring-violet-500 text-gray-300 placeholder-gray-500"/>
            <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-gray-500 text-xs"></i>
        </div>
        <button type="submit" class="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded-lg transition">Search</button>
    </form>
</div>

{{-- Ticket list --}}
<div class="card overflow-hidden">
    @if($tickets->isEmpty())
        <div class="py-16 text-center text-gray-500">
            <i class="fa-solid fa-ticket text-3xl mb-3 opacity-30"></i>
            <p class="text-sm">No support tickets yet.</p>
        </div>
    @else
    <table class="w-full text-sm">
        <thead>
            <tr class="text-xs text-gray-500 uppercase border-b border-gray-700/40">
                <th class="text-left px-5 py-3">Ticket</th>
                <th class="text-left px-4 py-3">User</th>
                <th class="text-left px-4 py-3">Subject</th>
                <th class="text-left px-4 py-3">Status</th>
                <th class="text-left px-4 py-3">Last Activity</th>
                <th class="px-4 py-3"></th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-700/30">
            @foreach($tickets as $ticket)
            @php
                $lastMsg = $ticket->messages->first();
                $statusColors = [
                    'open'        => 'bg-blue-900/50 text-blue-400',
                    'in_progress' => 'bg-amber-900/50 text-amber-400',
                    'resolved'    => 'bg-green-900/50 text-green-400',
                    'closed'      => 'bg-gray-700 text-gray-400',
                ];
            @endphp
            <tr class="hover:bg-gray-700/20 transition">
                <td class="px-5 py-3">
                    <span class="font-mono text-xs text-violet-400">{{ $ticket->ticket_id }}</span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {{ strtoupper(substr($ticket->user->name ?? '?', 0, 1)) }}
                        </div>
                        <div>
                            <p class="text-xs font-medium text-gray-200">{{ $ticket->user->name ?? 'Deleted' }}</p>
                            <p class="text-[11px] text-gray-500">{{ $ticket->user->email ?? '' }}</p>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3 max-w-xs">
                    <p class="text-gray-200 text-xs font-medium truncate">{{ $ticket->subject }}</p>
                    @if($lastMsg)
                    <p class="text-[11px] text-gray-500 truncate mt-0.5">{{ Str::limit($lastMsg->message, 55) }}</p>
                    @endif
                </td>
                <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-medium {{ $statusColors[$ticket->status] ?? 'bg-gray-700 text-gray-400' }}">
                        {{ ucfirst(str_replace('_', ' ', $ticket->status)) }}
                    </span>
                </td>
                <td class="px-4 py-3 text-[11px] text-gray-500">
                    {{ ($ticket->last_message_at ?? $ticket->created_at)?->diffForHumans() }}
                </td>
                <td class="px-4 py-3">
                    <a href="{{ route('admin.support.show', $ticket) }}"
                       class="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition">
                        View <i class="fa-solid fa-arrow-right text-[10px]"></i>
                    </a>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    @if($tickets->hasPages())
    <div class="px-5 py-3 border-t border-gray-700/40">
        {{ $tickets->links() }}
    </div>
    @endif
    @endif
</div>

@endsection
