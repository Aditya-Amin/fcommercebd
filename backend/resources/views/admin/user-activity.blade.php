@extends('admin.layout')
@section('title', $user->name . ' — Activity')
@section('page-title', 'User Activity')

@section('content')
{{-- Back + Header --}}
<div class="flex items-center gap-4 mb-6">
    <a href="{{ route('admin.users') }}"
       class="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition">
        <i class="fa-solid fa-arrow-left"></i> Back to Users
    </a>
    <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-violet-700 flex items-center justify-center text-sm font-bold">
            {{ strtoupper(substr($user->name, 0, 1)) }}
        </div>
        <div>
            <p class="text-white font-semibold text-sm">{{ $user->name }}</p>
            <p class="text-gray-400 text-xs">{{ $user->email }} @if($user->phone) · {{ $user->phone }} @endif</p>
        </div>
        @if($user->business)
        <span class="ml-2 px-2.5 py-0.5 rounded-full bg-gray-700 text-gray-300 text-xs">{{ $user->business }}</span>
        @endif
    </div>
</div>

{{-- ── Stats Cards ──────────────────────────────────────────────────── --}}
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {{-- Products --}}
    <div class="card p-4">
        <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <i class="fa-solid fa-box text-blue-400 text-xs"></i>
            </div>
            <p class="text-xs text-gray-400 font-medium">Products Added</p>
        </div>
        <p class="text-2xl font-bold text-white">{{ $stats['products'] }}</p>
    </div>

    {{-- AI Posts --}}
    <div class="card p-4">
        <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <i class="fa-solid fa-wand-magic-sparkles text-violet-400 text-xs"></i>
            </div>
            <p class="text-xs text-gray-400 font-medium">AI Posts Made</p>
        </div>
        <p class="text-2xl font-bold text-white">{{ $stats['ai_posts_total'] }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ $stats['ai_posts_published'] }} published</p>
    </div>

    {{-- SMS --}}
    <div class="card p-4">
        <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <i class="fa-solid fa-comment-sms text-green-400 text-xs"></i>
            </div>
            <p class="text-xs text-gray-400 font-medium">SMS Sent</p>
        </div>
        <p class="text-2xl font-bold text-white">{{ $stats['sms_sent'] }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ $stats['sms_delivered'] }} delivered</p>
    </div>

    {{-- Orders --}}
    <div class="card p-4">
        <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <i class="fa-solid fa-truck text-orange-400 text-xs"></i>
            </div>
            <p class="text-xs text-gray-400 font-medium">Orders Served</p>
        </div>
        <p class="text-2xl font-bold text-white">{{ $stats['orders'] }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ $stats['orders_delivered'] }} delivered</p>
    </div>
</div>

{{-- ── Subscription History + Spending ─────────────────────────────── --}}
<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
    <div class="lg:col-span-2 card p-5">
        <h3 class="text-sm font-semibold text-white mb-4">Subscription History</h3>
        @if($subscriptions->isEmpty())
            <p class="text-xs text-gray-500">No subscriptions yet.</p>
        @else
        <table class="w-full text-xs">
            <thead>
                <tr class="text-gray-500 uppercase border-b border-gray-700/40">
                    <th class="text-left pb-2 pr-3">Plan</th>
                    <th class="text-left pb-2 pr-3">Start</th>
                    <th class="text-left pb-2 pr-3">Expiry</th>
                    <th class="text-left pb-2">Status</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/30">
                @foreach($subscriptions as $sub)
                <tr>
                    <td class="py-2 pr-3 text-gray-200 font-medium">{{ $sub->plan->name ?? 'N/A' }}</td>
                    <td class="py-2 pr-3 text-gray-400">{{ $sub->start_date ? \Carbon\Carbon::parse($sub->start_date)->format('M j, Y') : '—' }}</td>
                    <td class="py-2 pr-3 text-gray-400">{{ $sub->expiry_date ? \Carbon\Carbon::parse($sub->expiry_date)->format('M j, Y') : '—' }}</td>
                    <td class="py-2"><span class="px-2 py-0.5 rounded-full text-[10px] font-medium badge-{{ $sub->status }}">{{ $sub->status }}</span></td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @endif
    </div>

    <div class="card p-5 flex flex-col justify-between">
        <div>
            <h3 class="text-sm font-semibold text-white mb-1">Total Spent</h3>
            <p class="text-xs text-gray-400 mb-4">Completed payments only</p>
            <p class="text-3xl font-bold text-white">৳{{ number_format($stats['total_spent'], 0) }}</p>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-700/40">
            <p class="text-xs text-gray-500">Joined {{ $user->created_at->format('M j, Y') }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ $subscriptions->count() }} total subscription(s)</p>
        </div>
    </div>
</div>

