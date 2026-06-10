@extends('admin.layout')
@section('title', 'SMS API Settings')
@section('page-title', 'SMS API Settings')

@section('content')
<div class="flex gap-6">

    {{-- Inner Sidebar --}}
    @include('admin.settings._sidebar')

    {{-- Main Content --}}
    <div class="flex-1 space-y-5">

        @if(session('success'))
            <div class="flex items-center gap-3 rounded-xl bg-green-900/40 border border-green-700/50 px-4 py-3 text-sm text-green-300">
                <i class="fa-solid fa-circle-check"></i> {{ session('success') }}
            </div>
        @endif

        <form method="POST" action="{{ route('admin.settings.sms-api.save') }}">
            @csrf

            {{-- SMS Provider --}}
            <div class="card p-5 mb-5">
                <h3 class="text-sm font-semibold text-white mb-1">Choose SMS API Provider</h3>
                <p class="text-xs text-gray-400 mb-4">Select the provider used to send SMS campaigns.</p>
                <div class="grid grid-cols-3 gap-3">
                    @php
                        $providers = [
                            ['id'=>'greenweb', 'name'=>'GreenWeb / BDBulkSMS', 'desc'=>"Bangladesh's leading bulk SMS gateway. BTRC compliant. Cost-effective.", 'cost'=>0.30],
                            ['id'=>'ssl',      'name'=>'SSL Wireless',          'desc'=>'Trusted BD SMS provider. Reliable delivery, BTRC compliant. 0.50 BDT/seg.', 'cost'=>0.50],
                            ['id'=>'twilio',   'name'=>'Twilio',                'desc'=>'Global SMS provider. International fallback. USD pricing.', 'cost'=>1.20],
                        ];
                        $selectedProvider = $settings['provider'] ?? 'greenweb';
                    @endphp

                    @foreach($providers as $p)
                    <label class="cursor-pointer">
                        <input type="radio" name="provider" value="{{ $p['id'] }}" class="sr-only peer"
                               {{ $selectedProvider === $p['id'] ? 'checked' : '' }}>
                        <div class="rounded-xl border-2 p-4 transition peer-checked:border-violet-500 peer-checked:bg-violet-500/10 border-gray-600 hover:border-violet-500/50">
                            <div class="flex items-start justify-between">
                                <p class="text-sm font-semibold text-white">{{ $p['name'] }}</p>
                                <i class="fa-solid fa-circle-check text-violet-400 hidden peer-checked:block"></i>
                            </div>
                            <p class="mt-1 text-xs text-gray-400">{{ $p['desc'] }}</p>
                        </div>
                    </label>
                    @endforeach
                </div>
            </div>

            {{-- AI Model --}}
            <div class="card p-5 mb-5">
                <h3 class="text-sm font-semibold text-white mb-1">SMS AI Content Model</h3>
                <p class="text-xs text-gray-400 mb-4">AI model used to generate SMS campaign content.</p>
                @php
                    $models = [
                        ['id'=>'claude-haiku-4-5',  'name'=>'Claude Haiku 4.5',  'badge'=>'Fastest', 'badge_color'=>'bg-green-900/50 text-green-400', 'desc'=>'Optimized for short, impactful SMS content generation. Most cost-effective for bulk campaigns.'],
                        ['id'=>'claude-sonnet-4-6', 'name'=>'Claude Sonnet 4.6', 'badge'=>'Quality', 'badge_color'=>'bg-violet-900/50 text-violet-400', 'desc'=>'Higher quality SMS content with better Bangla language support and tone accuracy.'],
                    ];
                    $selectedModel = $settings['ai_model'] ?? 'claude-haiku-4-5';
                @endphp
                <div class="space-y-3">
                    @foreach($models as $m)
                    <label class="cursor-pointer flex items-start gap-3 rounded-xl border-2 p-4 transition
                        {{ $selectedModel === $m['id'] ? 'border-violet-500 bg-violet-500/10' : 'border-gray-600 hover:border-violet-500/50' }}">
                        <input type="radio" name="ai_model" value="{{ $m['id'] }}" class="mt-1 accent-violet-500"
                               {{ $selectedModel === $m['id'] ? 'checked' : '' }}>
                        <div class="flex-1">
                            <div class="flex items-center gap-2">
                                <span class="text-sm font-semibold text-white">{{ $m['name'] }}</span>
                                <span class="rounded-full px-2 py-0.5 text-[11px] font-medium {{ $m['badge_color'] }}">{{ $m['badge'] }}</span>
                            </div>
                            <p class="mt-0.5 text-xs text-gray-400">{{ $m['desc'] }}</p>
                        </div>
                    </label>
                    @endforeach
                </div>
            </div>

            {{-- API Credentials --}}
            <div class="card p-5">
                <h3 class="text-sm font-semibold text-white mb-1">API Credentials</h3>
                <p class="text-xs text-gray-400 mb-4">Enter your SMS provider API credentials.</p>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-medium text-gray-300 mb-1.5">API Key / Token</label>
                        <input type="password" name="api_key" value="{{ $settings['api_key'] ?? '' }}"
                               placeholder="Enter your API key"
                               class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"/>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-300 mb-1.5">Sender ID</label>
                        <input type="text" name="sender_id" value="{{ $settings['sender_id'] ?? '' }}"
                               placeholder="e.g. FcommerceBD"
                               class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"/>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-300 mb-1.5">Cost Per Segment (BDT)</label>
                        <input type="number" step="0.01" name="cost_per_seg" value="{{ $settings['cost_per_seg'] ?? '0.30' }}"
                               class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"/>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-300 mb-1.5">Chars Per Segment</label>
                        <input type="number" name="chars_per_seg" value="{{ $settings['chars_per_seg'] ?? '160' }}"
                               class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"/>
                    </div>
                </div>
                <div class="mt-5 pt-4 border-t border-gray-700/50">
                    <button type="submit"
                            class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition">
                        <i class="fa-solid fa-floppy-disk"></i> Save SMS API Settings
                    </button>
                </div>
            </div>

        </form>
    </div>
</div>
@endsection
