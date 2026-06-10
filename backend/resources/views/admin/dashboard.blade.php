@extends('admin.layout')

@section('title', 'Dashboard Overview')
@section('page-title', 'Dashboard Overview')

@section('content')

{{-- Stats Cards --}}
<div class="grid grid-cols-4 gap-4 mb-6">
    <div class="card p-5 flex items-center gap-4">
        <div class="w-11 h-11 rounded-xl flex items-center justify-center" style="background:#1e2a45">
            <i class="fa-solid fa-dollar-sign text-blue-400 text-lg"></i>
        </div>
        <div>
            <p class="text-xs text-gray-400 mb-0.5">Total Sales</p>
            <p class="text-xl font-bold">৳ {{ number_format($totalSales, 0) }}</p>
            <p class="text-xs mt-0.5 {{ $salesChange >= 0 ? 'text-green-400' : 'text-red-400' }}">
                <i class="fa-solid fa-arrow-{{ $salesChange >= 0 ? 'up' : 'down' }}"></i>
                {{ abs($salesChange) }}% Than Last Month
            </p>
        </div>
    </div>

    <div class="card p-5 flex items-center gap-4">
        <div class="w-11 h-11 rounded-xl flex items-center justify-center" style="background:#1a3030">
            <i class="fa-solid fa-users text-teal-400 text-lg"></i>
        </div>
        <div>
            <p class="text-xs text-gray-400 mb-0.5">User Subscriptions</p>
            <p class="text-xl font-bold">{{ number_format($totalSubscriptions) }}</p>
            <p class="text-xs text-green-400 mt-0.5"><i class="fa-solid fa-arrow-up"></i> 8% Than Last Month</p>
        </div>
    </div>

    <div class="card p-5 flex items-center gap-4">
        <div class="w-11 h-11 rounded-xl flex items-center justify-center" style="background:#2a1a30">
            <i class="fa-solid fa-circle-question text-pink-400 text-lg"></i>
        </div>
        <div>
            <p class="text-xs text-gray-400 mb-0.5">Total AI Cost</p>
            <p class="text-xl font-bold">$ 0</p>
            <p class="text-xs text-green-400 mt-0.5"><i class="fa-solid fa-arrow-up"></i> 32% Than Last Month</p>
        </div>
    </div>

    <div class="card p-5 flex items-center gap-4">
        <div class="w-11 h-11 rounded-xl flex items-center justify-center" style="background:#2a2010">
            <i class="fa-solid fa-coins text-yellow-400 text-lg"></i>
        </div>
        <div>
            <p class="text-xs text-gray-400 mb-0.5">Total Users</p>
            <p class="text-xl font-bold">{{ number_format($totalUsers) }}</p>
            <p class="text-xs text-red-400 mt-0.5"><i class="fa-solid fa-arrow-down"></i> 3% Than Last Month</p>
        </div>
    </div>
</div>

{{-- Charts Row --}}
<div class="grid grid-cols-3 gap-4 mb-6">
    {{-- Bar Chart --}}
    <div class="card col-span-2 p-5">
        <div class="flex items-center justify-between mb-4">
            <p class="font-semibold">Sales & AI Usage</p>
            <select class="bg-gray-800 text-xs text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none">
                <option>6 Months</option>
                <option>3 Months</option>
                <option>1 Year</option>
            </select>
        </div>
        <canvas id="salesChart" height="110"></canvas>
        <div class="flex gap-5 mt-3 text-xs text-gray-400">
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-indigo-300 inline-block"></span>Sales Target</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-pink-500 inline-block"></span>Sales</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-violet-500 inline-block"></span>AI Cost</span>
        </div>
    </div>

    {{-- Donut Chart --}}
    <div class="card p-5">
        <p class="font-semibold mb-4">Subscription Plans</p>
        <canvas id="planChart" height="160"></canvas>
        <div class="mt-4 space-y-2 text-sm">
            @php $colors = ['#ec4899','#6366f1','#10b981']; @endphp
            @foreach($planStats as $i => $plan)
            <div class="flex items-center justify-between">
                <span class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full inline-block" style="background:{{ $colors[$i % count($colors)] }}"></span>
                    {{ $plan->name }}
                </span>
                <span class="text-gray-400">{{ $totalSubscriptions > 0 ? round(($plan->total / $totalSubscriptions) * 100) : 0 }}%</span>
            </div>
            @endforeach
            @if($planStats->isEmpty())
            <p class="text-gray-500 text-xs text-center">No subscription data yet</p>
            @endif
        </div>
    </div>
