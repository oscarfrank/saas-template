<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;
use App\Models\Tenant;

class EnsureTenantAccess
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        Log::info('EnsureTenantAccess middleware starting', [
            'path' => $request->path(),
            'user_id' => $request->user()?->id,
            'tenant_slug' => $request->route('tenant')
        ]);

        if (!$request->user()) {
            Log::warning('No authenticated user in EnsureTenantAccess');
            return redirect()->route('login');
        }

        $tenantSlug = $request->route('tenant');
        
        if (!$tenantSlug) {
            Log::info('No tenant slug in route parameters');
            return $next($request);
        }

        // First check if tenant exists
        $tenant = Tenant::where('slug', $tenantSlug)->first();
        
        if (!$tenant) {
            Log::warning('Tenant not found', [
                'tenant_slug' => $tenantSlug,
                'path' => $request->path()
            ]);
            
            abort(404);
        }

        // Then check if user belongs to the tenant
        $hasAccess = $request->user()->tenants()
            ->where('slug', $tenantSlug)
            ->exists();

        if (!$hasAccess) {
            Log::warning('Unauthorized tenant access attempt', [
                'user_id' => $request->user()->id,
                'tenant_slug' => $tenantSlug,
                'path' => $request->path()
            ]);
            
            abort(404);
        }

        Log::info('Tenant access granted', [
            'user_id' => $request->user()->id,
            'tenant_slug' => $tenantSlug
        ]);

        return $next($request);
    }
} 