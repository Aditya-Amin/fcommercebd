@extends('admin.layout')
@section('title', 'Image Generation Settings')
@section('page-title', 'Image Generation Settings')

@section('content')
<div class="flex gap-6">

    @include('admin.settings._sidebar')

    <div class="flex-1 space-y-5">

        @if(session('success'))
            <div class="flex items-center gap-3 rounded-xl bg-green-900/40 border border-green-700/50 px-4 py-3 text-sm text-green-300">
                <i class="fa-solid fa-circle-check"></i> {{ session('success') }}
            </div>
        @endif

        <form method="POST" action="{{ route('admin.settings.image-generation.save') }}">
            @csrf

            {{-- Provider --}}
            <div class="card p-5 mb-5">
                <h3 class="text-sm font-semibold text-white mb-1">Choose Image Generation Provider</h3>
                <p class="text-xs text-gray-400 mb-4">Select the AI provider used to generate product images.</p>
                @php
                    $providers = [
                        ['id'=>'stub',      'name'=>'Stub (No Key Required)', 'desc'=>'Local mock generator for development. Returns placeholder images instantly.'],
                        ['id'=>'openai',    'name'=>'OpenAI DALL-E 3',        'desc'=>'High-quality AI image generation. Best for product visuals and banners.'],
                        ['id'=>'replicate', 'name'=>'Replicate (Stable Diffusion)', 'desc'=>'Open-source models via Replicate API. Cost-effective for bulk generation.'],
                    ];
                    $selectedProvider = $settings['provider'] ?? 'stub';
                @endphp
                <div class="grid grid-cols-3 gap-3">
                    @foreach($providers as $p)
                    <label class="cursor-pointer">
                        <input type="radio" name="provider" value="{{ $p['id'] }}" class="sr-only peer"
                               {{ $selectedProvider === $p['id'] ? 'checked' : '' }}>
                        <div class="rounded-xl border-2 p-4 transition peer-checked:border-violet-500 peer-checked:bg-violet-500/10 border-gray-600 hover:border-violet-500/50 h-full">
                            <div class="flex items-start justify-between gap-2">
                                <p class="text-sm font-semibold text-white">{{ $p['name'] }}</p>
                            </div>
                            <p class="mt-1 text-xs text-gray-400">{{ $p['desc'] }}</p>
                        </div>
                    </label>
                    @endforeach
                </div>
            </div>

            {{-- Output Settings --}}
            <div class="card p-5 mb-5">
                <h3 class="text-sm font-semibold text-white mb-1">Output Settings</h3>
                <p class="text-xs text-gray-400 mb-4">Configure generated image size.</p>
                @php
                    $sizes = ['512x512'=>'512 × 512','768x768'=>'768 × 768','1024x1024'=>'1024 × 1024'];
                    $selectedSize = $settings['image_size'] ?? '1024x1024';
                @endphp
                <div class="flex flex-wrap gap-2">
                    @foreach($sizes as $sid => $slabel)
                    <label class="cursor-pointer">
                        <input type="radio" name="image_size" value="{{ $sid }}" class="sr-only peer"
                               {{ $selectedSize === $sid ? 'checked' : '' }}>
                        <span class="inline-block px-4 py-2 rounded-lg border text-sm font-medium transition
                            peer-checked:bg-violet-600 peer-checked:border-violet-600 peer-checked:text-white
                            border-gray-600 text-gray-400 hover:border-violet-500/50 hover:text-gray-200">
                            {{ $slabel }}
                        </span>
                    </label>
                    @endforeach
                </div>
            </div>

            {{-- API Credentials --}}
            <div class="card p-5">
                <h3 class="text-sm font-semibold text-white mb-1">API Credentials</h3>
                <p class="text-xs text-gray-400 mb-4">Enter your API key for OpenAI or Replicate. Not required for Stub.</p>

                <div id="api-key-section" class="{{ $selectedProvider === 'stub' ? 'hidden' : '' }}">
                    <label class="block text-xs font-medium text-gray-300 mb-1.5">API Key</label>
                    <div class="relative max-w-md">
                        <input type="password" name="api_key" id="api-key-input"
                               value="{{ $settings['api_key'] ?? '' }}"
                               placeholder="{{ $selectedProvider === 'replicate' ? 'r8_...' : 'sk-...' }}"
                               autocomplete="new-password"
                               class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 pr-10 text-sm text-gray-200 font-mono focus:outline-none focus:border-violet-500"/>
                        <button type="button" id="toggle-key-btn"
                                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition"
                                title="Show / hide key">
                            <i class="fa-solid fa-eye" id="toggle-key-icon"></i>
                        </button>
                    </div>
                    <p class="mt-1 text-xs text-gray-500" id="api-key-hint">
                        @if($selectedProvider === 'openai') Your OpenAI secret key (sk-...)
                        @elseif($selectedProvider === 'replicate') Your Replicate API token (r8_...)
                        @endif
                    </p>
                </div>

                <div id="stub-notice" class="{{ $selectedProvider !== 'stub' ? 'hidden' : '' }} rounded-xl border border-gray-600 bg-gray-800/50 p-4 text-sm text-gray-400">
                    Stub mode is active — no API key needed. Images will be placeholders.
                    Switch to OpenAI or Replicate to generate real product images.
                </div>

                <div class="mt-5 pt-4 border-t border-gray-700/50">
                    <button type="submit"
                            class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition">
                        <i class="fa-solid fa-floppy-disk"></i> Save Image Generation Settings
                    </button>
                </div>
            </div>

        </form>
    </div>
</div>
@endsection

@push('scripts')
<div id="img-key-meta" data-has-key="{{ !empty($settings['api_key']) ? '1' : '0' }}" style="display:none"></div>
<script>
    var hasKey = document.getElementById('img-key-meta').dataset.hasKey === '1';

    document.querySelectorAll('input[name="provider"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
            var isStub = this.value === 'stub';
            document.getElementById('api-key-section').classList.toggle('hidden', isStub);
            document.getElementById('stub-notice').classList.toggle('hidden', !isStub);
            var inp = document.getElementById('api-key-input');
            var placeholders = { openai: 'sk-...', replicate: 'r8_...' };
            if (inp) inp.placeholder = placeholders[this.value] || 'Enter your API key';
            var hint = document.getElementById('api-key-hint');
            if (hint && !hasKey) {
                var hints = { openai: 'Your OpenAI secret key (sk-...)', replicate: 'Your Replicate API token (r8_...)' };
                hint.textContent = hints[this.value] || '';
            }
        });
    });

    var toggleBtn  = document.getElementById('toggle-key-btn');
    var toggleIcon = document.getElementById('toggle-key-icon');
    var keyInput   = document.getElementById('api-key-input');
    if (toggleBtn && keyInput) {
        toggleBtn.addEventListener('click', function() {
            var isHidden = keyInput.type === 'password';
            keyInput.type = isHidden ? 'text' : 'password';
            toggleIcon.className = isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
        });
    }
</script>
@endpush
