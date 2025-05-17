<?php
// app/Http/Middleware/RequireLevel.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RequireLevel
{
    public function handle(Request $request, Closure $next, $requiredLevel)
    {
        $user = auth()->user();
        
        if (!$user) {
            return redirect('login');
        }
        
        $userLevel = $user->roles->max('level') ?? 0;
        
        if ($userLevel < $requiredLevel) {
            abort(403, 'Insufficient access level.');
        }
        
        return $next($request);
    }
}