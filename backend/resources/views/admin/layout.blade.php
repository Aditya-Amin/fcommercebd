<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta name="csrf-token" content="{{ csrf_token() }}"/>
    <title>@yield('title', 'Admin') — fCommerceBD</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
    <style>
        body { background: #0f1117; color: #e2e8f0; font-family: 'Segoe UI', sans-serif; }
        .sidebar { background: #161b27; }
        .card { background: #1e2535; border-radius: 12px; }
        .nav-item { border-radius: 8px; transition: background .2s; }
        .nav-item:hover, .nav-item.active { background: #2d3a55; }
        .badge-active   { background:#1a3a2a; color:#4ade80; }
        .badge-trial    { background:#1e2a3a; color:#93c5fd; }
        .badge-pending  { background:#3a2a10; color:#fbbf24; }
        .badge-expired  { background:#3a1a1a; color:#f87171; }
        .badge-cancelled{ background:#3a1a1a; color:#f87171; }
        ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-thumb { background:#2d3a55; border-radius:3px; }
    </style>
</head>
<body class="flex h-screen overflow-hidden">

{{-- Sidebar --}}
<aside class="sidebar w-56 flex flex-col flex-shrink-0 h-screen overflow-y-auto">
    <div class="px-5 py-5 flex items-center gap-3 border-b border-gray-700/40">
        <div class="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-sm font-bold">F</div>
        <div>
            <p class="text-sm font-semibold leading-none">fCommerceBD</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ auth('admin')->user()->name }}</p>
        </div>
    </div>

    <nav class="flex-1 px-3 py-4 space-y-1">
        <p class="text-xs text-gray-500 uppercase tracking-widest px-2 mb-2">Main Menu</p>

        <a href="{{ route('admin.dashboard') }}"
           class="nav-item flex items-center gap-3 px-3 py-2.5 text-sm {{ request()->routeIs('admin.dashboard') ? 'active text-white' : 'text-gray-400' }}">
            <i class="fa-solid fa-gauge-high w-4 text-center"></i> Dashboard Overview
        </a>

        <a href="{{ route('admin.subscriptions') }}"
           class="nav-item flex items-center gap-3 px-3 py-2.5 text-sm {{ request()->routeIs('admin.subscriptions') ? 'active text-white' : 'text-gray-400' }}">
            <i class="fa-solid fa-users w-4 text-center"></i> Total Subscriber
        </a>

        <a href="{{ route('admin.ai-cost') }}"
           class="nav-item flex items-center gap-3 px-3 py-2.5 text-sm {{ request()->routeIs('admin.ai-cost') ? 'active text-white' : 'text-gray-400' }}">
            <i class="fa-solid fa-robot w-4 text-center"></i> Total AI Cost
        </a>

        <a href="{{ route('admin.users') }}"
           class="nav-item flex items-center gap-3 px-3 py-2.5 text-sm {{ request()->routeIs('admin.users') ? 'active text-white' : 'text-gray-400' }}">
            <i class="fa-solid fa-database w-4 text-center"></i> User Data
        </a>

        <a href="{{ route('admin.plans.index') }}"
           class="nav-item flex items-center gap-3 px-3 py-2.5 text-sm {{ request()->routeIs('admin.plans.*') ? 'active text-white' : 'text-gray-400' }}">
            <i class="fa-solid fa-layer-group w-4 text-center"></i> Plans
        </a>

        <a href="{{ route('admin.support.index') }}"
           class="nav-item flex items-center gap-3 px-3 py-2.5 text-sm {{ request()->routeIs('admin.support.*') ? 'active text-white' : 'text-gray-400' }}">
            <i class="fa-solid fa-headset w-4 text-center"></i>
            Support
            @php $openCount = \App\Models\SupportTicket::where('status', 'open')->count(); @endphp
            @if($openCount > 0)
            <span class="ml-auto text-[10px] font-bold bg-violet-600 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {{ $openCount > 99 ? '99+' : $openCount }}
            </span>
            @endif
        </a>

        @if(auth('admin')->user()->role === 'super_admin')
        <a href="{{ route('admin.admins.index') }}"
           class="nav-item flex items-center gap-3 px-3 py-2.5 text-sm {{ request()->routeIs('admin.admins.*') ? 'active text-white' : 'text-gray-400' }}">
            <i class="fa-solid fa-user-shield w-4 text-center"></i> Admin Accounts
        </a>
        @endif

        <p class="text-xs text-gray-500 uppercase tracking-widest px-2 mt-5 mb-2">Configuration</p>

        @php
            $isSettings = request()->routeIs('admin.settings.*');
        @endphp

        <button onclick="document.getElementById('settings-menu').classList.toggle('hidden')"
                class="nav-item w-full flex items-center gap-3 px-3 py-2.5 text-sm {{ $isSettings ? 'active text-white' : 'text-gray-400' }}">
            <i class="fa-solid fa-gear w-4 text-center"></i>
            <span>Settings</span>
            <i class="fa-solid fa-chevron-down ml-auto text-xs transition-transform {{ $isSettings ? 'rotate-180' : '' }}" id="settings-chevron"></i>
        </button>

        <div id="settings-menu" class="{{ $isSettings ? '' : 'hidden' }} pl-4 space-y-0.5 mt-0.5">
            <a href="{{ route('admin.settings.image-generation') }}"
               class="nav-item flex items-center gap-3 px-3 py-2 text-sm {{ request()->routeIs('admin.settings.image-generation') ? 'active text-white' : 'text-gray-400' }}">
                <i class="fa-solid fa-image w-4 text-center text-xs"></i> Image Generation
            </a>
            <a href="{{ route('admin.settings.facebook-post') }}"
               class="nav-item flex items-center gap-3 px-3 py-2 text-sm {{ request()->routeIs('admin.settings.facebook-post') ? 'active text-white' : 'text-gray-400' }}">
                <i class="fa-brands fa-facebook w-4 text-center text-xs"></i> Facebook Post
            </a>
            <a href="{{ route('admin.settings.sms-api') }}"
               class="nav-item flex items-center gap-3 px-3 py-2 text-sm {{ request()->routeIs('admin.settings.sms-api') ? 'active text-white' : 'text-gray-400' }}">
                <i class="fa-solid fa-comment-sms w-4 text-center text-xs"></i> SMS API
            </a>
        </div>
    </nav>
</aside>

{{-- Main --}}
<div class="flex-1 flex flex-col overflow-hidden">
    {{-- Topbar --}}
    <header class="flex items-center justify-between px-6 py-3 border-b border-gray-700/40" style="background:#161b27">
        <h1 class="text-base font-semibold">@yield('page-title', 'Dashboard Overview')</h1>
        <div class="flex items-center gap-4">
            <div class="relative">
                <input type="text" placeholder="Search..."
                       class="bg-gray-800 text-sm rounded-lg pl-9 pr-4 py-1.5 w-52 focus:outline-none focus:ring-1 focus:ring-violet-500 text-gray-300 placeholder-gray-500"/>
                <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-gray-500 text-xs"></i>
            </div>
            {{-- Notification Bell --}}
            <div class="relative" id="notif-menu">
                <button id="notif-btn" onclick="event.stopPropagation(); toggleNotifPanel()"
                        class="relative text-gray-400 hover:text-white transition focus:outline-none">
                    <i class="fa-solid fa-bell text-lg"></i>
                    <span id="notif-badge"
                          class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-violet-600 text-white text-[10px] font-bold items-center justify-center hidden">
                        0
                    </span>
                </button>

                {{-- Dropdown panel --}}
                <div id="notif-panel"
                     class="hidden absolute right-0 top-full pt-2 w-80 z-50">
                    <div class="card shadow-2xl border border-gray-700/60 flex flex-col overflow-hidden" style="max-height:480px">

                        {{-- Header --}}
                        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 flex-shrink-0">
                            <p class="text-sm font-semibold text-white">Notifications</p>
                            <div class="flex items-center gap-2">
                                <button onclick="markAllRead()"
                                        class="text-[11px] text-violet-400 hover:text-violet-300 transition">Mark all read</button>
                                <span class="text-gray-600">·</span>
                                <button onclick="clearAll()"
                                        class="text-[11px] text-gray-500 hover:text-red-400 transition">Clear all</button>
                            </div>
                        </div>

                        {{-- List --}}
                        <div id="notif-list" class="overflow-y-auto flex-1 divide-y divide-gray-700/30">
                            <p id="notif-empty" class="text-xs text-gray-500 text-center py-8 hidden">No notifications yet.</p>
                        </div>
                    </div>
                </div>
            </div>
            @php $admin = auth('admin')->user(); @endphp
            {{-- Profile dropdown (click) --}}
            <div class="relative" id="profile-menu">
                <button type="button" onclick="event.stopPropagation(); document.getElementById('profile-dropdown').classList.toggle('hidden')"
                        class="flex items-center gap-2 focus:outline-none">
                    <div class="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold">
                        {{ strtoupper(substr($admin->name, 0, 1)) }}
                    </div>
                    <span class="text-sm text-gray-300 hidden sm:block">{{ $admin->name }}</span>
                    <i class="fa-solid fa-chevron-down text-xs text-gray-500"></i>
                </button>

                {{-- Dropdown menu --}}
                <div id="profile-dropdown" class="absolute right-0 top-full pt-2 w-60 z-50 hidden">
                    <div class="card overflow-hidden shadow-xl border border-gray-700/60">
                        <div class="px-4 py-3 border-b border-gray-700/50">
                            <p class="text-sm font-semibold text-gray-100">{{ $admin->name }}</p>
                            <p class="text-xs text-gray-400 mt-0.5">{{ $admin->email }}</p>
                        </div>
                        <a href="{{ route('admin.admins.edit', $admin) }}"
                           class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700/40 transition-colors">
                            <i class="fa-regular fa-user w-4 text-center"></i> Account settings
                        </a>
                        <form method="POST" action="{{ route('admin.logout') }}" class="border-t border-gray-700/50">
                            @csrf
                            <button type="submit"
                                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 transition-colors">
                                <i class="fa-solid fa-right-from-bracket w-4 text-center"></i> Sign out
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <main class="flex-1 overflow-y-auto p-6">
        @yield('content')
    </main>
</div>

{{-- Close dropdowns when clicking outside --}}
<script>
    document.addEventListener('click', function (e) {
        const profileMenu = document.getElementById('profile-menu');
        const profileDrop = document.getElementById('profile-dropdown');
        if (profileDrop && profileMenu && !profileMenu.contains(e.target)) {
            profileDrop.classList.add('hidden');
        }

        const notifMenu  = document.getElementById('notif-menu');
        const notifPanel = document.getElementById('notif-panel');
        if (notifPanel && notifMenu && !notifMenu.contains(e.target)) {
            notifPanel.classList.add('hidden');
        }
    });

    // ── Notification system ───────────────────────────────────────────────────

    const NOTIF_POLL_MS = 10000; // 10 s — near real-time without WebSockets
    const CSRF = document.querySelector('meta[name="csrf-token"]')?.content ?? '';

    const colorMap = {
        violet: { bg: 'bg-violet-500/15', icon: 'text-violet-400' },
        blue:   { bg: 'bg-blue-500/15',   icon: 'text-blue-400'   },
        green:  { bg: 'bg-green-500/15',  icon: 'text-green-400'  },
        amber:  { bg: 'bg-amber-500/15',  icon: 'text-amber-400'  },
        red:    { bg: 'bg-red-500/15',    icon: 'text-red-400'    },
        gray:   { bg: 'bg-gray-500/15',   icon: 'text-gray-400'   },
    };

    function toggleNotifPanel() {
        const panel = document.getElementById('notif-panel');
        const isHidden = panel.classList.contains('hidden');
        panel.classList.toggle('hidden');
        if (isHidden) {
            loadNotifications();
        }
    }

    function setBadge(count) {
        const badge = document.getElementById('notif-badge');
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.remove('hidden');
            badge.style.display = 'flex';
        } else {
            badge.classList.add('hidden');
            badge.style.display = '';
        }
    }

    function pollUnreadCount() {
        fetch('{{ route("admin.notifications.unread-count") }}')
            .then(r => r.json())
            .then(d => setBadge(d.unread_count))
            .catch(() => {});
    }

    function loadNotifications() {
        fetch('{{ route("admin.notifications.index") }}')
            .then(r => r.json())
            .then(({ notifications, unread_count }) => {
                setBadge(unread_count);
                renderList(notifications);
            })
            .catch(() => {});
    }

    function renderList(items) {
        const list  = document.getElementById('notif-list');
        const empty = document.getElementById('notif-empty');

        // Clear existing items but keep the empty placeholder
        list.querySelectorAll('.notif-item').forEach(el => el.remove());

        if (!items || items.length === 0) {
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');

        items.forEach(n => {
            const colors = colorMap[n.color] ?? colorMap.gray;
            const unreadDot = !n.read
                ? '<span class="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0 mt-1"></span>'
                : '<span class="w-1.5 h-1.5 flex-shrink-0"></span>';

            const inner = `
                <div class="flex items-start gap-3 flex-1 min-w-0">
                    <div class="w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i class="fa-solid ${n.icon ?? 'fa-bell'} text-xs ${colors.icon}"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-semibold text-white leading-snug">${escHtml(n.title)}</p>
                        <p class="text-xs text-gray-400 mt-0.5 leading-snug">${escHtml(n.message)}</p>
                        <p class="text-[10px] text-gray-600 mt-1" title="${escHtml(n.time_full)}">${escHtml(n.time)}</p>
                    </div>
                    ${unreadDot}
                </div>
            `;

            const wrap = document.createElement('div');
            wrap.className = `notif-item flex items-start gap-2 px-4 py-3 hover:bg-gray-700/30 transition cursor-default ${!n.read ? 'bg-violet-500/5' : ''}`;
            wrap.dataset.id = n.id;

            if (n.action_url) {
                wrap.style.cursor = 'pointer';
                wrap.onclick = () => {
                    markOneRead(n.id);
                    window.location.href = n.action_url;
                };
            } else {
                wrap.onclick = () => markOneRead(n.id, wrap);
            }

            wrap.innerHTML = inner;

            // Delete button
            const del = document.createElement('button');
            del.className = 'flex-shrink-0 text-gray-600 hover:text-red-400 transition mt-0.5 text-xs opacity-0 group-hover:opacity-100';
            del.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            del.onclick = (e) => { e.stopPropagation(); deleteOne(n.id, wrap); };
            wrap.classList.add('group');
            wrap.appendChild(del);

            list.appendChild(wrap);
        });
    }

    function markOneRead(id, el) {
        fetch(`/admin/notifications/${id}/read`, {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': CSRF, 'Content-Type': 'application/json' },
        }).then(() => {
            if (el) {
                el.classList.remove('bg-violet-500/5');
                el.querySelector('span.bg-violet-500')?.classList.replace('bg-violet-500', 'invisible');
            }
            loadNotifications();
        }).catch(() => {});
    }

    function markAllRead() {
        fetch('{{ route("admin.notifications.mark-all-read") }}', {
            method: 'POST',
            headers: { 'X-CSRF-TOKEN': CSRF, 'Content-Type': 'application/json' },
        }).then(() => loadNotifications()).catch(() => {});
    }

    function deleteOne(id, el) {
        fetch(`/admin/notifications/${id}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': CSRF, 'Content-Type': 'application/json' },
        }).then(() => {
            el?.remove();
            loadNotifications();
        }).catch(() => {});
    }

    function clearAll() {
        if (!confirm('Clear all notifications?')) return;
        fetch('{{ route("admin.notifications.destroy-all") }}', {
            method: 'DELETE',
            headers: { 'X-CSRF-TOKEN': CSRF, 'Content-Type': 'application/json' },
        }).then(() => loadNotifications()).catch(() => {});
    }

    function escHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // Boot: poll the unread badge every 10s, but skip ticks while the tab is
    // hidden (no point hammering the server for a badge nobody can see) and
    // fire an immediate catch-up the moment the tab regains focus. If the
    // dropdown is open we refresh the whole list so items appear live too.
    function tick() {
        if (document.hidden) return;
        const panel = document.getElementById('notif-panel');
        if (panel && !panel.classList.contains('hidden')) {
            loadNotifications();
        } else {
            pollUnreadCount();
        }
    }

    pollUnreadCount();
    setInterval(tick, NOTIF_POLL_MS);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
</script>

@stack('scripts')
</body>
</html>
