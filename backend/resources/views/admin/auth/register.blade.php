<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Create Admin Account — fCommerceBD</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
    <style>
        body { background: #0f1117; color: #e2e8f0; font-family: 'Segoe UI', sans-serif; }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">

<div class="w-full max-w-md">
    {{-- Logo --}}
    <div class="flex items-center justify-center gap-3 mb-8">
        <div class="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-lg font-bold">F</div>
        <div>
            <p class="text-lg font-semibold leading-none">fCommerceBD</p>
            <p class="text-xs text-gray-400 mt-0.5">Admin Panel</p>
        </div>
    </div>

    <div class="rounded-2xl p-8" style="background:#1e2535">
        <h2 class="text-xl font-semibold mb-1">Create admin account</h2>
        <p class="text-sm text-gray-400 mb-6">Fill in the details below to register</p>

        @if($errors->any())
            <div class="mb-4 px-4 py-3 rounded-lg bg-red-900/40 border border-red-700/50 text-red-300 text-sm space-y-1">
                @foreach($errors->all() as $error)
                    <p>{{ $error }}</p>
                @endforeach
            </div>
        @endif

        <form method="POST" action="{{ route('admin.register') }}" class="space-y-5">
            @csrf

            <div>
                <label class="block text-sm text-gray-300 mb-1.5">Full name</label>
                <div class="relative">
                    <i class="fa-solid fa-user absolute left-3.5 top-3.5 text-gray-500 text-sm"></i>
                    <input type="text" name="name" value="{{ old('name') }}" required
                           class="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                           placeholder="John Doe"/>
                </div>
            </div>

            <div>
                <label class="block text-sm text-gray-300 mb-1.5">Email address</label>
                <div class="relative">
                    <i class="fa-solid fa-envelope absolute left-3.5 top-3.5 text-gray-500 text-sm"></i>
                    <input type="email" name="email" value="{{ old('email') }}" required
                           class="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                           placeholder="admin@example.com"/>
                </div>
            </div>

            <div>
                <label class="block text-sm text-gray-300 mb-1.5">Password</label>
                <div class="relative">
                    <i class="fa-solid fa-lock absolute left-3.5 top-3.5 text-gray-500 text-sm"></i>
                    <input type="password" name="password" required
                           class="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                           placeholder="Min. 8 characters"/>
                </div>
            </div>

            <div>
                <label class="block text-sm text-gray-300 mb-1.5">Confirm password</label>
                <div class="relative">
                    <i class="fa-solid fa-lock absolute left-3.5 top-3.5 text-gray-500 text-sm"></i>
                    <input type="password" name="password_confirmation" required
                           class="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                           placeholder="Repeat password"/>
                </div>
            </div>

            <button type="submit"
                    class="w-full bg-violet-600 hover:bg-violet-500 transition-colors text-white font-semibold py-3 rounded-lg text-sm">
                Create account
            </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-6">
            Already have an account?
            <a href="{{ route('admin.login') }}" class="text-violet-400 hover:text-violet-300">Sign in</a>
        </p>
    </div>
</div>

</body>
</html>
