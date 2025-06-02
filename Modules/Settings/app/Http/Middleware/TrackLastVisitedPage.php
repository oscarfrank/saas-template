<?php

namespace Modules\Settings\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrackLastVisitedPage
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {

        $response = $next($request);

        if ($request->user() && $request->isMethod('GET')) {
            $path = $request->path();
            
            // Don't track certain paths
            if (!str_starts_with($path, 'api/') && 
                !str_starts_with($path, 'livewire/') && 
                !str_starts_with($path, '_debugbar/')) {
                
                \Log::info('Attempting to update last visited page', [
                    'user_id' => $request->user()->id,
                    'path' => $path,
                    'preferences_before' => $request->user()->getPreferences()->preferences
                ]);
                
                try {
                    $preferences = $request->user()->getPreferences();
                    $preferences->updateLastVisitedPage($path);
                    $preferences->save();
                    
                    \Log::info('Successfully updated last visited page', [
                        'user_id' => $request->user()->id,
                        'preferences_after' => $preferences->preferences
                    ]);
                } catch (\Exception $e) {
                    \Log::error('Failed to update last visited page', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            } else {
                \Log::info('Skipping last visited page update for excluded path', [
                    'path' => $path
                ]);
            }
        } else {
            \Log::info('Skipping last visited page update', [
                'has_user' => $request->user() ? true : false,
                'is_get' => $request->isMethod('GET')
            ]);
        }

        return $response;
    }
} 