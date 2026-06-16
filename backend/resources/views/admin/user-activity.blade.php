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
    <div class="ml-auto">
        <button onclick="document.getElementById('sms-modal').classList.remove('hidden')"
                class="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            <i class="fa-solid fa-comment-sms text-xs"></i> Send SMS
        </button>
    </div>
</div>

{{-- SMS Modal --}}
<div id="sms-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div class="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div class="flex items-center justify-between mb-5">
            <h3 class="text-white font-semibold text-base flex items-center gap-2">
                <i class="fa-solid fa-comment-sms text-green-400"></i> Send SMS to {{ $user->name }}
            </h3>
            <button onclick="document.getElementById('sms-modal').classList.add('hidden')"
                    class="text-gray-500 hover:text-white transition text-lg leading-none">&times;</button>
        </div>
        @if($user->phone)
        <p class="text-xs text-gray-400 mb-4">Recipient: <span class="text-white font-mono">{{ $user->phone }}</span></p>
        @else
        <p class="text-xs text-red-400 mb-4"><i class="fa-solid fa-triangle-exclamation mr-1"></i>This user has no phone number on file. SMS cannot be delivered.</p>
        @endif
        <form method="POST" action="{{ route('admin.users.send-sms', $user) }}">
            @csrf
            <div class="mb-4">
                <label class="block text-xs font-medium text-gray-300 mb-1.5">Message</label>
                <textarea name="message" rows="4" maxlength="1600" required
                          placeholder="Type your message here…"
                          class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-green-500 resize-none"></textarea>
                <p class="text-[11px] text-gray-500 mt-1">Max 1600 characters (multi-part SMS).</p>
            </div>
            <div class="flex gap-3">
                <button type="submit"
                        class="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                    <i class="fa-solid fa-paper-plane text-xs"></i> Send
                </button>
                <button type="button" onclick="document.getElementById('sms-modal').classList.add('hidden')"
                        class="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-700 transition">
                    Cancel
                </button>
            </div>
        </form>
    </div>
</div>

@if(session('success'))
    <div class="flex items-center gap-3 rounded-xl bg-green-900/40 border border-green-700/50 px-4 py-3 mb-6 text-sm text-green-300">
        <i class="fa-solid fa-circle-check"></i> {{ session('success') }}
    </div>
@endif

@if(session('sms_result'))
    @php $smsMsg = session('sms_result'); $smsOk = str_starts_with($smsMsg, 'ok:'); $smsTxt = ltrim(substr($smsMsg, strpos($smsMsg, ':') + 1)); @endphp
    <div class="flex items-center gap-3 rounded-xl px-4 py-3 mb-6 text-sm
        {{ $smsOk ? 'bg-green-900/40 border border-green-700/50 text-green-300' : 'bg-red-900/40 border border-red-700/50 text-red-300' }}">
        <i class="fa-solid {{ $smsOk ? 'fa-circle-check' : 'fa-circle-exclamation' }}"></i> {{ $smsTxt }}
    </div>
@endif

{{-- ── Post Limit (Facebook / AI posts) ────────────────────────────────── --}}
@php
    $fbOverridden = $user->fb_posts_limit_override !== null;
@endphp
<div class="card p-5 mb-6">
    <div class="flex items-start justify-between flex-wrap gap-4">
        <div>
            <h3 class="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <i class="fa-solid fa-wand-magic-sparkles text-violet-400"></i> Facebook / AI Post Limit
            </h3>
            <p class="text-xs text-gray-400">
                This period the user has used
                <span class="text-white font-semibold">{{ $fbQuota['used'] }}</span>
                of <span class="text-white font-semibold">{{ $fbQuota['limit'] }}</span> posts
                (<span class="{{ $fbQuota['remaining'] > 0 ? 'text-green-400' : 'text-red-400' }}">{{ $fbQuota['remaining'] }} remaining</span>).
                Resets {{ \Illuminate\Support\Carbon::parse($fbQuota['resetsAt'])->format('M j, Y') }}.
            </p>
            <p class="text-xs mt-1">
                @if($fbOverridden)
                    <span class="px-2 py-0.5 rounded-full bg-violet-900/50 text-violet-300 text-[11px] font-medium">
                        <i class="fa-solid fa-user-pen mr-1"></i>Custom limit: {{ $user->fb_posts_limit_override }}
                    </span>
                @else
                    <span class="text-gray-500">Using plan default limit.</span>
                @endif
                @if($user->fb_posts_reset_at)
                    <span class="text-gray-500 ml-2">Last reset {{ $user->fb_posts_reset_at->diffForHumans() }}.</span>
                @endif
            </p>
        </div>
    </div>

    <div class="mt-4 pt-4 border-t border-gray-700/40 flex flex-wrap items-end gap-3">
        {{-- Set / change / clear the per-user limit --}}
        <form method="POST" action="{{ route('admin.users.quota.update', $user) }}" class="flex items-end gap-2">
            @csrf
            <div>
                <label class="block text-xs font-medium text-gray-300 mb-1.5">Custom post limit</label>
                <input type="number" name="fb_posts_limit_override" min="0" max="100000"
                       value="{{ $user->fb_posts_limit_override }}"
                       placeholder="Plan default"
                       class="w-40 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"/>
            </div>
            <button type="submit"
                    class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                <i class="fa-solid fa-floppy-disk text-xs"></i> Save limit
            </button>
            <p class="text-[11px] text-gray-500 pb-2.5">Leave blank to revert to plan default.</p>
        </form>

        {{-- Reset usage to zero for this period --}}
        <form method="POST" action="{{ route('admin.users.quota.reset', $user) }}"
              onsubmit="return confirm('Reset {{ addslashes($user->name) }}\'s post usage to 0 for this period? Their post history is kept.');"
              class="ml-auto">
            @csrf
            <button type="submit"
                    class="inline-flex items-center gap-2 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 text-sm font-medium px-4 py-2 rounded-lg transition border border-amber-500/30">
                <i class="fa-solid fa-rotate-left text-xs"></i> Reset usage to 0
            </button>
        </form>
    </div>
