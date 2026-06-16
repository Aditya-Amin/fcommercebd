@extends('admin.layout')

@section('title', 'User Subscriptions')
@section('page-title', 'User Subscriptions')

@section('content')
<div class="flex gap-5 items-start">

    {{-- ── Left: Subscriber table ────────────────────────────────────────── --}}
    <div class="flex-1 min-w-0 card p-5">

        {{-- Filter bar --}}
        <div class="flex items-center justify-between mb-4">
            <p class="text-sm text-gray-400">
                <span id="selected-count">0</span> selected
            </p>
            <form method="GET" action="{{ route('admin.subscriptions') }}">
                <select name="status" onchange="this.form.submit()"
                        class="bg-gray-800 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500">
                    <option value=""          {{ ($status ?? '') === ''          ? 'selected' : '' }}>All Subscribers</option>
                    <option value="active"    {{ ($status ?? '') === 'active'    ? 'selected' : '' }}>Active</option>
                    <option value="cancelled" {{ ($status ?? '') === 'cancelled' ? 'selected' : '' }}>Cancelled</option>
                </select>
            </form>
        </div>

        @if(session('sms_result'))
        <div class="mb-4 px-4 py-3 rounded-lg bg-green-900/40 border border-green-700/50 text-green-300 text-sm">
            {{ session('sms_result') }}
        </div>
        @endif

        <table class="w-full text-sm">
            <thead>
                <tr class="text-xs text-gray-500 uppercase border-b border-gray-700/40">
                    <th class="text-left pb-3 w-8">
                        <input type="checkbox" id="select-all"
                               class="rounded bg-gray-800 border-gray-600 text-violet-600 focus:ring-violet-500 cursor-pointer"/>
                    </th>
                    <th class="text-left pb-3">#</th>
                    <th class="text-left pb-3">User</th>
                    <th class="text-left pb-3">Plan</th>
                    <th class="text-left pb-3">Amount</th>
                    <th class="text-left pb-3">Start</th>
                    <th class="text-left pb-3">Expiry</th>
                    <th class="text-left pb-3">Status</th>
                    <th class="text-left pb-3">Action</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/30">
                @forelse($subscriptions as $sub)
                <tr>
                    <td class="py-3">
                        @if($sub->user)
                        <input type="checkbox" name="selected[]"
                               value="{{ $sub->user_id }}"
                               data-name="{{ $sub->user->name }}"
                               class="row-checkbox rounded bg-gray-800 border-gray-600 text-violet-600 focus:ring-violet-500 cursor-pointer"/>
                        @endif
                    </td>
                    <td class="py-3 text-gray-500">{{ $sub->id }}</td>
                    <td class="py-3 text-gray-300">{{ $sub->user->name ?? 'N/A' }}</td>
                    <td class="py-3 text-gray-300">{{ $sub->plan->name ?? 'N/A' }}</td>
                    <td class="py-3 text-gray-300">৳ {{ number_format($sub->amount, 0) }}</td>
                    <td class="py-3 text-gray-400">{{ $sub->start_date?->format('M j, Y') ?? '—' }}</td>
                    <td class="py-3 text-gray-400">{{ $sub->expiry_date?->format('M j, Y') ?? '—' }}</td>
                    <td class="py-3">
                        <span class="px-2 py-0.5 rounded-full text-xs font-medium badge-{{ $sub->status }}">
                            {{ ucfirst($sub->status) }}
                        </span>
                    </td>
                    <td class="py-3">
                        @if($sub->user)
                        <a href="{{ route('admin.users.activity', $sub->user) }}"
                           class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600/20 text-violet-400 hover:bg-violet-600/40 hover:text-violet-200 transition-colors">
                            <i class="fa-solid fa-chart-line text-xs"></i> Activity
                        </a>
                        @else
                        <span class="text-gray-600 text-xs">—</span>
                        @endif
                    </td>
                </tr>
                @empty
                <tr><td colspan="9" class="py-8 text-center text-gray-500">No subscriptions found</td></tr>
                @endforelse
            </tbody>
        </table>
        <div class="mt-4">{{ $subscriptions->links() }}</div>
    </div>

    {{-- ── Right: SMS panel ──────────────────────────────────────────────── --}}
    <div class="w-80 flex-shrink-0">
        <div class="card p-5 sticky top-6">

            <p class="font-semibold mb-0.5">Message</p>
            <p class="text-xs text-gray-500 mb-4">Personalize with your offer, link, or business name.</p>

            <form method="POST" action="{{ route('admin.subscriptions.sms') }}" id="sms-form">
                @csrf
                <input type="hidden" name="target" id="sms-target" value="all"/>

                {{-- Hidden inputs for selected user IDs (populated by JS) --}}
                <div id="sms-user-ids"></div>

                {{-- Recipient badge --}}
                <div class="mb-3 flex items-center gap-2">
                    <span class="text-xs text-gray-400">Sending to:</span>
                    <span id="sms-recipient-badge"
                          class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-600/20 text-violet-300">
                        All subscribers
                    </span>
                </div>

                {{-- Textarea --}}
                <textarea id="sms-message" name="message" rows="5"
                          placeholder="Write your SMS message..."
                          maxlength="1600"
                          class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y mb-1"></textarea>
                <div class="flex justify-between text-xs text-gray-500 mb-4">
                    <span id="char-count">0/160</span>
                    <span id="segment-count">1 segment</span>
                </div>

                @if($errors->has('message'))
                <p class="text-red-400 text-xs mb-3">{{ $errors->first('message') }}</p>
                @endif

                {{-- Send button --}}
                <button type="submit" id="sms-send-btn"
                        class="w-full flex items-center justify-center gap-2 bg-violet-500/30 hover:bg-violet-500 text-violet-200 hover:text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                    <i class="fa-solid fa-paper-plane"></i>
                    <span id="sms-btn-label">Send to all subscribers</span>
                </button>
            </form>
        </div>
    </div>

