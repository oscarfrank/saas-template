<?php

declare(strict_types=1);

namespace Modules\OrgMcp\Providers;

use Illuminate\Routing\Router;
use Illuminate\Support\ServiceProvider;
use Modules\OrgMcp\Http\Middleware\EnsureValidOrgMcpSession;
use Modules\OrgMcp\Services\OrgMcpAuthService;
use Modules\OrgMcp\Services\OrgMcpPolicyService;
use Modules\OrgMcp\Services\OrgMcpToolExecutionService;
use Modules\OrgMcp\Services\OrgMcpToolRegistryService;
use Nwidart\Modules\Traits\PathNamespace;

class OrgMcpServiceProvider extends ServiceProvider
{
    use PathNamespace;

    protected string $name = 'OrgMcp';

    public function boot(): void
    {
        $this->loadMigrationsFrom(module_path($this->name, 'database/migrations'));
    }

    public function register(): void
    {
        $this->app->singleton(OrgMcpAuthService::class);
        $this->app->singleton(OrgMcpPolicyService::class);
        $this->app->singleton(OrgMcpToolRegistryService::class);
        $this->app->singleton(OrgMcpToolExecutionService::class);

        $this->app->register(RouteServiceProvider::class);

        $this->app->afterResolving(Router::class, function (Router $router): void {
            $router->aliasMiddleware('org-mcp.session', EnsureValidOrgMcpSession::class);
        });
    }
}
