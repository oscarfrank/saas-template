<?php

namespace Modules\Settings\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Session;

class TrackTenancy
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        \Log::info('TrackTenancy middleware started', [
            'path' => $request->path(),
            'method' => $request->method(),
            'user' => $request->user() ? $request->user()->id : null,
            'route_tenant' => $request->route('tenant')
        ]);

        if ($request->user()) {
            // Get the tenant slug from the route
            $tenantSlug = $request->route('tenant');
            
            // If we have a tenant slug, find the tenant
            $currentTenant = null;
            if ($tenantSlug) {
                $currentTenant = \App\Models\Tenant::where('slug', $tenantSlug)->first();
            }
            
            \Log::info('Checking tenant tracking', [
                'user_id' => $request->user()->id,
                'tenant_slug' => $tenantSlug,
                'current_tenant' => $currentTenant ? [
                    'id' => $currentTenant->id,
                    'id_type' => gettype($currentTenant->id),
                    'name' => $currentTenant->name,
                    'slug' => $currentTenant->slug
                ] : null,
                'route_tenant' => $tenantSlug
            ]);

            if ($currentTenant) {
                // Update the session
                Session::put('current_tenant_id', $currentTenant->id);
                
                try {
                    $preferences = $request->user()->getPreferences();
                    
                    \Log::info('Checking tenant tracking', [
                        'user_id' => $request->user()->id,
                        'current_tenant' => [
                            'id' => $currentTenant->id,
                            'id_type' => gettype($currentTenant->id),
                            'name' => $currentTenant->name,
                            'slug' => $currentTenant->slug
                        ],
                        'last_tenant_id' => $preferences->getLastTenantId(),
                        'last_tenant_id_type' => gettype($preferences->getLastTenantId()),
                        'preferences_before' => $preferences->preferences,
                        'preferences_type' => gettype($preferences->preferences)
                    ]);
                    
                    // Always update the last tenant ID if we have a current tenant
                    // Convert tenant ID to string to ensure consistent type
                    $tenantId = (string) $currentTenant->id;
                    $preferences->updateLastTenantId($tenantId);
                    
                    \Log::info('About to save preferences', [
                        'tenant_id' => $tenantId,
                        'tenant_id_type' => gettype($tenantId),
                        'preferences' => $preferences->preferences,
                        'preferences_type' => gettype($preferences->preferences)
                    ]);
                    
                    $saved = $preferences->save();
                    
                    \Log::info('Successfully updated last tenant ID', [
                        'user_id' => $request->user()->id,
                        'save_success' => $saved,
                        'preferences_after' => $preferences->preferences,
                        'preferences_type' => gettype($preferences->preferences),
                        'tenant_id' => $tenantId,
                        'tenant_id_type' => gettype($tenantId)
                    ]);
                } catch (\Exception $e) {
                    \Log::error('Failed to update last tenant ID', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            } else {
                \Log::info('No current tenant found, skipping update', [
                    'user_id' => $request->user()->id,
                    'tenant_slug' => $tenantSlug
                ]);
            }
        } else {
            \Log::info('No authenticated user, skipping tenant tracking');
        }

        return $next($request);
    }
} 