<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
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
            <p class="text-xs text-gray-400 mt-0.5">admin</p>
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
            <i class="fa-solid fa-users w-4 text-center"></i> User Subscription
        </a>

        <a href="#"
           class="nav-item flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400">
            <i class="fa-solid fa-robot w-4 text-center"></i> Total AI Cost
        </a>

        <a href="{{ route('admin.users') }}"
           class="nav-item flex items-center gap-3 px-3 py-2.5 text-sm {{ request()->routeIs('admin.users') ? 'active text-white' : 'text-gray-400' }}">
            <i class="fa-solid fa-database w-4 text-center"></i> User Data
        </a>

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
            <button class="relative text-gray-400 hover:text-white">
                <i class="fa-solid fa-bell text-lg"></i>
                <span class="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full"></span>
            </button>
            <div class="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold">A</div>
        </div>
    </header>

    <main class="flex-1 overflow-y-auto p-6">
        @yield('content')
    </main>
</div>

@stack('scripts')
</body>
</html>