</div>

{{-- Bottom Row --}}
<div class="grid grid-cols-2 gap-4">
    {{-- Recent Subscriptions --}}
    <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
            <p class="font-semibold">Recent Subscriptions</p>
            <select class="bg-gray-800 text-xs text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none">
                <option>All Plans</option>
            </select>
        </div>
        <table class="w-full text-sm">
            <thead>
                <tr class="text-xs text-gray-500 uppercase border-b border-gray-700/40">
                    <th class="text-left pb-2">User</th>
                    <th class="text-left pb-2">Plan</th>
                    <th class="text-left pb-2">Date</th>
                    <th class="text-left pb-2">Status</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/30">
                @forelse($recentSubscriptions as $sub)
                <tr>
                    <td class="py-2.5 text-gray-300">{{ $sub->user->name ?? 'N/A' }}</td>
                    <td class="py-2.5 text-gray-300">{{ $sub->plan->name ?? 'N/A' }}</td>
                    <td class="py-2.5 text-gray-400">{{ $sub->created_at->format('M j, Y') }}</td>
                    <td class="py-2.5">
                        <span class="px-2 py-0.5 rounded-full text-xs font-medium badge-{{ $sub->status }}">
                            {{ ucfirst($sub->status) }}
                        </span>
                    </td>
                </tr>
                @empty
                <tr><td colspan="4" class="py-6 text-center text-gray-500 text-xs">No subscriptions yet</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{-- AI Cost Breakdown placeholder --}}
    <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
            <p class="font-semibold">AI Cost Breakdown</p>
            <select class="bg-gray-800 text-xs text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none">
                <option>This Month</option>
            </select>
        </div>
        <table class="w-full text-sm">
            <thead>
                <tr class="text-xs text-gray-500 uppercase border-b border-gray-700/40">
                    <th class="text-left pb-2">Service</th>
                    <th class="text-left pb-2">Requests</th>
                    <th class="text-left pb-2">Cost</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/30">
                <tr><td class="py-2.5 text-gray-300">Facebook Post AI</td><td class="py-2.5 text-gray-400">0</td><td class="py-2.5 text-gray-300">$ 0</td></tr>
                <tr><td class="py-2.5 text-gray-300">Claude (Text)</td><td class="py-2.5 text-gray-400">0</td><td class="py-2.5 text-gray-300">$ 0</td></tr>
                <tr><td class="py-2.5 text-gray-300">Image Generation</td><td class="py-2.5 text-gray-400">0</td><td class="py-2.5 text-gray-300">$ 0</td></tr>
            </tbody>
        </table>
    </div>
</div>

@endsection

@push('scripts')
<script>
const salesLabels = @json($monthlySales->pluck('month'));
const salesData   = @json($monthlySales->pluck('total'));

// Fill with dummy if empty
const labels = salesLabels.length ? salesLabels : ['Feb','Mar','Apr','May','Jun','Jul'];
const data   = salesData.length   ? salesData   : [0,0,0,0,0,0];

new Chart(document.getElementById('salesChart'), {
    type: 'bar',
    data: {
        labels,
        datasets: [
            { label: 'Sales Target', data: data.map(v => v * 1.2), backgroundColor: 'rgba(165,180,252,0.5)', borderRadius: 4 },
            { label: 'Sales',        data,                          backgroundColor: '#ec4899',               borderRadius: 4 },
            { label: 'AI Cost',      data: data.map(v => v * 0.3), backgroundColor: '#6366f1',               borderRadius: 4 },
        ]
    },
    options: { plugins: { legend: { display: false } }, scales: { x: { grid: { display:false }, ticks:{ color:'#6b7280' } }, y: { grid:{ color:'rgba(255,255,255,0.05)' }, ticks:{ color:'#6b7280' } } } }
});

const planLabels = @json($planStats->pluck('name'));
const planData   = @json($planStats->pluck('total'));

new Chart(document.getElementById('planChart'), {
    type: 'doughnut',
    data: {
        labels: planLabels.length ? planLabels : ['No Data'],
        datasets: [{ data: planData.length ? planData : [1], backgroundColor: ['#ec4899','#6366f1','#10b981'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: { cutout: '70%', plugins: { legend: { display: false } } }
});
</script>
@endpush
