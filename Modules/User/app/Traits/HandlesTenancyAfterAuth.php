<?php

namespace Modules\User\Traits;

use App\Models\Tenant;
use Modules\User\Models\User;
use Illuminate\Support\Facades\Log;

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
            
            // First check last tenant
            if ($lastTenantId) {
                $tenant = Tenant::where('id', $lastTenantId)->first();
            }
            
            // If no last tenant, check if user belongs to any tenant
            if (!$tenant) {
                $tenant = $user->tenants()->first();
            }
            
            // If still no tenant, create or get the 'home' tenant
            if (!$tenant) {
                $tenant = Tenant::where('slug', 'home')->first();
                
                if (!$tenant) {
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
            
            return redirect()->to("/{$tenant->slug}/dashboard");
        } else {
            // Multi tenancy mode
            $tenant = null;
            
            // First check last tenant
            if ($lastTenantId) {
                $tenant = Tenant::where('id', $lastTenantId)->first();
            }
            
            // If no last tenant, get first available tenant
            if (!$tenant) {
                $tenant = $user->tenants()->first();
            }
            
            // If we have a tenant, redirect to its dashboard
            if ($tenant) {
                return redirect()->to("/{$tenant->slug}/dashboard");
            }
            
            // If no tenant is available, redirect to tenant creation
            return redirect()->route('tenants.create');
        }
    }
} 