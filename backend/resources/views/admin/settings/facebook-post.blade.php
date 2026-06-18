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

        {{-- ── AI provider health: surfaced from the last real generation attempt ── --}}
        @php
            $aiStatus  = $settings['ai_status'] ?? null;
            $aiStatusMsg = $settings['ai_status_message'] ?? null;
            $aiStatusAt  = $settings['ai_status_at'] ?? null;
            $statusMeta = [
                'limit_reached' => ['icon' => 'fa-circle-exclamation', 'title' => 'AI limit reached', 'detail' => 'Your AI provider rejected the last request because the account credit/quota is exhausted. Customers currently cannot generate posts. Top up credits at your provider, then generation resumes automatically.'],
                'rate_limited'  => ['icon' => 'fa-gauge-high',         'title' => 'AI provider rate limited', 'detail' => 'The provider is throttling requests. This usually clears on its own within a few minutes.'],
                'auth_error'    => ['icon' => 'fa-key',                'title' => 'AI key problem', 'detail' => 'The provider rejected the API key (missing, invalid, or revoked). Re-check the key above.'],
            ];
        @endphp
        @if($aiStatus && isset($statusMeta[$aiStatus]))
            @php $m = $statusMeta[$aiStatus]; @endphp
            <div class="flex items-start gap-3 rounded-xl bg-red-900/30 border border-red-700/50 px-4 py-3 text-sm text-red-300">
                <i class="fa-solid {{ $m['icon'] }} mt-0.5"></i>
                <div>
                    <p class="font-semibold text-red-200">{{ $m['title'] }}</p>
                    <p class="mt-0.5 text-red-300/90">{{ $m['detail'] }}</p>
                    @if($aiStatusAt)
                        <p class="mt-1 text-xs text-red-400/70">Last checked: {{ \Illuminate\Support\Carbon::parse($aiStatusAt)->diffForHumans() }}</p>
                    @endif
                </div>
            </div>
        @elseif($aiStatus === 'ok' && ($settings['provider'] ?? 'stub') !== 'stub')
            <div class="flex items-center gap-3 rounded-xl bg-green-900/20 border border-green-700/40 px-4 py-3 text-sm text-green-300/90">
                <i class="fa-solid fa-circle-check"></i> AI provider responded normally on the last generation.
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
                    <div class="relative">
                        <input type="password" name="api_key" id="api-key-input"
                               value="{{ $settings['api_key'] ?? '' }}"
                               placeholder="{{ $providers[$selectedProvider]['placeholder'] ?? 'sk-...' }}"
                               autocomplete="new-password"
                               class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 pr-10 text-sm text-gray-200 font-mono focus:outline-none focus:border-violet-500"/>
                        <button type="button" id="toggle-key-btn"
                                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition"
                                title="Show / hide key">
                            <i class="fa-solid fa-eye" id="toggle-key-icon"></i>
                        </button>
                    </div>
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
                               {{ $selectedModel === $m['id'] ? 'checked' : '' }}
                               {{ $selectedProvider === $pid ? '' : 'disabled' }}>
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
                    <input type="hidden" name="ai_model" value="stub" {{ $selectedProvider === $pid ? '' : 'disabled' }}>
                    @endif
                </div>
                @endforeach
            </div>

            {{-- ── AI Prompt Template ─────────────────────────────────────────── --}}
            <div class="card p-5 mb-5">
                <div class="flex items-start justify-between gap-3 mb-3">
                    <div>
                        <h3 class="text-sm font-semibold text-white">AI Prompt Instructions</h3>
                        <p class="text-xs text-gray-400 mt-0.5">
                            Write your AI instructions here. The product details, tone, and language chosen
                            by the user on the frontend are <span class="text-violet-400 font-medium">automatically appended</span> — you don't need to add them.
                        </p>
                    </div>
                    <button type="button" id="reset-prompt-btn"
                            class="shrink-0 text-xs text-gray-400 hover:text-violet-400 transition underline underline-offset-2 mt-0.5">
                        Reset to default
                    </button>
                </div>

                {{-- What gets auto-appended --}}
                <div class="mb-3 rounded-lg bg-gray-700/40 border border-gray-600/50 px-3 py-2.5 text-xs text-gray-400 space-y-1">
                    <p class="text-gray-300 font-medium mb-1"><i class="fa-solid fa-arrow-down-to-line mr-1 text-violet-400"></i>Automatically appended from frontend:</p>
                    <p><span class="text-violet-300 font-mono">Tone</span> — friendly / professional / promo / festive (user's choice)</p>
                    <p><span class="text-violet-300 font-mono">Language</span> — English / Bengali / Banglish (user's choice)</p>
                    <p><span class="text-violet-300 font-mono">Hashtags</span> — include or skip (user's choice)</p>
                    <p><span class="text-violet-300 font-mono">Product data</span> — title, description, price, tags (from the selected product)</p>
                </div>

                @php $savedPrompt = $settings['ai_prompt_template'] ?? ''; @endphp
                <textarea
                    name="ai_prompt_template"
                    id="ai-prompt-textarea"
                    rows="12"
                    placeholder="Leave blank to use the built-in default…"
                    class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-xs text-gray-200 font-mono leading-relaxed focus:outline-none focus:border-violet-500 resize-y"
                >{{ $savedPrompt }}</textarea>
                <p class="mt-1.5 text-xs text-gray-500">
                    <i class="fa-solid fa-circle-info mr-1"></i>
                    Leave blank to use the built-in default. Click "Reset to default" to see what the default looks like.
                </p>
            </div>

            <div class="mt-2">
                <button type="submit"
                        class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition">
                    <i class="fa-solid fa-floppy-disk"></i> Save Settings
                </button>
            </div>

        </form>
    </div>
</div>

<div id="default-prompt-data" data-prompt="{{ $defaultPrompt }}" style="display:none"></div>

<script>
(function () {
    // ── Reset prompt to default ───────────────────────────────────────────────
    var defaultPrompt = document.getElementById('default-prompt-data').dataset.prompt;
    var resetBtn = document.getElementById('reset-prompt-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            document.getElementById('ai-prompt-textarea').value = defaultPrompt;
        });
    }

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
                // uncheck + disable inputs in hidden groups so they never submit
                // (disabled fields are excluded from the POST body — otherwise the
                //  hidden stub input would clobber the real ai_model selection)
                el.querySelectorAll('input[name="ai_model"]').forEach(function (r) {
                    if (r.type === 'radio') r.checked = false;
                    r.disabled = true;
                });
            });
            const activeGroup = document.querySelector('.model-group[data-provider="' + pid + '"]');
            if (activeGroup) {
                activeGroup.classList.remove('hidden');
                // re-enable this group's inputs so the chosen model is submitted
                activeGroup.querySelectorAll('input[name="ai_model"]').forEach(function (r) {
                    r.disabled = false;
                });
                // auto-select first model if none checked
                const first = activeGroup.querySelector('input[type="radio"]');
                if (first && !activeGroup.querySelector('input[type="radio"]:checked')) first.checked = true;
            }
        });
    });

    // ── Show / hide API key ───────────────────────────────────────────────────
    var toggleBtn  = document.getElementById('toggle-key-btn');
    var toggleIcon = document.getElementById('toggle-key-icon');
    var keyInput   = document.getElementById('api-key-input');
    if (toggleBtn && keyInput) {
        toggleBtn.addEventListener('click', function () {
            var hidden = keyInput.type === 'password';
            keyInput.type = hidden ? 'text' : 'password';
            toggleIcon.className = hidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
        });
    }
})();
</script>
@endsection
