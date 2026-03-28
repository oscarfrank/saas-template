<?php

declare(strict_types=1);

namespace App\Services\AiUsage;

use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Route;

/**
 * Optional explicit label for AI usage logs (otherwise the current route name is used).
 */
final class AiCallContext
{
    public const SOURCE_KEY = 'ai_call.source';

    public static function setSource(?string $source): void
    {
        if ($source === null || $source === '') {
            Context::forget(self::SOURCE_KEY);

            return;
        }

        Context::add(self::SOURCE_KEY, $source);
    }

    public static function resolveSource(): string
    {
        $explicit = Context::get(self::SOURCE_KEY);
        if (is_string($explicit) && $explicit !== '') {
            return $explicit;
        }

        $route = Route::currentRouteName();
        if (is_string($route) && $route !== '') {
            return $route;
        }

        if (app()->runningInConsole()) {
            return 'cli';
        }

        return 'unknown';
    }

    public static function invocationKind(): string
    {
        return app()->runningInConsole() ? 'cli' : 'http';
    }
}
