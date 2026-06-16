@extends('admin.layout')

@section('title', 'Admin Accounts')
@section('page-title', 'Admin Accounts')

@section('content')
<div class="space-y-6">

    {{-- Header --}}
    <div class="flex items-center justify-between">
        <p class="text-sm text-gray-400">Only listed emails can access this admin panel.</p>
        <button onclick="openModal()"
                class="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 transition-colors text-white text-sm font-semibold px-4 py-2 rounded-lg">
            <i class="fa-solid fa-plus"></i> Add Admin
        </button>
    </div>

    @if(session('success'))
        <div class="px-4 py-3 rounded-lg bg-green-900/40 border border-green-700/50 text-green-300 text-sm">
            {{ session('success') }}
        </div>
    @endif

    @if($errors->any())
        <div class="px-4 py-3 rounded-lg bg-red-900/40 border border-red-700/50 text-red-300 text-sm">
            {{ $errors->first() }}
        </div>
    @endif

    {{-- Table --}}
    <div class="card overflow-hidden">
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b border-gray-700/60 text-gray-400 text-left">
                    <th class="px-5 py-3.5 font-medium">#</th>
                    <th class="px-5 py-3.5 font-medium">Name</th>
                    <th class="px-5 py-3.5 font-medium">Email</th>
                    <th class="px-5 py-3.5 font-medium">Role</th>
                    <th class="px-5 py-3.5 font-medium">Status</th>
                    <th class="px-5 py-3.5 font-medium">Added</th>
                    <th class="px-5 py-3.5 font-medium text-right">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/40">
                @forelse($admins as $admin)
                <tr class="hover:bg-gray-700/20 transition-colors">
                    <td class="px-5 py-4 text-gray-500">{{ $admin->id }}</td>
                    <td class="px-5 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {{ $admin->name ? strtoupper(substr($admin->name, 0, 1)) : '?' }}
                            </div>
                            <span class="font-medium text-gray-200">{{ $admin->name ?: '—' }}</span>
                        </div>
                    </td>
                    <td class="px-5 py-4 text-gray-400">{{ $admin->email }}</td>
                    <td class="px-5 py-4">
                        @if($admin->role === 'super_admin')
                            <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-900/50 text-violet-300">Super Admin</span>
                        @else
                            <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">Admin</span>
                        @endif
                    </td>
                    <td class="px-5 py-4">
                        @if($admin->password)
                            <span class="flex items-center gap-1.5 text-xs text-green-400"><i class="fa-solid fa-circle-check"></i> Active</span>
                        @else
                            <span class="flex items-center gap-1.5 text-xs text-yellow-400"><i class="fa-solid fa-clock"></i> Pending</span>
                        @endif
                    </td>
                    <td class="px-5 py-4 text-gray-500">{{ $admin->created_at->format('d M Y') }}</td>
                    <td class="px-5 py-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <a href="{{ route('admin.admins.edit', $admin) }}"
                               class="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs transition-colors">
                                <i class="fa-solid fa-pen-to-square mr-1"></i> Edit
                            </a>
                            @if($admin->id !== auth('admin')->id())
                            <form method="POST" action="{{ route('admin.admins.destroy', $admin) }}"
                                  onsubmit="return confirm('Delete this admin account?')">
                                @csrf
                                @method('DELETE')
                                <button type="submit"
                                        class="px-3 py-1.5 rounded-lg bg-red-900/50 hover:bg-red-800/70 text-red-400 text-xs transition-colors">
                                    <i class="fa-solid fa-trash mr-1"></i> Delete
                                </button>
                            </form>
                            @endif
                        </div>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="7" class="px-5 py-10 text-center text-gray-500">No admins added yet.</td>
                </tr>
                @endforelse
            </tbody>
        </table>

        @if($admins->hasPages())
        <div class="px-5 py-4 border-t border-gray-700/40">
            {{ $admins->links() }}
        </div>
        @endif
    </div>

</div>

{{-- Add Admin Modal --}}
<div id="add-admin-modal" class="fixed inset-0 z-50 p-4" style="background:rgba(0,0,0,0.6); display:none">
    <div class="flex items-center justify-center min-h-full">
        <div class="w-full max-w-md rounded-2xl p-6 shadow-2xl" style="background:#1e2535">
            <div class="flex items-center justify-between mb-5">
                <div>
                    <h3 class="text-base font-semibold text-gray-100">Add Admin</h3>
                    <p class="text-xs text-gray-400 mt-0.5">Only this email will be allowed to access the dashboard.</p>
                </div>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-300 transition-colors text-xl leading-none">&times;</button>
            </div>

            <form method="POST" action="{{ route('admin.admins.store') }}" class="space-y-4">
                @csrf
                <div>
                    <label class="block text-sm text-gray-300 mb-1.5">Email address</label>
                    <div class="relative">
                        <i class="fa-solid fa-envelope absolute left-3.5 top-3.5 text-gray-500 text-sm"></i>
                        <input type="email" name="email" value="{{ old('email') }}" required
                               placeholder="admin@example.com"
                               class="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"/>
                    </div>
                </div>
                <div>
                    <label class="block text-sm text-gray-300 mb-1.5">Role</label>
                    <select name="role" required
                            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500">
                        <option value="admin"       {{ old('role') === 'admin'       ? 'selected' : '' }}>Admin</option>
                        <option value="super_admin" {{ old('role') === 'super_admin' ? 'selected' : '' }}>Super Admin</option>
                    </select>
                </div>
                <div class="flex items-center gap-3 pt-1">
                    <button type="submit"
                            class="flex-1 bg-violet-600 hover:bg-violet-500 transition-colors text-white font-semibold py-2.5 rounded-lg text-sm">
                        Add Admin
                    </button>
                    <button type="button" onclick="closeModal()"
                            class="flex-1 bg-gray-700 hover:bg-gray-600 transition-colors text-gray-300 font-semibold py-2.5 rounded-lg text-sm">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
    const modal = document.getElementById('add-admin-modal');

    function openModal()  { modal.style.display = 'block'; }
    function closeModal() { modal.style.display = 'none'; }

    // Close on backdrop click
    modal.addEventListener('click', function(e) { if (e.target === this) closeModal(); });

    // Re-open if validation errors
    @if($errors->any()) openModal(); @endif
</script>
@endsection
