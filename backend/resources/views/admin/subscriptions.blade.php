@extends('admin.layout')

@section('title', 'User Subscriptions')
@section('page-title', 'User Subscriptions')

@section('content')
<div class="card p-5">
    <table class="w-full text-sm">
        <thead>
            <tr class="text-xs text-gray-500 uppercase border-b border-gray-700/40">
                <th class="text-left pb-3">#</th>
                <th class="text-left pb-3">User</th>
                <th class="text-left pb-3">Plan</th>
                <th class="text-left pb-3">Amount</th>
                <th class="text-left pb-3">Start</th>
                <th class="text-left pb-3">Expiry</th>
                <th class="text-left pb-3">Status</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-700/30">
            @forelse($subscriptions as $sub)
            <tr>
                <td class="py-3 text-gray-500">{{ $sub->id }}</td>
                <td class="py-3 text-gray-300">{{ $sub->user->name ?? 'N/A' }}</td>
                <td class="py-3 text-gray-300">{{ $sub->plan->name ?? 'N/A' }}</td>
                <td class="py-3 text-gray-300">৳ {{ number_format($sub->amount, 0) }}</td>
                <td class="py-3 text-gray-400">{{ $sub->start_date?->format('M j, Y') ?? '—' }}</td>
                <td class="py-3 text-gray-400">{{ $sub->expiry_date?->format('M j, Y') ?? '—' }}</td>
                <td class="py-3">
                    <span class="px-2 py-0.5 rounded-full text-xs font-medium badge-{{ $sub->status }}">
                        {{ ucfirst($sub->status) }}
                    </span>
                </td>
            </tr>
            @empty
            <tr><td colspan="7" class="py-8 text-center text-gray-500">No subscriptions found</td></tr>
            @endforelse
        </tbody>
    </table>
    <div class="mt-4">{{ $subscriptions->links() }}</div>
</div>
@endsection
