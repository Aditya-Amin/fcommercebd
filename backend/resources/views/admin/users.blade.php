@extends('admin.layout')

@section('title', 'User Data')
@section('page-title', 'User Data')

@section('content')
<div class="card p-5">
    <div class="flex items-center justify-between mb-5">
        <p class="text-sm text-gray-400">Total <span class="text-white font-semibold">{{ $users->total() }}</span> users registered</p>
    </div>

    <table class="w-full text-sm">
        <thead>
            <tr class="text-xs text-gray-500 uppercase border-b border-gray-700/40">
                <th class="text-left pb-3 pr-4">#</th>
                <th class="text-left pb-3 pr-4">Name</th>
                <th class="text-left pb-3 pr-4">Email</th>
                <th class="text-left pb-3 pr-4">Business</th>
                <th class="text-left pb-3 pr-4">Phone</th>
                <th class="text-left pb-3 pr-4">Plan</th>
                <th class="text-left pb-3 pr-4">Subscriptions</th>
                <th class="text-left pb-3 pr-4">Joined</th>
                <th class="text-left pb-3">Activity</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-700/30">
            @forelse($users as $user)
            @php $sub = $user->lastSubscription; @endphp
            <tr>
                <td class="py-3 pr-4 text-gray-500">{{ $user->id }}</td>
                <td class="py-3 pr-4">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {{ strtoupper(substr($user->name, 0, 1)) }}
                        </div>
                        <span class="text-gray-200">{{ $user->name }}</span>
                    </div>
                </td>
                <td class="py-3 pr-4 text-gray-400">{{ $user->email }}</td>
                <td class="py-3 pr-4 text-gray-400">{{ $user->business ?? '—' }}</td>
                <td class="py-3 pr-4 text-gray-400">{{ $user->phone ?? '—' }}</td>
                <td class="py-3 pr-4">
                    @if($sub)
                        <span class="px-2 py-0.5 rounded-full text-xs font-medium badge-{{ $sub->status }}">
                            {{ $sub->plan->name ?? 'N/A' }}
                        </span>
                    @else
                        <span class="text-gray-600 text-xs">No plan</span>
                    @endif
                </td>
                <td class="py-3 pr-4 text-gray-300 text-center">{{ $user->subscriptions_count }}</td>
                <td class="py-3 pr-4 text-gray-400">{{ $user->created_at->format('M j, Y') }}</td>
                <td class="py-3">
                    <a href="{{ route('admin.users.activity', $user) }}"
                       class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 text-xs font-medium transition border border-violet-500/30">
                        <i class="fa-solid fa-chart-bar text-[10px]"></i> Activity
                    </a>
                </td>
            </tr>
            @empty
            <tr><td colspan="8" class="py-8 text-center text-gray-500">No users found</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="mt-4">{{ $users->links() }}</div>
</div>
@endsection
