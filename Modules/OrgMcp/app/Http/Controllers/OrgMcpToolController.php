<?php

declare(strict_types=1);

namespace Modules\OrgMcp\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\OrgMcp\Models\OrgMcpClient;
use Modules\OrgMcp\Services\OrgMcpPolicyService;
use Modules\OrgMcp\Services\OrgMcpToolExecutionService;
use Modules\OrgMcp\Services\OrgMcpToolRegistryService;

class OrgMcpToolController extends Controller
{
    public function __construct(
        private readonly OrgMcpToolRegistryService $registryService,
        private readonly OrgMcpToolExecutionService $executionService,
        private readonly OrgMcpPolicyService $policyService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $session = $request->attributes->get('org_mcp_session');
        if (! is_array($session)) {
            return response()->json(['message' => 'Missing MCP session context.'], 401);
        }

        $client = OrgMcpClient::query()
            ->whereKey((int) $session['client_id'])
            ->where('tenant_id', (string) $session['tenant_id'])
            ->where('is_active', true)
            ->first();

        if ($client === null) {
            return response()->json(['message' => 'MCP client is unavailable.'], 401);
        }

        $tools = collect($this->registryService->all())
            ->filter(function (array $tool) use ($client): bool {
                try {
                    $this->policyService->assertToolAllowed($client, (string) $tool['key']);
                    return true;
                } catch (\Throwable) {
                    return false;
                }
            })
            ->values()
            ->all();

        return response()->json([
            'tenant_id' => $session['tenant_id'],
            'tools' => $tools,
        ]);
    }

    public function invoke(Request $request): JsonResponse
    {
        $session = $request->attributes->get('org_mcp_session');
        if (! is_array($session)) {
            return response()->json(['message' => 'Missing MCP session context.'], 401);
        }

        $validated = $request->validate([
            'tool' => ['required', 'string', 'max:120'],
            'input' => ['nullable', 'array'],
        ]);

        $client = OrgMcpClient::query()
            ->whereKey((int) $session['client_id'])
            ->where('tenant_id', (string) $session['tenant_id'])
            ->where('is_active', true)
            ->first();

        if ($client === null) {
            return response()->json(['message' => 'MCP client is unavailable.'], 401);
        }

        $result = $this->executionService->execute(
            $client,
            (string) $session['tenant_id'],
            isset($session['profile_user_id']) ? (int) $session['profile_user_id'] : null,
            (string) $validated['tool'],
            is_array($validated['input'] ?? null) ? $validated['input'] : []
        );

        return response()->json($result);
    }
}
