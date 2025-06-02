<?php

namespace Modules\Settings\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Modules\Activity\Services\ActivityCounterService;

class SharePreferences
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        \Log::info('SharePreferences middleware starting', [
            'path' => $request->path(),
            'has_user' => $request->user() ? true : false
        ]);

        if ($request->user()) {
            try {
                $preferences = $request->user()->getPreferences();
                $currentTenant = tenant('id');
                
                \Log::info('SharePreferences middleware processing', [
                    'user_id' => $request->user()->id,
                    'current_tenant' => $currentTenant
                ]);
                
                // Get notification count for current tenant
                $notificationCount = 0;
                if ($currentTenant) {
                    try {
                        $activityService = app(ActivityCounterService::class);
                        \Log::info('ActivityCounterService resolved', [
                            'service_class' => get_class($activityService)
                        ]);
                        
                        $notificationCount = $activityService->getUnreadCount(
                            $currentTenant,
                            $request->user()->id
                        );
                        
                        \Log::info('Notification count retrieved', [
                            'count' => $notificationCount,
                            'tenant_id' => $currentTenant,
                            'user_id' => $request->user()->id
                        ]);
                    } catch (\Exception $e) {
                        \Log::error('Error getting notification count', [
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                    }
                }
                
                // Share the current tenant, preferences, and notification count with Inertia
                Inertia::share([
                    'tenant' => $currentTenant,
                    'preferences' => [
                        'last_tenant_id' => $preferences->getLastTenantId(),
                        'last_visited_page' => $preferences->getLastVisitedPage(),
                    ],
                    'notifications' => [
                        'unread_count' => $notificationCount
                    ]
                ]);

                \Log::info('SharePreferences middleware completed', [
                    'user_id' => $request->user()->id,
                    'notification_count' => $notificationCount
                ]);
            } catch (\Exception $e) {
                \Log::error('Error in SharePreferences middleware', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }

        return $next($request);
    }
} 