<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Modules\Settings\Models\SiteSettings;
use Symfony\Component\HttpFoundation\Response;

class CheckMaintenanceMode
{
    /**
     * When maintenance mode is on:
     * - Block register (GET and POST); redirect to home.
     * - Guests can view the site (they see the maintenance homepage).
     * - Logged-in users who are not super-admin or admin are logged out and redirected to home.
     * - Super-admin and admin can use the site (so they can turn off maintenance in Settings).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $settings = SiteSettings::getSettings();
        if (empty($settings->maintenance_mode)) {
            return $next($request);
        }

        // Block registration during maintenance
        if ($request->is('register') || $request->routeIs('register')) {
            return redirect()->route('home')
                ->with('message', 'Site is under maintenance. Registration is temporarily disabled.');
        }

        // Guest: allow (they will see maintenance theme on homepage)
        if (! Auth::check()) {
            return $next($request);
        }

        // Logged-in: allow only super-admin or admin
        $user = Auth::user();
        if ($user->hasRole('super-admin') || $user->hasRole('admin')) {
            return $next($request);
        }

        // Non-admin during maintenance: logout and redirect to home
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home')
            ->with('message', 'Site is under maintenance. Only administrators can access the site.');
    }
}
