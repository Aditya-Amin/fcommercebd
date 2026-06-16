<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::guard('admin')->user()?->role !== 'super_admin') {
            abort(403, 'Access restricted to Super Admins.');
        }

        return $next($request);
    }
}
