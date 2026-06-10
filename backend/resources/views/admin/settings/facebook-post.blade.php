@extends('admin.layout')
@section('title', 'Facebook Post Settings')
@section('page-title', 'Facebook Post Settings')

@section('content')
<div class="flex gap-6">

    @include('admin.settings._sidebar')

    <div class="flex-1 space-y-5">

        @if(session('success'))
            <div class="flex items-center gap-3 rounded-xl bg-green-900/40 border border-green-700/50 px-4 py-3 text-sm text-green-300">
                <i class="fa-solid fa-circle-check"></i> {{ session('success') }}
            </div>
        @endif

        <form method="POST" action="{{ route('admin.settings.facebook-post.save') }}">
            @csrf

            {{-- ── AI Provider & Key ──────────────────────────────────────── --}}
            <div class="card p-5 mb-5">
                <h3 class="text-sm font-semibold text-white mb-1">AI Provider</h3>
                <p class="text-xs text-gray-400 mb-4">
                    Select the LLM provider and paste the API key. All your users will generate
                    posts through this key — they never see it.
                </p>

                @php
                    $selectedProvider = $settings['provider'] ?? 'stub';
                    $providers = [
                        'deepseek'  => ['label' => 'DeepSeek',          'badge' => 'Cheap & Fast', 'badge_color' => 'bg-blue-900/50 text-blue-400',   'placeholder' => 'sk-...', 'hint' => 'platform.deepseek.com → API Keys'],
                        'anthropic' => ['label' => 'Anthropic (Claude)', 'badge' => 'High Quality', 'badge_color' => 'bg-violet-900/50 text-violet-400','placeholder' => 'sk-ant-api03-...', 'hint' => 'console.anthropic.com → API Keys'],
                        'openai'    => ['label' => 'OpenAI',             'badge' => 'GPT',          'badge_color' => 'bg-green-900/50 text-green-400',  'placeholder' => 'sk-...', 'hint' => 'platform.openai.com → API Keys'],
                        'stub'      => ['label' => 'Stub (No AI)',       'badge' => 'Dev Only',     'badge_color' => 'bg-gray-700 text-gray-400',        'placeholder' => '', 'hint' => 'Uses a template — no real AI, no API key needed.'],
                    ];
                @endphp

                <div class="space-y-2 mb-5" id="provider-list">
                    @foreach($providers as $pid => $p)
                    <label class="cursor-pointer flex items-center gap-3 rounded-xl border-2 p-3.5 transition provider-option
                        {{ $selectedProvider === $pid ? 'border-violet-500 bg-violet-500/10' : 'border-gray-600 hover:border-violet-500/50' }}">
                        <input type="radio" name="provider" value="{{ $pid }}" class="accent-violet-500"
                               {{ $selectedProvider === $pid ? 'checked' : '' }}>
                        <div class="flex-1 flex items-center justify-between">
                            <span class="text-sm font-medium text-white">{{ $p['label'] }}</span>
                            <span class="rounded-full px-2 py-0.5 text-[11px] font-medium {{ $p['badge_color'] }}">{{ $p['badge'] }}</span>
                        </div>
                    </label>
                    @endforeach
                </div>

                {{-- API Key (hidden for stub) --}}
                <div id="api-key-wrap" class="{{ $selectedProvider === 'stub' ? 'hidden' : '' }}">
                    <label class="block text-xs font-medium text-gray-300 mb-1.5">
                        API Key <span class="text-red-400">*</span>
                    </label>
                    <input type="password" name="api_key" id="api-key-input"
                           value=""
                           placeholder="{{ $providers[$selectedProvider]['placeholder'] ?? 'sk-...' }}"
                           autocomplete="new-password"
                           class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 font-mono focus:outline-none focus:border-violet-500"/>
                    @php $hasKey = !empty($settings['api_key']); @endphp
                    <p class="mt-1 text-xs {{ $hasKey ? 'text-green-400' : 'text-gray-500' }}" id="api-key-hint">
                        @if($hasKey)
                            <i class="fa-solid fa-circle-check mr-1"></i>Key saved — leave blank to keep existing key.
                        @else
                            <span id="provider-hint-text">{{ $providers[$selectedProvider]['hint'] ?? '' }}</span>
                        @endif
                    </p>
                </div>
            </div>

            {{-- ── AI Model ───────────────────────────────────────────────── --}}
            <div class="card p-5 mb-5" id="model-card">
                <h3 class="text-sm font-semibold text-white mb-1">AI Model</h3>
                <p class="text-xs text-gray-400 mb-4">Choose which model generates the Facebook captions.</p>

                @php
                    $modelsByProvider = [
                        'deepseek'  => [
                            ['id'=>'deepseek-chat',     'name'=>'DeepSeek Chat (V3)',    'badge'=>'Best Value',  'badge_color'=>'bg-blue-900/50 text-blue-400',   'desc'=>'Fast, cost-effective, great Bangla support. Best for high-volume posting.'],
                            ['id'=>'deepseek-reasoner', 'name'=>'DeepSeek Reasoner (R1)','badge'=>'Powerful',   'badge_color'=>'bg-violet-900/50 text-violet-400','desc'=>'Slower but better reasoning. Good for complex promotional copy.'],
                        ],
                        'anthropic' => [
                            ['id'=>'claude-haiku-4-5',  'name'=>'Claude Haiku 4.5',  'badge'=>'Fastest', 'badge_color'=>'bg-green-900/50 text-green-400',  'desc'=>'Quick and cost-effective for high-volume posting.'],
                            ['id'=>'claude-sonnet-4-6', 'name'=>'Claude Sonnet 4.6', 'badge'=>'Quality', 'badge_color'=>'bg-violet-900/50 text-violet-400','desc'=>'Higher quality with better Bangla and tone control.'],
                        ],
                        'openai' => [
                            ['id'=>'gpt-4o-mini', 'name'=>'GPT-4o Mini', 'badge'=>'Fast',    'badge_color'=>'bg-green-900/50 text-green-400',  'desc'=>'Affordable and capable for most use cases.'],
                            ['id'=>'gpt-4o',      'name'=>'GPT-4o',      'badge'=>'Quality', 'badge_color'=>'bg-violet-900/50 text-violet-400','desc'=>'Best quality for nuanced captions.'],
                        ],
                        'stub' => [],
                    ];
                    $selectedModel = $settings['ai_model'] ?? '';
                @endphp

                @foreach($modelsByProvider as $pid => $models)
                <div class="space-y-3 model-group {{ $selectedProvider === $pid ? '' : 'hidden' }}" data-provider="{{ $pid }}">
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
                    @if(count($models) === 0)
                    <p class="text-xs text-gray-500 py-2">No model selection needed for Stub mode.</p>
                    <input type="hidden" name="ai_model" value="stub">
                    @endif
                </div>
                @endforeach
            </div>

            {{-- ── Post Defaults ─────────────────────────────────────────── --}}
            <div class="card p-5">
                <h3 class="text-sm font-semibold text-white mb-1">Post Defaults</h3>
                <p class="text-xs text-gray-400 mb-4">Default tone and posting behaviour for all users.</p>

                <div class="mb-4">
                    <p class="text-xs font-medium text-gray-300 mb-2">Default Tone</p>
                    @php
                        $tones = ['friendly'=>'Friendly','professional'=>'Professional','promo'=>'Promotional','festive'=>'Festive'];
                        $selectedTone = $settings['default_tone'] ?? 'friendly';
                    @endphp
                    <div class="flex flex-wrap gap-2">
                        @foreach($tones as $tid => $tlabel)
                        <label class="cursor-pointer">
                            <input type="radio" name="default_tone" value="{{ $tid }}" class="sr-only peer"
                                   {{ $selectedTone === $tid ? 'checked' : '' }}>
                            <span class="inline-block px-4 py-2 rounded-lg border text-sm font-medium transition cursor-pointer
                                peer-checked:bg-violet-600 peer-checked:border-violet-600 peer-checked:text-white
                                border-gray-600 text-gray-400 hover:border-violet-500/50 hover:text-gray-200">
                                {{ $tlabel }}
                            </span>
                        </label>
                        @endforeach
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-medium text-gray-300 mb-1.5">Max Posts Per Day</label>
                        <input type="number" name="max_posts_day" min="1" max="100"
                               value="{{ $settings['max_posts_day'] ?? '25' }}"
                               class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"/>
                        <p class="mt-1 text-xs text-gray-500">Per Facebook page per day.</p>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-300 mb-1.5">Minimum Gap Between Posts (minutes)</label>
                        <input type="number" name="min_gap_minutes" min="1"
                               value="{{ $settings['min_gap_minutes'] ?? '5' }}"
                               class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"/>
                    </div>
                </div>

                <div class="mt-5 pt-4 border-t border-gray-700/50">
                    <button type="submit"
                            class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition">
                        <i class="fa-solid fa-floppy-disk"></i> Save Settings
                    </button>
                </div>
            </div>

        </form>
    </div>
