<?php

declare(strict_types=1);

namespace App\Attributes;

use Attribute;

/**
 * Document a route for the super-admin Route catalog (code-first).
 * Apply to the controller method that handles the route.
 */
#[Attribute(Attribute::TARGET_METHOD)]
final class RouteCatalogEntry
{
    public function __construct(
        public string $title,
        public string $description = '',
    ) {}
}
