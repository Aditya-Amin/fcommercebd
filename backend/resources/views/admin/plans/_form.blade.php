@php
    /** @var \App\Models\Plan $plan */
    $limits = $plan->limits ?? [];
    $featuresText = old('features', is_array($plan->features) ? implode("\n", $plan->features) : '');
@endphp

@if($errors->any())
    <div class="px-4 py-3 rounded-lg bg-red-900/40 border border-red-700/50 text-red-300 text-sm">
        {{ $errors->first() }}
    </div>
@endif

{{-- Basics --}}
<div class="card p-5">
    <h3 class="text-sm font-semibold text-white mb-1">Plan details</h3>
    <p class="text-xs text-gray-400 mb-4">Name, pricing and billing period.</p>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
            <label class="block text-xs font-medium text-gray-300 mb-1.5">Name</label>
            <input type="text" name="name" value="{{ old('name', $plan->name) }}"
                   class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"/>
            @error('name') <p class="text-xs text-red-400 mt-1">{{ $message }}</p> @enderror
        </div>
        <div>
            <label class="block text-xs font-medium text-gray-300 mb-1.5">Tagline <span class="text-gray-600">(shown under the name on the pricing card)</span></label>
            <input type="text" name="tagline" value="{{ old('tagline', $plan->tagline) }}" placeholder="For sellers just starting out"
                   class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"/>
            @error('tagline') <p class="text-xs text-red-400 mt-1">{{ $message }}</p> @enderror
        </div>
        <div>
            <label class="block text-xs font-medium text-gray-300 mb-1.5">Slug <span class="text-gray-600">(optional — auto from name)</span></label>
            <input type="text" name="slug" value="{{ old('slug', $plan->slug) }}" placeholder="starter-monthly"
                   class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"/>
            @error('slug') <p class="text-xs text-red-400 mt-1">{{ $message }}</p> @enderror
        </div>
        <div>
            <label class="block text-xs font-medium text-gray-300 mb-1.5">Price</label>
            <input type="number" step="0.01" min="0" name="price" value="{{ old('price', $plan->price) }}"
                   class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"/>
            @error('price') <p class="text-xs text-red-400 mt-1">{{ $message }}</p> @enderror
        </div>
        <div>
            <label class="block text-xs font-medium text-gray-300 mb-1.5">Currency</label>
            <input type="text" name="currency" maxlength="3" value="{{ old('currency', $plan->currency ?? 'BDT') }}"
                   class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 uppercase focus:outline-none focus:border-violet-500"/>
            @error('currency') <p class="text-xs text-red-400 mt-1">{{ $message }}</p> @enderror
        </div>
        <div>
            <label class="block text-xs font-medium text-gray-300 mb-1.5">Billing cycle</label>
            @php $duration = old('duration', $plan->duration ?? 'monthly'); @endphp
            <select name="duration"
                    class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500">
                <option value="monthly" {{ $duration === 'monthly' ? 'selected' : '' }}>Monthly</option>
                <option value="yearly"  {{ $duration === 'yearly'  ? 'selected' : '' }}>Yearly</option>
            </select>
            @error('duration') <p class="text-xs text-red-400 mt-1">{{ $message }}</p> @enderror
        </div>
        <div>
            <label class="block text-xs font-medium text-gray-300 mb-1.5">Duration (days)</label>
            <input type="number" min="1" max="3650" name="duration_days" value="{{ old('duration_days', $plan->duration_days ?? 30) }}"
                   class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"/>
            @error('duration_days') <p class="text-xs text-red-400 mt-1">{{ $message }}</p> @enderror
        </div>
    </div>
</div>

{{-- Limits --}}
<div class="card p-5">
    <h3 class="text-sm font-semibold text-white mb-1">Feature limits</h3>
    <p class="text-xs text-gray-400 mb-4">Per-period caps the app enforces. <span class="text-gray-500">0 = feature locked.</span></p>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
            <label class="block text-xs font-medium text-gray-300 mb-1.5">Facebook posts</label>
            <input type="number" min="0" name="limit_fb_posts" value="{{ old('limit_fb_posts', $limits['fbPosts'] ?? 0) }}"
                   class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"/>
            @error('limit_fb_posts') <p class="text-xs text-red-400 mt-1">{{ $message }}</p> @enderror
        </div>
        <div>
            <label class="block text-xs font-medium text-gray-300 mb-1.5">AI generations</label>
            <input type="number" min="0" name="limit_ai_generations" value="{{ old('limit_ai_generations', $limits['aiGenerations'] ?? 0) }}"
                   class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"/>
            @error('limit_ai_generations') <p class="text-xs text-red-400 mt-1">{{ $message }}</p> @enderror
        </div>
        <div>
            <label class="block text-xs font-medium text-gray-300 mb-1.5">SMS</label>
            <input type="number" min="0" name="limit_sms" value="{{ old('limit_sms', $limits['sms'] ?? 0) }}"
                   class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"/>
            @error('limit_sms') <p class="text-xs text-red-400 mt-1">{{ $message }}</p> @enderror
        </div>
    </div>
</div>

{{-- Marketing + status --}}
<div class="card p-5">
    <h3 class="text-sm font-semibold text-white mb-1">Marketing features</h3>
    <p class="text-xs text-gray-400 mb-4">One bullet per line — shown to customers on the pricing page.</p>

    <textarea name="features" rows="5" placeholder="Unlimited products&#10;Priority support&#10;Courier integration"
              class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500">{{ $featuresText }}</textarea>
    @error('features') <p class="text-xs text-red-400 mt-1">{{ $message }}</p> @enderror

    <label class="flex items-center gap-2 mt-4 cursor-pointer select-none">
        <input type="checkbox" name="is_active" value="1" {{ old('is_active', $plan->id ? $plan->is_active : true) ? 'checked' : '' }}
               class="rounded bg-gray-800 border-gray-600 text-violet-600 focus:ring-violet-500"/>
        <span class="text-sm text-gray-300">Active <span class="text-gray-500">(shown on the pricing page & available for assignment)</span></span>
    </label>

    <label class="flex items-center gap-2 mt-3 cursor-pointer select-none">
        <input type="checkbox" name="is_popular" value="1" {{ old('is_popular', $plan->is_popular) ? 'checked' : '' }}
               class="rounded bg-gray-800 border-gray-600 text-violet-600 focus:ring-violet-500"/>
        <span class="text-sm text-gray-300">Popular <span class="text-gray-500">(adds a highlighted “Popular” badge on the card)</span></span>
    </label>
</div>

<div class="card p-5 flex items-center gap-3">
    <button type="submit"
            class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition">
        <i class="fa-solid fa-floppy-disk"></i> {{ $submitLabel ?? 'Save plan' }}
    </button>
    <a href="{{ route('admin.plans.index') }}"
       class="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white px-4 py-2.5 transition">
        Cancel
    </a>
</div>