</div>

{{-- ── Plan / Subscription ─────────────────────────────────────────────── --}}
<div class="card p-5 mb-6">
    <h3 class="text-sm font-semibold text-white mb-1 flex items-center gap-2">
        <i class="fa-solid fa-id-card text-violet-400"></i> Plan & Subscription
    </h3>
    @if($activeSubscription)
        <p class="text-xs text-gray-400">
            Currently on
            <span class="px-2 py-0.5 rounded-full text-[11px] font-medium badge-{{ $activeSubscription->status }}">
                {{ $activeSubscription->plan->name ?? 'N/A' }}
                @if($activeSubscription->isTrial()) (Trial) @endif
            </span>
            — expires {{ \Illuminate\Support\Carbon::parse($activeSubscription->expiry_date)->format('M j, Y') }}
            ({{ \Illuminate\Support\Carbon::parse($activeSubscription->expiry_date)->diffForHumans() }}).
        </p>
    @else
        <p class="text-xs text-red-400">
            <i class="fa-solid fa-lock mr-1"></i>No active plan — all features (AI, SMS, Facebook, courier) are locked for this user.
        </p>
    @endif

    <form method="POST" action="{{ route('admin.users.plan.assign', $user) }}"
          class="mt-4 pt-4 border-t border-gray-700/40 flex flex-wrap items-end gap-3">
        @csrf
        <div>
            <label class="block text-xs font-medium text-gray-300 mb-1.5">Plan</label>
            <select name="plan_id"
                    class="w-44 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500">
                @foreach($plans as $p)
                    <option value="{{ $p->id }}" {{ optional($activeSubscription)->plan_id === $p->id ? 'selected' : '' }}>
                        {{ $p->name }} — ৳{{ number_format($p->price, 0) }}
                    </option>
                @endforeach
            </select>
        </div>
        <div>
            <label class="block text-xs font-medium text-gray-300 mb-1.5">Duration (days)</label>
            <input type="number" name="duration_days" min="1" max="3650" value="30"
                   class="w-28 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"/>
        </div>
        <button type="submit"
                onclick="return confirm('Activate this plan for {{ addslashes($user->name) }}? It replaces their current subscription.');"
                class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            <i class="fa-solid fa-circle-check text-xs"></i> Activate plan
        </button>
        <p class="text-[11px] text-gray-500 pb-2.5">Use to upgrade a customer or restore access after expiry.</p>
    </form>
</div>

{{-- ── AI Generation Limit ─────────────────────────────────────────────── --}}
@php
    $aiOverridden = $user->ai_generations_limit_override !== null;