</div>

<script>
(function () {
    const providerHints = {
        deepseek:  'platform.deepseek.com → API Keys',
        anthropic: 'console.anthropic.com → API Keys',
        openai:    'platform.openai.com → API Keys',
        stub:      '',
    };
    const providerPlaceholders = {
        deepseek:  'sk-...',
        anthropic: 'sk-ant-api03-...',
        openai:    'sk-...',
        stub:      '',
    };

    document.querySelectorAll('input[name="provider"]').forEach(function (radio) {
        radio.addEventListener('change', function () {
            const pid = this.value;

            // highlight selected card
            document.querySelectorAll('.provider-option').forEach(function (el) {
                el.classList.remove('border-violet-500', 'bg-violet-500/10');
                el.classList.add('border-gray-600');
            });
            this.closest('.provider-option').classList.add('border-violet-500', 'bg-violet-500/10');
            this.closest('.provider-option').classList.remove('border-gray-600');

            // show/hide api key field
            const wrap = document.getElementById('api-key-wrap');
            const inp  = document.getElementById('api-key-input');
            const hint = document.getElementById('provider-hint-text');
            if (pid === 'stub') {
                wrap.classList.add('hidden');
            } else {
                wrap.classList.remove('hidden');
                inp.placeholder = providerPlaceholders[pid] || 'sk-...';
                if (hint) hint.textContent = providerHints[pid] || '';
            }

            // show correct model group
            document.querySelectorAll('.model-group').forEach(function (el) {
                el.classList.add('hidden');
                // uncheck radios in hidden groups so they don't interfere
                el.querySelectorAll('input[type="radio"]').forEach(function(r){ r.checked = false; });
            });
            const activeGroup = document.querySelector('.model-group[data-provider="' + pid + '"]');
            if (activeGroup) {
                activeGroup.classList.remove('hidden');
                // auto-select first model if none checked
                const first = activeGroup.querySelector('input[type="radio"]');
                if (first && !activeGroup.querySelector('input[type="radio"]:checked')) first.checked = true;
            }
        });
    });
})();
</script>
@endsection
