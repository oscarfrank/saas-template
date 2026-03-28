<?php

namespace Modules\Settings\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class TrackLastVisitedPage
{
    /**
     * Track the last visited page for "Return to last page I visited" on next login.
     * Runs after the request: on every GET (when authenticated) we update last_visited_page
     * to the current path (e.g. "acme/dashboard/workspace"), except for api/, livewire/, _debugbar/.
     *
     * Also syncs last_tenant_id (before the request) whenever the route has a {tenant} parameter,
     * so post-login redirects resume the organization the user was last using.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $this->syncLastTenantForRequest($request);

        $response = $next($request);

        if ($request->user() && $request->isMethod('GET')) {
            $path = $request->path();

            // Don't track certain paths
            if (! str_starts_with($path, 'api/') &&
                ! str_starts_with($path, 'livewire/') &&
                ! str_starts_with($path, '_debugbar/')) {

                \Log::info('Attempting to update last visited page', [
                    'user_id' => $request->user()->id,
                    'path' => $path,
                    'preferences_before' => $request->user()->getPreferences()->preferences,
                ]);

                try {
                    $preferences = $request->user()->getPreferences();
                    $preferences->updateLastVisitedPage($path);
                    $preferences->save();

                    \Log::info('Successfully updated last visited page', [
                        'user_id' => $request->user()->id,
                        'preferences_after' => $preferences->preferences,
                    ]);
                } catch (\Exception $e) {
                    \Log::error('Failed to update last visited page', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                }
            } else {
                \Log::info('Skipping last visited page update for excluded path', [
                    'path' => $path,
                ]);
            }
        } else {
            \Log::info('Skipping last visited page update', [
                'has_user' => $request->user() ? true : false,
                'is_get' => $request->isMethod('GET'),
            ]);
        }

        return $response;
    }

    /**
     * Persist the active tenant from the URL so logout/login can return to the same org.
     */
    private function syncLastTenantForRequest(Request $request): void
    {
        if (! $request->user()) {
            return;
        }

        $tenantSlug = $request->route('tenant');
        if (! is_string($tenantSlug) || $tenantSlug === '') {
            return;
        }

        $currentTenant = Tenant::query()->where('slug', $tenantSlug)->first();
        if (! $currentTenant) {
            return;
        }

        if (! $request->user()->tenants()->where('tenants.id', $currentTenant->id)->exists()) {
            return;
        }

        Session::put('current_tenant_id', $currentTenant->id);

        try {
            $preferences = $request->user()->getPreferences();
            $preferences->updateLastTenantId((string) $currentTenant->id);
            $preferences->save();
        } catch (\Throwable $e) {
            \Log::error('Failed to update last tenant ID', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
