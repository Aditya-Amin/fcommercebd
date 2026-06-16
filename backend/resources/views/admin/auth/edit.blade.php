@extends('admin.layout')

@section('title', 'Edit Admin')
@section('page-title', 'Edit Admin Account')

@section('content')
<div class="max-w-lg">

    @if(session('success'))
        <div class="mb-6 px-4 py-3 rounded-lg bg-green-900/40 border border-green-700/50 text-green-300 text-sm">
            {{ session('success') }}
        </div>
    @endif

    @if($errors->any())
        <div class="mb-6 px-4 py-3 rounded-lg bg-red-900/40 border border-red-700/50 text-red-300 text-sm space-y-1">
            @foreach($errors->all() as $error)
                <p>{{ $error }}</p>
            @endforeach
        </div>
    @endif

    <div class="card p-6">
        <form method="POST" action="{{ route('admin.admins.update', $admin) }}" class="space-y-5">
            @csrf
            @method('PUT')

            <div>
                <label class="block text-sm text-gray-300 mb-1.5">Full name</label>
                <input type="text" name="name" value="{{ old('name', $admin->name) }}" required
                       class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"/>
            </div>

            <div>
                <label class="block text-sm text-gray-300 mb-1.5">Email address</label>
                <input type="email" name="email" value="{{ old('email', $admin->email) }}" required
                       class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"/>
            </div>

            <div>
                <label class="block text-sm text-gray-300 mb-1.5">Role</label>
                <select name="role" required
                        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500">
                    <option value="admin"       {{ old('role', $admin->role) === 'admin'       ? 'selected' : '' }}>Admin</option>
                    <option value="super_admin" {{ old('role', $admin->role) === 'super_admin' ? 'selected' : '' }}>Super Admin</option>
                </select>
            </div>

            <div>
                <label class="block text-sm text-gray-300 mb-1.5">New password <span class="text-gray-500">(leave blank to keep current)</span></label>
                <input type="password" name="password"
                       class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                       placeholder="Min. 8 characters"/>
            </div>

            <div>
                <label class="block text-sm text-gray-300 mb-1.5">Confirm new password</label>
                <input type="password" name="password_confirmation"
                       class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                       placeholder="Repeat password"/>
            </div>

            <div class="flex items-center gap-3 pt-2">
                <button type="submit"
                        class="bg-violet-600 hover:bg-violet-500 transition-colors text-white font-semibold px-5 py-2.5 rounded-lg text-sm">
                    Save changes
                </button>
                <a href="{{ route('admin.admins.index') }}"
                   class="text-sm text-gray-400 hover:text-gray-200 transition-colors">Cancel</a>
            </div>
        </form>
    </div>

</div>
@endsection
