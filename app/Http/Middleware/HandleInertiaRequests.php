<?php

namespace App\Http\Middleware;

use Modules\Settings\Models\SiteSettings;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;
use App\Models\Tenant;
use Inertia\Inertia;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $user = $request->user();
        $tenants = [];
        $currentTenant = null;

        if ($user) {
            // If user is superadmin, get all tenants
            if ($user->hasRole('superadmin')) {
                $tenants = Tenant::query()
                    ->select(['id', 'name', 'slug'])
                    ->get()
                    ->toArray();
            } else {
                // For other users, get their associated tenants
                $tenants = $user->tenants()
                    ->select(['tenants.id', 'tenants.name', 'tenants.slug'])
                    ->get()
                    ->toArray();
            }

            // Get the current tenant from the route parameter
            $tenantSlug = $request->route('tenant');
            if ($tenantSlug) {
                $currentTenant = collect($tenants)->firstWhere('slug', $tenantSlug);
            }

            // If no current tenant is set, use the first tenant from the list
            if (!$currentTenant && !empty($tenants)) {
                $currentTenant = $tenants[0];
            }

            // If we're on the homepage and have a tenant, set the redirect URL
            if ($request->is('/') && $currentTenant) {
                $this->redirect = "/{$currentTenant['slug']}/dashboard";
            }
        }

        // Debug the tenants data
        \Log::info('Tenants data:', [
            'user_id' => $user?->id,
            'is_superadmin' => $user?->hasRole('superadmin'),
            'tenants_count' => count($tenants),
            'tenants' => $tenants,
            'current_tenant' => $currentTenant,
            'route_tenant' => $request->route('tenant')
        ]);

        // Create Ziggy configuration
        $ziggy = new Ziggy;
        $ziggyData = $ziggy->toArray();

        // Ensure tenant parameter is available for all routes
        if ($currentTenant) {
            foreach ($ziggyData['routes'] as $name => $route) {
                if (str_contains($route['uri'], '{tenant}')) {
                    $ziggyData['routes'][$name]['parameters'] = array_merge(
                        $ziggyData['routes'][$name]['parameters'] ?? [],
                        ['tenant' => $currentTenant['slug']]
                    );
                }
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user?->load('roles'),
            ],
            'ziggy' => fn () => [
                ...$ziggyData,
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'siteSettings' => SiteSettings::getSettings(),
            'tenant' => $currentTenant,
            'tenants' => $tenants,
            'preferences' => $user ? [
                'last_tenant_id' => $user->getPreferences()->getLastTenantId(),
                'last_visited_page' => $user->getPreferences()->getLastVisitedPage(),
            ] : null,
        ];
    }
}
