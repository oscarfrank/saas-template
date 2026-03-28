<?php

declare(strict_types=1);

namespace App\Services;

use App\Attributes\RouteCatalogEntry;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Route as RouteFacade;
use ReflectionMethod;
use Throwable;

final class RouteCatalogBuilder
{
    /**
     * @return list<array{
     *   methods: list<string>,
     *   uri: string,
     *   name: string|null,
     *   action: string,
     *   middleware: list<string>,
     *   area: string,
     *   title: string|null,
     *   description: string|null,
     *   documented: bool
     * }>
     */
    public static function collect(): array
    {
        $excludeUri = config('route-catalog.exclude_uri_prefixes', []);
        $excludeNamePrefixes = config('route-catalog.exclude_name_prefixes', []);

        $rows = [];

        foreach (RouteFacade::getRoutes() as $route) {
            if (! $route instanceof Route) {
                continue;
            }

            $uri = $route->uri();
            if ($uri === '') {
                $uri = '/';
            }

            if (self::uriExcluded($uri, $excludeUri)) {
                continue;
            }

            $name = $route->getName();
            if ($name !== null && self::nameExcluded($name, $excludeNamePrefixes)) {
                continue;
            }

            $methods = array_values(array_filter($route->methods(), fn (string $m) => $m !== 'HEAD'));
            if ($methods === []) {
                continue;
            }

            $middleware = array_values($route->gatherMiddleware());
            $actionLabel = self::actionLabel($route);
            [$title, $description, $documented] = self::readCatalogAttribute($route);

            $rows[] = [
                'methods' => $methods,
                'uri' => $uri,
                'name' => $name,
                'action' => $actionLabel,
                'middleware' => $middleware,
                'area' => self::inferArea($uri),
                'title' => $title,
                'description' => $description,
                'documented' => $documented,
            ];
        }

        usort($rows, function (array $a, array $b): int {
            $area = strcmp($a['area'], $b['area']);
            if ($area !== 0) {
                return $area;
            }

            return strcmp($a['uri'], $b['uri']);
        });

        return $rows;
    }

    private static function uriExcluded(string $uri, array $prefixes): bool
    {
        foreach ($prefixes as $prefix) {
            if (str_starts_with($uri, $prefix)) {
                return true;
            }
        }

        return false;
    }

    private static function nameExcluded(string $name, array $prefixes): bool
    {
        foreach ($prefixes as $prefix) {
            if (str_starts_with($name, $prefix)) {
                return true;
            }
        }

        return false;
    }

    private static function inferArea(string $uri): string
    {
        if ($uri === 'admin' || str_starts_with($uri, 'admin/') || str_contains($uri, '/admin/')) {
            return 'admin';
        }
        if (str_starts_with($uri, '{tenant}') || str_contains($uri, '{tenant}/')) {
            return 'tenant';
        }

        return 'app';
    }

    private static function actionLabel(Route $route): string
    {
        $action = $route->getAction();
        if (isset($action['controller']) && $action['controller'] instanceof \Closure) {
            return 'Closure';
        }

        $uses = $action['controller'] ?? null;
        if (is_string($uses)) {
            return $uses;
        }
        if (is_array($uses) && count($uses) === 2 && is_string($uses[0]) && is_string($uses[1])) {
            return $uses[0].'@'.$uses[1];
        }

        return $route->getActionName() ?: '—';
    }

    /**
     * @return array{0: ?string, 1: ?string, 2: bool}
     */
    private static function readCatalogAttribute(Route $route): array
    {
        $ref = self::controllerMethodReflection($route);
        if (! $ref instanceof ReflectionMethod) {
            return [null, null, false];
        }

        foreach ($ref->getAttributes(RouteCatalogEntry::class) as $attr) {
            try {
                $instance = $attr->newInstance();
                if ($instance instanceof RouteCatalogEntry) {
                    return [
                        $instance->title,
                        $instance->description !== '' ? $instance->description : null,
                        true,
                    ];
                }
            } catch (Throwable) {
                return [null, null, false];
            }
        }

        return [null, null, false];
    }

    private static function controllerMethodReflection(Route $route): ?ReflectionMethod
    {
        $action = $route->getAction();
        if (isset($action['controller']) && $action['controller'] instanceof \Closure) {
            return null;
        }

        $uses = $action['controller'] ?? null;

        if (is_string($uses) && str_contains($uses, '@')) {
            [$class, $method] = explode('@', $uses, 2);
            if (class_exists($class) && method_exists($class, $method)) {
                return new ReflectionMethod($class, $method);
            }
        }

        if (is_array($uses) && count($uses) === 2) {
            [$class, $method] = $uses;
            if (is_string($class) && is_string($method) && class_exists($class) && method_exists($class, $method)) {
                return new ReflectionMethod($class, $method);
            }
        }

        return null;
    }
}
