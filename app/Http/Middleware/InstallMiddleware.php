<?php

namespace App\Http\Middleware;

use App\Install\InstallChecker;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InstallMiddleware
{
    /**
     * Allow these paths when not installed (install wizard and assets).
     */
    protected function installPaths(): array
    {
        return ['install', 'install/*'];
    }

    /**
     * Allow asset and debug paths so install wizard page can load.
     */
    protected function allowedPathsWhenNotInstalled(Request $request): bool
    {
        $path = $request->path();
        if ($path === '') {
            return false;
        }
        if (str_starts_with($path, 'install')) {
            return true;
        }
        // Vite / build assets
        if (str_starts_with($path, 'build/') || str_starts_with($path, 'assets/')) {
            return true;
        }
        if (str_starts_with($path, '_debugbar')) {
            return true;
        }
        if (str_starts_with($path, 'storage/')) {
            return true;
        }
        return false;
    }

    public function handle(Request $request, Closure $next): Response
    {
        $installed = InstallChecker::isInstalled();

        if (! $installed) {
            if (! $this->allowedPathsWhenNotInstalled($request)) {
                return redirect()->to('/install');
            }
            return $next($request);
        }

        // Installed: block access to install wizard
        if ($request->is('install') || $request->is('install/*')) {
            return redirect()->to('/');
        }

        return $next($request);
    }
}
