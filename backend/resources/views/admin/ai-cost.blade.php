@extends('admin.layout')

@section('title', 'Total AI Cost')
@section('page-title', 'Total AI Cost')

@section('content')

{{-- ── Stats Cards ─────────────────────────────────────────────────────────── --}}
<div class="grid grid-cols-4 gap-4 mb-6">
    <div class="card p-5 flex items-center gap-4">
        <div class="w-11 h-11 rounded-xl flex items-center justify-center" style="background:#1a1a3a">
            <i class="fa-solid fa-robot text-violet-400 text-lg"></i>
        </div>
        <div>
            <p class="text-xs text-gray-400 mb-0.5">AI Generations</p>
            <p class="text-xl font-bold">{{ number_format($totalAiGenerations) }}</p>
            <p class="text-xs text-gray-500 mt-0.5">Total caption requests</p>
        </div>
    </div>

    <div class="card p-5 flex items-center gap-4">
        <div class="w-11 h-11 rounded-xl flex items-center justify-center" style="background:#1a3a1a">
            <i class="fa-solid fa-comment-sms text-green-400 text-lg"></i>
        </div>
        <div>
            <p class="text-xs text-gray-400 mb-0.5">SMS Sent</p>
            <p class="text-xl font-bold">{{ number_format($totalSmsSent) }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ number_format($totalSmsFailed) }} failed</p>
        </div>
    </div>

    <div class="card p-5 flex items-center gap-4">
        <div class="w-11 h-11 rounded-xl flex items-center justify-center" style="background:#1a2a3a">
            <i class="fa-brands fa-facebook text-blue-400 text-lg"></i>
        </div>
        <div>
            <p class="text-xs text-gray-400 mb-0.5">FB Posts</p>
            <p class="text-xl font-bold">{{ number_format($totalFbPosts) }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ number_format($publishedFbPosts) }} published</p>
        </div>
    </div>

    <div class="card p-5 flex items-center gap-4">
        <div class="w-11 h-11 rounded-xl flex items-center justify-center" style="background:#3a1a1a">
            <i class="fa-solid fa-triangle-exclamation text-red-400 text-lg"></i>
        </div>
        <div>
            <p class="text-xs text-gray-400 mb-0.5">Failed Posts</p>
            <p class="text-xl font-bold">{{ number_format($failedFbPosts) }}</p>
            <p class="text-xs text-gray-500 mt-0.5">FB post errors</p>
        </div>
    </div>
</div>

{{-- ── Monthly Trend Chart (3 cols) + AI Provider Donut (1 col) ────────────── --}}
<div class="grid grid-cols-4 gap-4 mb-6">
    <div class="card col-span-3 p-5">
        <div class="flex items-center justify-between mb-4">
            <p class="font-semibold">Monthly Activity — Last 6 Months</p>
            <div class="flex items-center gap-4 text-xs text-gray-400">
                <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-violet-500 inline-block"></span>AI Generations</span>
                <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-green-500 inline-block"></span>SMS Sent</span>
                <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>FB Posts</span>
            </div>
        </div>
        <canvas id="trendChart" height="110"></canvas>
    </div>

    <div class="card p-5">
        <p class="font-semibold mb-4">AI by Provider</p>
        <canvas id="providerChart" height="150"></canvas>
        <div class="mt-4 space-y-2 text-sm">
            @php $pColors = ['#8b5cf6','#ec4899','#10b981','#f59e0b','#3b82f6']; @endphp
            @forelse($aiByProvider as $i => $row)
            <div class="flex items-center justify-between">
                <span class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full inline-block" style="background:{{ $pColors[$i % count($pColors)] }}"></span>
                    <span class="text-gray-300">{{ $row->provider ?? 'Unknown' }}</span>
                </span>
                <span class="text-gray-400">{{ number_format($row->total) }}</span>
            </div>
            @empty
            <p class="text-gray-500 text-xs text-center">No data yet</p>
            @endforelse
        </div>
    </div>
</div>

