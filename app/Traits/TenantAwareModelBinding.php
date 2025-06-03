<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use Stancl\Tenancy\Middleware\InitializeTenancyByPath;

trait TenantAwareModelBinding
{
    /**
     * Resolve the model binding for the route.
     *
     * @param  mixed  $value
     * @param  string|null  $field
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function resolveRouteBinding($value, $field = null)
    {
        $model = parent::resolveRouteBinding($value, $field);

        if ($model && $this->shouldCheckTenant()) {
            // Get the current tenant ID from the route parameter
            $currentTenantId = Route::current()->parameter('tenant');
            
            // Log for debugging
            Log::debug('Tenant check', [
                'model_tenant_id' => $model->tenant_id,
                'current_tenant_id' => $currentTenantId,
                'tenant_id' => tenant('id')
            ]);

            // Check if the model belongs to the current tenant
            if ($model->tenant_id !== $currentTenantId) {
                abort(404);
            }
        }

        return $model;
    }

    /**
     * Determine if tenant check should be performed.
     *
     * @return bool
     */
    protected function shouldCheckTenant(): bool
    {
        // Only check tenant if we're in a tenant context
        return Route::current() && 
               in_array(InitializeTenancyByPath::class, Route::current()->middleware());
    }
} 