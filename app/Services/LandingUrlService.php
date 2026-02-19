<?php

namespace App\Services;

use App\Models\Tenant;
use Modules\User\Models\User;

/**
 * Central logic for "where should this user land after login or when visiting /dashboard?"
 * Respects: user preference (org default vs last visited) and org default landing path.
 */
class LandingUrlService
{
    /**
     * Return the full URL path (with leading slash) the user should be sent to,
     * e.g. "/acme/dashboard/workspace" or "/acme/dashboard".
     *
     * The tenant must have its data column loaded for getDefaultLandingPath() to work;
     * if it was loaded via User->tenants() (which selects only id, name, slug), we refetch.
     */
    public static function forUser(User $user, Tenant $tenant): string
    {
        $preferences = $user->getPreferences();
        $behavior = $preferences->getLandingBehavior();

        if ($behavior === 'last_visited') {
            $lastPath = $preferences->getLastVisitedPage();
            // Stored as e.g. "tenant-slug/dashboard/workspace" (path without leading slash)
            if ($lastPath !== null && $lastPath !== '') {
                $lastPath = trim($lastPath, '/');
                $firstSegment = str_contains($lastPath, '/') ? explode('/', $lastPath, 2)[0] : $lastPath;
                // Only use last path if user belongs to that tenant (first segment is tenant slug)
                $belongsToTenant = $user->tenants()->where('tenants.slug', $firstSegment)->exists();
                if ($belongsToTenant) {
                    return '/' . $lastPath;
                }
            }
        }

        // Tenant may come from $user->tenants()->first() which only selects id, name, slug;
        // getDefaultLandingPath() needs the data column (VirtualColumn). Refetch if needed.
        $tenantWithData = $tenant->getAttribute('data') !== null
            ? $tenant
            : Tenant::find($tenant->id);
        $path = $tenantWithData->getDefaultLandingPath();
        return '/' . trim($tenant->slug . '/' . $path, '/');
    }
}