{{-- ── SMS Breakdown + FB Post Status ──────────────────────────────────────── --}}
<div class="grid grid-cols-3 gap-4 mb-6">

    {{-- SMS donut --}}
    <div class="card p-5">
        <p class="font-semibold mb-4">SMS Breakdown</p>
        <canvas id="smsChart" height="150"></canvas>
        <div class="mt-4 space-y-2 text-sm">
            <div class="flex items-center justify-between">
                <span class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full inline-block bg-green-500"></span>
                    <span class="text-gray-300">Sent</span>
                </span>
                <span class="text-gray-400">{{ number_format($totalSmsSent) }}</span>
            </div>
            <div class="flex items-center justify-between">
                <span class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full inline-block bg-red-500"></span>
                    <span class="text-gray-300">Failed</span>
                </span>
                <span class="text-gray-400">{{ number_format($totalSmsFailed) }}</span>
            </div>
            <div class="flex items-center justify-between">
                <span class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full inline-block bg-gray-500"></span>
                    <span class="text-gray-300">Mock / Log</span>
                </span>
                <span class="text-gray-400">{{ number_format($totalSmsMock) }}</span>
            </div>
        </div>
    </div>

    {{-- FB Post status donut --}}
    <div class="card p-5">
        <p class="font-semibold mb-4">FB Post Status</p>
        <canvas id="fbChart" height="150"></canvas>
        <div class="mt-4 space-y-2 text-sm">
            <div class="flex items-center justify-between">
                <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-blue-500 inline-block"></span><span class="text-gray-300">Published</span></span>
                <span class="text-gray-400">{{ number_format($publishedFbPosts) }}</span>
            </div>
            <div class="flex items-center justify-between">
                <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-red-500 inline-block"></span><span class="text-gray-300">Failed</span></span>
                <span class="text-gray-400">{{ number_format($failedFbPosts) }}</span>
            </div>
            <div class="flex items-center justify-between">
                <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-gray-500 inline-block"></span><span class="text-gray-300">Other</span></span>
                <span class="text-gray-400">{{ number_format(max(0, $totalFbPosts - $publishedFbPosts - $failedFbPosts)) }}</span>
            </div>
        </div>
    </div>

    {{-- Usage summary --}}
    <div class="card p-5">
        <p class="font-semibold mb-4">Usage Summary</p>
        <div class="space-y-4">
            <div>
                <div class="flex justify-between text-sm mb-1">
                    <span class="text-gray-400">AI Generations</span>
                    <span class="text-gray-300">{{ number_format($totalAiGenerations) }} requests</span>
                </div>
                @php $aiTotal = max($totalAiGenerations, 1); $aiPct = min(100, round(($totalAiGenerations / max($aiTotal, 1)) * 100)); @endphp
                <div class="w-full bg-gray-700 rounded-full h-2">
                    <div class="bg-violet-500 h-2 rounded-full" style="width:100%"></div>
                </div>
            </div>
            <div>
                <div class="flex justify-between text-sm mb-1">
                    <span class="text-gray-400">SMS Delivery Rate</span>
                    @php $smsTotal = $totalSmsSent + $totalSmsFailed; $smsPct = $smsTotal > 0 ? round(($totalSmsSent / $smsTotal) * 100) : 0; @endphp
                    <span class="text-gray-300">{{ $smsPct }}%</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                    <div class="bg-green-500 h-2 rounded-full" style="width:{{ $smsPct }}%"></div>
                </div>
            </div>
            <div>
                <div class="flex justify-between text-sm mb-1">
                    <span class="text-gray-400">FB Post Success Rate</span>
                    @php $fbPct = $totalFbPosts > 0 ? round(($publishedFbPosts / $totalFbPosts) * 100) : 0; @endphp
                    <span class="text-gray-300">{{ $fbPct }}%</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                    <div class="bg-blue-500 h-2 rounded-full" style="width:{{ $fbPct }}%"></div>
                </div>
            </div>
            <div>
                <div class="flex justify-between text-sm mb-1">
                    <span class="text-gray-400">SMS Failure Rate</span>
                    @php $failPct = $smsTotal > 0 ? round(($totalSmsFailed / $smsTotal) * 100) : 0; @endphp
                    <span class="text-gray-300">{{ $failPct }}%</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                    <div class="bg-red-500 h-2 rounded-full" style="width:{{ $failPct }}%"></div>
                </div>
            </div>
        </div>
    </div>
</div>

{{-- ── Recent AI Generations Table ──────────────────────────────────────────── --}}
<div class="card p-5">
    <p class="font-semibold mb-4">Recent AI Generations</p>
    <table class="w-full text-sm">
        <thead>
            <tr class="text-xs text-gray-500 uppercase border-b border-gray-700/40">
                <th class="text-left pb-3">#</th>
                <th class="text-left pb-3">User</th>
                <th class="text-left pb-3">Provider</th>
                <th class="text-left pb-3">Language</th>
                <th class="text-left pb-3">Tone</th>
                <th class="text-left pb-3">Date</th>
            </tr>
        </thead>
        <tbody class="divide-y divide-gray-700/30">
            @forelse($recentAi as $gen)
            <tr>
                <td class="py-2.5 text-gray-500">{{ $gen->id }}</td>
                <td class="py-2.5 text-gray-300">{{ $gen->user->name ?? 'N/A' }}</td>
                <td class="py-2.5">
                    <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-900/40 text-violet-300">
                        {{ $gen->provider ?? 'unknown' }}
                    </span>
                </td>
                <td class="py-2.5 text-gray-400">{{ $gen->language ?? '—' }}</td>
                <td class="py-2.5 text-gray-400">{{ $gen->tone ?? '—' }}</td>
                <td class="py-2.5 text-gray-400">{{ $gen->created_at->format('M j, Y H:i') }}</td>
            </tr>
            @empty
            <tr><td colspan="6" class="py-8 text-center text-gray-500">No AI generations yet</td></tr>
            @endforelse
        </tbody>
    </table>
