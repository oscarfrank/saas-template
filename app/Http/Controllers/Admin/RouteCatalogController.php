<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Attributes\RouteCatalogEntry;
use App\Http\Controllers\Controller;
use App\Services\RouteCatalogBuilder;
use Inertia\Inertia;
use Inertia\Response;

final class RouteCatalogController extends Controller
{
    #[RouteCatalogEntry(
        title: 'Route catalog',
        description: 'Browse every registered application route, methods, middleware, and optional code-first docs.'
    )]
    public function index(): Response
    {
        $user = auth()->user();
        if (! $user || (! $user->hasRole('superadmin') && ! $user->hasRole('super-admin'))) {
            abort(403, 'Only super administrators can view the route catalog.');
        }

        $routes = RouteCatalogBuilder::collect();
        $documented = count(array_filter($routes, fn (array $r) => $r['documented']));
        $byArea = ['app' => 0, 'admin' => 0, 'tenant' => 0];
        foreach ($routes as $r) {
            $byArea[$r['area']] = ($byArea[$r['area']] ?? 0) + 1;
        }

        return Inertia::render('admin/route-catalog/index', [
            'routes' => $routes,
            'stats' => [
                'total' => count($routes),
                'documented' => $documented,
                'undocumented' => count($routes) - $documented,
                'by_area' => $byArea,
            ],
        ]);
    }
}
