<?php

declare(strict_types=1);

namespace Modules\OrgMcp\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\OrgMcp\Services\OrgMcpAuthService;
use Symfony\Component\HttpFoundation\Response;

class EnsureValidOrgMcpSession
{
    public function __construct(
        private readonly OrgMcpAuthService $authService,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $session = $this->authService->resolveSessionFromBearer($request->bearerToken());

        if ($session === null) {
            return new JsonResponse([
                'message' => 'Invalid or expired MCP session token.',
            ], 401);
        }

        $request->attributes->set('org_mcp_session', $session);

        return $next($request);
    }
}
