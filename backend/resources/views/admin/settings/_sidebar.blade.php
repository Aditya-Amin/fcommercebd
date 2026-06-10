<aside class="w-48 shrink-0">
    <div class="card p-3 space-y-4">
        <div>
            <p class="text-[11px] font-semibold uppercase tracking-widest text-gray-500 px-2 mb-1">Model Settings</p>
            <ul class="space-y-0.5">
                <li>
                    <a href="{{ route('admin.settings.image-generation') }}"
                       class="nav-item flex items-center gap-2.5 px-3 py-2 text-sm {{ request()->routeIs('admin.settings.image-generation') ? 'active text-white' : 'text-gray-400' }}">
                        <i class="fa-solid fa-image w-4 text-center text-xs"></i> Image Generation
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.settings.facebook-post') }}"
                       class="nav-item flex items-center gap-2.5 px-3 py-2 text-sm {{ request()->routeIs('admin.settings.facebook-post') ? 'active text-white' : 'text-gray-400' }}">
                        <i class="fa-brands fa-facebook w-4 text-center text-xs"></i> Facebook Post
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.settings.sms-api') }}"
                       class="nav-item flex items-center gap-2.5 px-3 py-2 text-sm {{ request()->routeIs('admin.settings.sms-api') ? 'active text-white' : 'text-gray-400' }}">
                        <i class="fa-solid fa-comment-sms w-4 text-center text-xs"></i> SMS API
                    </a>
                </li>
            </ul>
        </div>
    </div>
</aside>
