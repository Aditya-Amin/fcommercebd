@extends('admin.layout')

@section('title', 'Plans')
@section('page-title', 'Plans')

@section('content')
<div class="card p-5">
    @if(session('success'))
        <div class="flex items-center gap-3 rounded-xl bg-green-900/40 border border-green-700/50 px-4 py-3 mb-4 text-sm text-green-300">
            <i class="fa-solid fa-circle-check"></i> {{ session('success') }}
        </div>
    @endif
    @if(session('error'))
        <div class="flex items-center gap-3 rounded-xl bg-red-900/40 border border-red-700/50 px-4 py-3 mb-4 text-sm text-red-300">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ session('error') }}
        </div>
    @endif

    <div class="flex items-center justify-between mb-5">
        <p class="text-sm text-gray-400">Total <span class="text-white font-semibold">{{ $plans->total() }}</span> plan(s)</p>
        <a href="{{ route('admin.plans.create') }}"
           class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            <i class="fa-solid fa-plus text-xs"></i> New Plan
        </a>
    </div>

    <div class="overflow-x-auto">
    <table class="w-full text-sm">
        <thead>
            <tr class="text-xs text-gray-500 uppercase border-b border-gray-700/40">
                <th class="text-left pb-3 pr-4">Name</th>
                <th class="text-left pb-3 pr-4">Price</th>
                <th class="text-left pb-3 pr-4">Duration</th>
                <th class="text-left pb-3 pr-4">FB Posts</th>
                <th class="text-left pb-3 pr-4">AI Gen</th>
                <th class="text-left pb-3 pr-4">SMS</th>
                <th class="text-left pb-3 pr-4">Active Subs</th>
                <th class="text-left pb-3 pr-4">Status</th>
                <th class="text-left pb-3">Actions</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-700/30">
            @forelse($plans as $plan)
            <tr>
                <td class="py-3 pr-4">
                    <p class="text-gray-200 font-medium">{{ $plan->name }}</p>
                    <p class="text-xs text-gray-600">{{ $plan->slug }}</p>
                </td>
                <td class="py-3 pr-4 text-gray-300">{{ $plan->currency }} {{ number_format($plan->price, 0) }}</td>
                <td class="py-3 pr-4 text-gray-400">{{ ucfirst($plan->duration) }} · {{ $plan->duration_days }}d</td>
                <td class="py-3 pr-4 text-gray-400">{{ $plan->limit('fbPosts') ?? 0 }}</td>
                <td class="py-3 pr-4 text-gray-400">{{ $plan->limit('aiGenerations') ?? 0 }}</td>
                <td class="py-3 pr-4 text-gray-400">{{ $plan->limit('sms') ?? 0 }}</td>
                <td class="py-3 pr-4 text-gray-300 text-center">{{ $plan->active_subscriptions_count }}</td>
                <td class="py-3 pr-4">
                    @if($plan->is_active)
                        <span class="px-2 py-0.5 rounded-full text-xs font-medium badge-active">Active</span>
                    @else
                        <span class="px-2 py-0.5 rounded-full text-xs font-medium badge-expired">Inactive</span>
                    @endif
                </td>
                <td class="py-3">
                    <div class="flex items-center gap-2">
                        <a href="{{ route('admin.plans.edit', $plan) }}"
                           class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 text-xs font-medium transition border border-violet-500/30">
                            <i class="fa-solid fa-pen text-[10px]"></i> Edit
                        </a>
                        <form method="POST" action="{{ route('admin.plans.destroy', $plan) }}"
                              onsubmit="return confirm('Delete the {{ addslashes($plan->name) }} plan? This cannot be undone.');">
                            @csrf
                            @method('DELETE')
                            <button type="submit"
                                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-medium transition border border-red-500/30">
                                <i class="fa-solid fa-trash text-[10px]"></i> Delete
                            </button>
                        </form>
                    </div>
                </td>
            </tr>
            @empty
            <tr><td colspan="9" class="py-8 text-center text-gray-500">No plans yet — create your first one.</td></tr>
            @endforelse
        </tbody>
    </table>
    </div>

    <div class="mt-4">{{ $plans->links() }}</div>
</div>
@endsection