@endphp
<div class="card p-5 mb-6">
    <div class="flex items-start justify-between flex-wrap gap-4">
        <div>
            <h3 class="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <i class="fa-solid fa-robot text-violet-400"></i> AI Generation Limit
            </h3>
            <p class="text-xs text-gray-400">
                This period the user has generated
                <span class="text-white font-semibold">{{ $aiQuota['used'] }}</span>
                of <span class="text-white font-semibold">{{ $aiQuota['limit'] }}</span> AI captions
                (<span class="{{ $aiQuota['remaining'] > 0 ? 'text-green-400' : 'text-red-400' }}">{{ $aiQuota['remaining'] }} remaining</span>).
                Resets {{ \Illuminate\Support\Carbon::parse($aiQuota['resetsAt'])->format('M j, Y') }}.
            </p>
            <p class="text-xs mt-1">
                @if($aiOverridden)
                    <span class="px-2 py-0.5 rounded-full bg-violet-900/50 text-violet-300 text-[11px] font-medium">
                        <i class="fa-solid fa-user-pen mr-1"></i>Custom limit: {{ $user->ai_generations_limit_override }}
                    </span>
                @else
                    <span class="text-gray-500">Using plan default limit.</span>
                @endif
                @if($user->ai_generations_reset_at)
                    <span class="text-gray-500 ml-2">Last reset {{ $user->ai_generations_reset_at->diffForHumans() }}.</span>
                @endif
            </p>
        </div>
    </div>

    <div class="mt-4 pt-4 border-t border-gray-700/40 flex flex-wrap items-end gap-3">
        <form method="POST" action="{{ route('admin.users.ai-quota.update', $user) }}" class="flex items-end gap-2">
            @csrf
            <div>
                <label class="block text-xs font-medium text-gray-300 mb-1.5">Custom generation limit</label>
                <input type="number" name="ai_generations_limit_override" min="0" max="100000"
                       value="{{ $user->ai_generations_limit_override }}"
                       placeholder="Plan default"
                       class="w-40 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"/>
            </div>
            <button type="submit"
                    class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                <i class="fa-solid fa-floppy-disk text-xs"></i> Save limit
            </button>
            <p class="text-[11px] text-gray-500 pb-2.5">Leave blank to revert to plan default.</p>
        </form>

        <form method="POST" action="{{ route('admin.users.ai-quota.reset', $user) }}"
              onsubmit="return confirm('Reset {{ addslashes($user->name) }}\'s AI generation usage to 0 for this period?');"
              class="ml-auto">
            @csrf
            <button type="submit"
                    class="inline-flex items-center gap-2 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 text-sm font-medium px-4 py-2 rounded-lg transition border border-amber-500/30">
                <i class="fa-solid fa-rotate-left text-xs"></i> Reset usage to 0
            </button>
        </form>
    </div>
</div>

{{-- ── SMS Limit ───────────────────────────────────────────────────────── --}}
<div class="card p-5 mb-6">
    <div class="flex items-start justify-between flex-wrap gap-4">
        <div>
            <h3 class="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <i class="fa-solid fa-comment-sms text-green-400"></i> SMS Limit
            </h3>
            @if($smsQuota['hasBalance'])
                <p class="text-xs text-gray-400">
                    This period the user has sent
                    <span class="text-white font-semibold">{{ $smsQuota['used'] }}</span>
                    of <span class="text-white font-semibold">{{ $smsQuota['limit'] }}</span> SMS
                    (<span class="{{ $smsQuota['remaining'] > 0 ? 'text-green-400' : 'text-red-400' }}">{{ $smsQuota['remaining'] }} remaining</span>).
                </p>
            @else
                <p class="text-xs text-red-400"><i class="fa-solid fa-lock mr-1"></i>No active SMS balance — assign a plan to provision one.</p>
            @endif
        </div>
    </div>

    @if($smsQuota['hasBalance'])
    <div class="mt-4 pt-4 border-t border-gray-700/40 flex flex-wrap items-end gap-3">
        <form method="POST" action="{{ route('admin.users.sms-quota.update', $user) }}" class="flex items-end gap-2">
            @csrf
            <div>
                <label class="block text-xs font-medium text-gray-300 mb-1.5">SMS allowance this period</label>
                <input type="number" name="total_sms" min="0" max="1000000"
                       value="{{ $smsQuota['limit'] }}"
                       class="w-40 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"/>
            </div>
            <button type="submit"
                    class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                <i class="fa-solid fa-floppy-disk text-xs"></i> Save limit
            </button>
        </form>

        <form method="POST" action="{{ route('admin.users.sms-quota.reset', $user) }}"
              onsubmit="return confirm('Reset {{ addslashes($user->name) }}\'s SMS usage to 0 for this period?');"
              class="ml-auto">
            @csrf
            <button type="submit"
                    class="inline-flex items-center gap-2 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 text-sm font-medium px-4 py-2 rounded-lg transition border border-amber-500/30">
                <i class="fa-solid fa-rotate-left text-xs"></i> Reset usage to 0
            </button>
        </form>
    </div>
    @endif
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

    {{-- AI Generations --}}
    <div class="card p-4">
        <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <i class="fa-solid fa-wand-magic-sparkles text-violet-400 text-xs"></i>
            </div>
            <p class="text-xs text-gray-400 font-medium">AI Captions</p>
        </div>
        <p class="text-2xl font-bold text-white">{{ $stats['ai_generations_total'] }}</p>
        <p class="text-xs text-gray-500 mt-1">{{ $stats['ai_posts_published'] }} FB published</p>
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
