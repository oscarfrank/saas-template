<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ExceptUser
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check() && (Auth::user()->hasRole('user') || Auth::user()->roles->isEmpty() )) {
            // abort(403, 'Access denied');
            return redirect()->route('dashboard');
        }

        return $next($request);
    }
}