{{-- ── Recent Activity Tabs ──────────────────────────────────────────── --}}
<div class="card p-5">
    {{-- Tab buttons --}}
    <div class="flex gap-2 mb-5 border-b border-gray-700/40 pb-3">
        @foreach(['products' => 'Products', 'posts' => 'AI Posts', 'sms' => 'SMS', 'orders' => 'Orders'] as $tab => $label)
        <button onclick="showTab('{{ $tab }}')" id="tab-btn-{{ $tab }}"
                class="tab-btn px-3 py-1.5 rounded-lg text-xs font-medium transition
                    {{ $tab === 'products' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700/50' }}">
            {{ $label }}
        </button>
        @endforeach
    </div>

    {{-- Products tab --}}
    <div id="tab-products" class="tab-panel">
        @if($recentProducts->isEmpty())
            <p class="text-xs text-gray-500">No products added yet.</p>
        @else
        <table class="w-full text-xs">
            <thead><tr class="text-gray-500 uppercase border-b border-gray-700/40">
                <th class="text-left pb-2 pr-3">Title</th>
                <th class="text-left pb-2 pr-3">Price</th>
                <th class="text-left pb-2">Added</th>
            </tr></thead>
            <tbody class="divide-y divide-gray-700/30">
                @foreach($recentProducts as $p)
                <tr>
                    <td class="py-2 pr-3 text-gray-200">{{ $p->title }}</td>
                    <td class="py-2 pr-3 text-gray-400">৳{{ number_format($p->price, 0) }}</td>
                    <td class="py-2 text-gray-400">{{ $p->created_at->format('M j, Y') }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @endif
    </div>

    {{-- AI Posts tab --}}
    <div id="tab-posts" class="tab-panel hidden">
        @if($recentPosts->isEmpty())
            <p class="text-xs text-gray-500">No AI posts yet.</p>
        @else
        <table class="w-full text-xs">
            <thead><tr class="text-gray-500 uppercase border-b border-gray-700/40">
                <th class="text-left pb-2 pr-3">Message</th>
                <th class="text-left pb-2 pr-3">Status</th>
                <th class="text-left pb-2">Date</th>
            </tr></thead>
            <tbody class="divide-y divide-gray-700/30">
                @foreach($recentPosts as $post)
                <tr>
                    <td class="py-2 pr-3 text-gray-200 max-w-xs truncate">{{ Str::limit($post->message, 60) }}</td>
                    <td class="py-2 pr-3">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-medium
                            {{ $post->status === 'published' ? 'bg-green-900/50 text-green-400' :
                               ($post->status === 'failed' ? 'bg-red-900/50 text-red-400' : 'bg-gray-700 text-gray-400') }}">
                            {{ $post->status }}
                        </span>
                    </td>
                    <td class="py-2 text-gray-400">{{ $post->created_at->format('M j, Y') }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @endif
    </div>

    {{-- SMS tab --}}
    <div id="tab-sms" class="tab-panel hidden">
        @if($recentSms->isEmpty())
            <p class="text-xs text-gray-500">No SMS sent yet.</p>
        @else
        <table class="w-full text-xs">
            <thead><tr class="text-gray-500 uppercase border-b border-gray-700/40">
                <th class="text-left pb-2 pr-3">Recipient</th>
                <th class="text-left pb-2 pr-3">Message</th>
                <th class="text-left pb-2 pr-3">Status</th>
                <th class="text-left pb-2">Sent</th>
            </tr></thead>
            <tbody class="divide-y divide-gray-700/30">
                @foreach($recentSms as $sms)
                <tr>
                    <td class="py-2 pr-3 text-gray-200 font-mono">{{ $sms->recipient }}</td>
                    <td class="py-2 pr-3 text-gray-400 max-w-xs truncate">{{ Str::limit($sms->message, 50) }}</td>
                    <td class="py-2 pr-3">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-medium
                            {{ $sms->status === 'delivered' ? 'bg-green-900/50 text-green-400' :
                               ($sms->status === 'failed' ? 'bg-red-900/50 text-red-400' : 'bg-gray-700 text-gray-400') }}">
                            {{ $sms->status }}
                        </span>
                    </td>
                    <td class="py-2 text-gray-400">{{ $sms->created_at->format('M j, Y') }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @endif
    </div>

    {{-- Orders tab --}}
    <div id="tab-orders" class="tab-panel hidden">
        @if($recentOrders->isEmpty())
            <p class="text-xs text-gray-500">No orders yet.</p>
        @else
        <table class="w-full text-xs">
            <thead><tr class="text-gray-500 uppercase border-b border-gray-700/40">
                <th class="text-left pb-2 pr-3">Consignment ID</th>
                <th class="text-left pb-2 pr-3">Recipient</th>
                <th class="text-left pb-2 pr-3">Amount</th>
                <th class="text-left pb-2 pr-3">Status</th>
                <th class="text-left pb-2">Date</th>
            </tr></thead>
            <tbody class="divide-y divide-gray-700/30">
                @foreach($recentOrders as $order)
                <tr>
                    <td class="py-2 pr-3 text-gray-200 font-mono">{{ $order->consignment_id ?? '—' }}</td>
                    <td class="py-2 pr-3 text-gray-400">{{ $order->recipient_name ?? '—' }}</td>
                    <td class="py-2 pr-3 text-gray-400">৳{{ number_format($order->cod_amount ?? 0, 0) }}</td>
                    <td class="py-2 pr-3">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-medium
                            {{ $order->status === 'delivered' ? 'bg-green-900/50 text-green-400' :
                               ($order->status === 'cancelled' ? 'bg-red-900/50 text-red-400' : 'bg-gray-700 text-gray-400') }}">
                            {{ $order->status ?? 'pending' }}
                        </span>
                    </td>
                    <td class="py-2 text-gray-400">{{ $order->created_at->format('M j, Y') }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @endif
    </div>
</div>

<script>
function showTab(name) {
    document.querySelectorAll('.tab-panel').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('bg-violet-600', 'text-white');
        el.classList.add('text-gray-400');
    });
    document.getElementById('tab-' + name).classList.remove('hidden');
    const btn = document.getElementById('tab-btn-' + name);
    btn.classList.add('bg-violet-600', 'text-white');
    btn.classList.remove('text-gray-400');
}
</script>
@endsection
