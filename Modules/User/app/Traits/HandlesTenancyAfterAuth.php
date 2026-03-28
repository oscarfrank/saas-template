<?php

namespace Modules\User\Traits;

use App\Models\Tenant;
use App\Services\LandingUrlService;
use Modules\User\Models\User;

trait HandlesTenancyAfterAuth
{
    /**
     * Handle tenancy after successful authentication
     */
    protected function handleTenancyAfterAuth(User $user)
    {
        // Get user preferences
        $preferences = $user->getPreferences();
        $lastTenantId = $preferences->getLastTenantId();

        // Check tenancy mode
        $tenancyMode = config('services.tenancy.mode', 'multi');

        if ($tenancyMode === 'single') {
            // Single tenancy mode
            $tenant = null;

            if ($lastTenantId) {
                $tenant = $user->tenants()->where('tenants.id', $lastTenantId)->first();
            }

            if (! $tenant) {
                $tenant = $user->tenants()->first();
            }

            // If still no tenant, create or get the 'home' tenant
            if (! $tenant) {
                $tenant = Tenant::where('slug', 'home')->first();

                if (! $tenant) {
                    // Create the home tenant
                    $tenant = Tenant::create([
                        'id' => 'home',
                        'name' => 'Home',
                        'slug' => 'home',
                        'created_by' => User::first()->id,
                        'data' => json_encode([]),
                    ]);

                    $tenant->users()->attach(1, ['role' => 'owner']);

                }

                // Add user to the tenant
                $tenant->users()->attach($user->id, ['role' => 'member']);
            }

            return $this->redirectToLanding($user, $tenant);
        } else {
            // Multi tenancy mode
            $tenant = null;

            // Prefer last active org from preferences (must still be a membership)
            if ($lastTenantId) {
                $tenant = $user->tenants()->where('tenants.id', $lastTenantId)->first();
            }

            if (! $tenant) {
                $tenant = $user->tenants()->first();
            }

            // If we have a tenant, redirect to landing (org default or last visited)
            if ($tenant) {
                return $this->redirectToLanding($user, $tenant);
            }

            // If no tenant is available, redirect to tenant creation
            return redirect()->route('tenants.create');
        }
    }

    /**
     * Redirect to the appropriate landing page: org default or last visited (per user preference).
     */
    protected function redirectToLanding(User $user, Tenant $tenant): \Illuminate\Http\RedirectResponse
    {
        $url = LandingUrlService::forUser($user, $tenant);

        return redirect()->to($url);
    }
}
