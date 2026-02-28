<?php

declare(strict_types=1);

use Stancl\Tenancy\Middleware\InitializeTenancyByPath;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

return [
    'tenant_model' => \App\Models\Tenant::class,

    'id_generator' => Stancl\Tenancy\UUIDGenerator::class,

    // 'domain_model' => Stancl\Tenancy\Database\Models\Domain::class,

    'storage_driver' => 'db',

    'storage' => [
        'db' => [
            'table_names' => [
                'tenants' => 'tenants',
                'domains' => 'domains',
            ],
        ],
    ],

    'identification_strategies' => [
        Stancl\Tenancy\IdentificationStrategies\PathIdentification::class,
    ],

    /**
     * Domains that host the "central" app. PreventAccessFromCentralDomains blocks tenant routes when request host is in this list.
     * With path-based tenancy (same domain for central and tenant, e.g. /org/...), leave empty so tenant routes work for guests on any host.
     */
    'central_domains' => [],

    'middleware_groups' => [
        'web' => [
            InitializeTenancyByPath::class,
            PreventAccessFromCentralDomains::class,
        ],
        'api' => [
            InitializeTenancyByPath::class,
            PreventAccessFromCentralDomains::class,
        ],
    ],

    'routes_file' => base_path('routes/tenants.php'),

    'exempt_domains' => [
        'localhost',
        '127.0.0.1',
    ],

    'database' => [
        'central_connection' => env('DB_CONNECTION', 'mysql'),
        'template_tenant_connection' => null,
        'prefix' => '',
        'suffix' => '',
        'managers' => [
            'sqlite' => Stancl\Tenancy\TenantDatabaseManagers\SQLiteDatabaseManager::class,
            'mysql' => Stancl\Tenancy\TenantDatabaseManagers\MySQLDatabaseManager::class,
            'pgsql' => Stancl\Tenancy\TenantDatabaseManagers\PostgreSQLDatabaseManager::class,
        ],
    ],

    'cache' => [
        'tag_base' => 'tenant',
    ],

    'filesystem' => [
        'suffix_base' => 'tenant',
        'suffix_storage_path' => null,
        'disks' => [
            'local',
            'public',
        ],
    ],

    'redis' => [
        'tag_base' => 'tenant',
    ],

    'bootstrappers' => [
        Stancl\Tenancy\Bootstrappers\DatabaseTenancyBootstrapper::class,
        Stancl\Tenancy\Bootstrappers\CacheTenancyBootstrapper::class,
        Stancl\Tenancy\Bootstrappers\FilesystemTenancyBootstrapper::class,
        Stancl\Tenancy\Bootstrappers\QueueTenancyBootstrapper::class,
    ],

    'features' => [
        // Stancl\Tenancy\Features\TelescopeTags::class,
        // Stancl\Tenancy\Features\UniversalRoutes::class,
        // Stancl\Tenancy\Features\TenantConfig::class,
        // Stancl\Tenancy\Features\TemporaryTenant::class,
    ],

    'path_identification' => [
        'parameter' => 'tenant',
        'exclude' => [
            '/',
            '/admin/*',
            '/_debugbar/*',
            '/script/shared/*',
        ],
    ],
];
