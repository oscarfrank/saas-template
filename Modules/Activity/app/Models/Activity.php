<?php

namespace Modules\Activity\Models;

use Modules\Tenant\Models\Tenant;
use Modules\Activity\Services\ActivityCounterService;
use Spatie\Activitylog\Models\Activity as SpatieActivity;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Illuminate\Support\Facades\Log;

class Activity extends SpatieActivity
{
    use BelongsToTenant;

    // If you need a tenant_id for shared database approach
    protected $fillable = [
        'tenant_id',
        'user_id',
        'description',
        'log_name',
        'subject_type',
        'subject_id',
        'causer_type',
        'causer_id',
        'properties',
        'event',
        'batch_uuid',
    ];
    
    // Example: Add a tenant relationship
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
    

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($activity) {
            // For TenancyForLaravel package
            if (function_exists('tenant') && tenant()) {
                $activity->tenant_id = tenant()->id;
            }
            
            // Set user_id from causer if it's a User model
            if ($activity->causer_type === 'Modules\\User\\Models\\User') {
                $activity->user_id = $activity->causer_id;
            } else if (auth()->check()) {
                // Fallback to authenticated user if causer is not a User
                $activity->user_id = auth()->id();
            }
        });

        static::created(function ($activity) {
            try {
                Log::info('Activity created', [
                    'activity_id' => $activity->id,
                    'description' => $activity->description,
                    'subject_type' => $activity->subject_type,
                    'subject_id' => $activity->subject_id,
                    'causer_type' => $activity->causer_type,
                    'causer_id' => $activity->causer_id,
                    'properties' => $activity->properties,
                    'tenant_id' => $activity->tenant_id
                ]);

                // Get the affected user ID from various possible sources
                $affectedUserId = null;

                // 1. Check properties for affected_user_id
                if (isset($activity->properties['affected_user_id'])) {
                    $affectedUserId = $activity->properties['affected_user_id'];
                    Log::info('Found affected user in properties', ['user_id' => $affectedUserId]);
                }
                // 2. Check if subject is a User
                else if ($activity->subject_type === 'Modules\\User\\Models\\User') {
                    $affectedUserId = $activity->subject_id;
                    Log::info('Found affected user in subject', ['user_id' => $affectedUserId]);
                }
                // 3. Check if causer is not the same as the user_id
                else if ($activity->causer_type === 'Modules\\User\\Models\\User' && 
                        $activity->causer_id !== $activity->user_id) {
                    $affectedUserId = $activity->user_id;
                    Log::info('Found affected user in causer', ['user_id' => $affectedUserId]);
                }
                // 4. For loan-related activities, check if there's a user_id in properties
                else if (str_contains(strtolower($activity->description), 'loan')) {
                    // Try to find user_id in properties
                    if (isset($activity->properties['user_id'])) {
                        $affectedUserId = $activity->properties['user_id'];
                        Log::info('Found affected user in loan properties', ['user_id' => $affectedUserId]);
                    }
                    // If no user_id in properties, use the causer_id if it's a user
                    else if ($activity->causer_type === 'Modules\\User\\Models\\User') {
                        $affectedUserId = $activity->causer_id;
                        Log::info('Using causer as affected user for loan activity', ['user_id' => $affectedUserId]);
                    }
                }

                // Only increment if we found an affected user and have a tenant
                if ($affectedUserId && $activity->tenant_id) {
                    Log::info('Incrementing counter', [
                        'tenant_id' => $activity->tenant_id,
                        'user_id' => $affectedUserId,
                        'activity_id' => $activity->id
                    ]);
                    
                    app(ActivityCounterService::class)->incrementCounter(
                        $activity->tenant_id,
                        $affectedUserId
                    );
                } else {
                    Log::info('Skipping counter increment', [
                        'activity_id' => $activity->id,
                        'has_affected_user' => (bool)$affectedUserId,
                        'has_tenant' => (bool)$activity->tenant_id,
                        'description' => $activity->description,
                        'properties' => $activity->properties
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Error in activity counter increment', [
                    'error' => $e->getMessage(),
                    'activity_id' => $activity->id,
                    'trace' => $e->getTraceAsString()
                ]);
            }
        });
    }
}