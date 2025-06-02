<?php

namespace Modules\Settings\Traits;

use Illuminate\Support\Facades\Session;

trait HasTenancyPreferences
{
    /**
     * Get the current tenant ID from session or preferences.
     */
    public function getCurrentTenantId(): ?int
    {
        // First try to get from session (current active tenant)
        $sessionTenantId = Session::get('current_tenant_id');
        if ($sessionTenantId) {
            return $sessionTenantId;
        }

        // If not in session, try to get from preferences
        $preferenceTenantId = $this->getPreferences()->getLastTenantId();
        if ($preferenceTenantId) {
            // Set it in session for future requests
            Session::put('current_tenant_id', $preferenceTenantId);
            return $preferenceTenantId;
        }

        // If user has a default tenant, use that
        if ($this->tenant) {
            $tenantId = $this->tenant->id;
            Session::put('current_tenant_id', $tenantId);
            return $tenantId;
        }

        return null;
    }

    /**
     * Switch to a different tenant.
     */
    public function switchTenant(int $tenantId): bool
    {
        // Check if user has access to this tenant
        if (!$this->tenants()->where('tenants.id', $tenantId)->exists()) {
            return false;
        }

        // Update session
        Session::put('current_tenant_id', $tenantId);

        // Update preferences
        $this->getPreferences()
            ->updateLastTenantId($tenantId)
            ->save();

        return true;
    }

    /**
     * Get the current tenant.
     */
    public function getCurrentTenant()
    {
        $tenantId = $this->getCurrentTenantId();
        if (!$tenantId) {
            return null;
        }

        return $this->tenants()->where('tenants.id', $tenantId)->first();
    }
} 