</div>
@endsection

@push('scripts')
<script>
    const selectAll  = document.getElementById('select-all');
    const rowBoxes   = document.querySelectorAll('.row-checkbox');
    const countEl    = document.getElementById('selected-count');
    const targetInput   = document.getElementById('sms-target');
    const userIdsEl     = document.getElementById('sms-user-ids');
    const recipientBadge = document.getElementById('sms-recipient-badge');
    const btnLabel      = document.getElementById('sms-btn-label');

    // ── checkbox logic ──────────────────────────────────────────────────────
    function getChecked() {
        return [...document.querySelectorAll('.row-checkbox:checked')];
    }

    function updateSmsPanel() {
        const checked = getChecked();
        countEl.textContent = checked.length;
        selectAll.checked = rowBoxes.length > 0 && checked.length === rowBoxes.length;

        // Update SMS panel
        userIdsEl.innerHTML = '';
        if (checked.length > 0) {
            targetInput.value = 'selected';
            const names = checked.map(cb => cb.dataset.name).filter(Boolean);
            const label = checked.length === 1
                ? names[0] || '1 user'
                : `${checked.length} selected`;
            recipientBadge.textContent = label;
            btnLabel.textContent = `Send to ${checked.length} subscriber${checked.length > 1 ? 's' : ''}`;
            checked.forEach(cb => {
                const inp = document.createElement('input');
                inp.type  = 'hidden';
                inp.name  = 'user_ids[]';
                inp.value = cb.value;
                userIdsEl.appendChild(inp);
            });
        } else {
            targetInput.value = 'all';
            recipientBadge.textContent = 'All subscribers';
            btnLabel.textContent = 'Send to all subscribers';
        }
    }

    selectAll.addEventListener('change', () => {
        rowBoxes.forEach(cb => cb.checked = selectAll.checked);
        updateSmsPanel();
    });
    rowBoxes.forEach(cb => cb.addEventListener('change', updateSmsPanel));

    // ── character / segment counter ─────────────────────────────────────────
    const textarea   = document.getElementById('sms-message');
    const charCount  = document.getElementById('char-count');
    const segCount   = document.getElementById('segment-count');

    textarea.addEventListener('input', () => {
        const len  = textarea.value.length;
        const segs = Math.ceil(len / 160) || 1;
        charCount.textContent = `${len}/160`;
        segCount.textContent  = `${segs} segment${segs > 1 ? 's' : ''}`;
    });

</script>
@endpush