</div>

@endsection

@push('scripts')
<script>
// ── Shared month labels (merge all three month series) ───────────────────────
const aiMonths  = @json($monthlyAi->pluck('sort_key'));
const smsMonths = @json($monthlySms->pluck('sort_key'));
const fbMonths  = @json($monthlyFb->pluck('sort_key'));

const allKeys = [...new Set([...aiMonths, ...smsMonths, ...fbMonths])].sort();
const allLabels = allKeys.map(k => {
    const d = new Date(k + '-01');
    return d.toLocaleString('en', { month: 'short', year: 'numeric' });
});

function mapToKeys(rows, keys) {
    const map = {};
    @json($monthlyAi).forEach(r => {});  // dummy, see below
    rows.forEach(r => map[r.sort_key] = r.total);
    return keys.map(k => map[k] ?? 0);
}

const aiMap  = {}; @json($monthlyAi).forEach(r  => aiMap[r.sort_key]  = r.total);
const smsMap = {}; @json($monthlySms).forEach(r => smsMap[r.sort_key] = r.total);
const fbMap  = {}; @json($monthlyFb).forEach(r  => fbMap[r.sort_key]  = r.total);

const aiData  = allKeys.map(k => aiMap[k]  ?? 0);
const smsData = allKeys.map(k => smsMap[k] ?? 0);
const fbData  = allKeys.map(k => fbMap[k]  ?? 0);

// ── Trend chart ──────────────────────────────────────────────────────────────
new Chart(document.getElementById('trendChart'), {
    type: 'bar',
    data: {
        labels: allLabels.length ? allLabels : ['No data'],
        datasets: [
            { label: 'AI Generations', data: aiData,  backgroundColor: '#8b5cf6', borderRadius: 4 },
            { label: 'SMS Sent',       data: smsData, backgroundColor: '#10b981', borderRadius: 4 },
            { label: 'FB Posts',       data: fbData,  backgroundColor: '#3b82f6', borderRadius: 4 },
        ]
    },
    options: {
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#6b7280' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b7280', precision: 0 } }
        }
    }
});

// ── AI provider donut ────────────────────────────────────────────────────────
const providerLabels = @json($aiByProvider->pluck('provider')->map(fn($p) => $p ?? 'Unknown'));
const providerData   = @json($aiByProvider->pluck('total'));

new Chart(document.getElementById('providerChart'), {
    type: 'doughnut',
    data: {
        labels: providerLabels.length ? providerLabels : ['No data'],
        datasets: [{ data: providerData.length ? providerData : [1], backgroundColor: ['#8b5cf6','#ec4899','#10b981','#f59e0b','#3b82f6'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: { cutout: '70%', plugins: { legend: { display: false } } }
});

// ── SMS donut ────────────────────────────────────────────────────────────────
new Chart(document.getElementById('smsChart'), {
    type: 'doughnut',
    data: {
        labels: ['Sent', 'Failed', 'Mock'],
        datasets: [{ data: [{{ $totalSmsSent }}, {{ $totalSmsFailed }}, {{ $totalSmsMock }}], backgroundColor: ['#10b981','#ef4444','#6b7280'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: { cutout: '70%', plugins: { legend: { display: false } } }
});

// ── FB post donut ────────────────────────────────────────────────────────────
const fbOther = Math.max(0, {{ $totalFbPosts }} - {{ $publishedFbPosts }} - {{ $failedFbPosts }});
new Chart(document.getElementById('fbChart'), {
    type: 'doughnut',
    data: {
        labels: ['Published', 'Failed', 'Other'],
        datasets: [{ data: [{{ $publishedFbPosts }}, {{ $failedFbPosts }}, fbOther], backgroundColor: ['#3b82f6','#ef4444','#6b7280'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: { cutout: '70%', plugins: { legend: { display: false } } }
});
</script>
@endpush
