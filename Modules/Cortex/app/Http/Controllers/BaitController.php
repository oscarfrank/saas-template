<?php

declare(strict_types=1);

namespace Modules\Cortex\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Cortex\Http\Controllers\Concerns\InteractsWithCortexLlm;
use Modules\Cortex\Services\BaitTitleService;
use Modules\Cortex\Support\CortexAgentKey;

class BaitController extends Controller
{
    use InteractsWithCortexLlm;

    public function __construct(
        private readonly BaitTitleService $baitTitleService,
    ) {}

    public function index(): Response
    {
        /** @var array<string, mixed> $definitions */
        $definitions = config('ai_prompts.definitions', []);
        $meta = $definitions['cortex.bait'] ?? [];

        $tenantId = tenant('id');

        return Inertia::render('cortex/agents/bait', [
            'openAiConfigured' => $this->cortexOpenAiConfiguredProp(is_string($tenantId) ? $tenantId : null, CortexAgentKey::Bait),
            'promptKey' => 'cortex.bait',
            'promptLabel' => is_array($meta) ? (string) ($meta['label'] ?? 'Bait') : 'Bait',
            'promptDescription' => is_array($meta) ? (string) ($meta['description'] ?? '') : '',
        ]);
    }

    public function analyze(Request $request): JsonResponse
    {
        $this->raiseRuntimeLimitForAgent();

        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        if (! $this->cortexLlmConfigured($tenantId, CortexAgentKey::Bait)) {
            return response()->json([
                'message' => $this->cortexMissingLlmKeyMessage($tenantId, CortexAgentKey::Bait),
            ], 503);
        }

        $validated = $request->validate([
            'script' => ['required', 'string', 'max:120000'],
        ]);

        try {
            $result = $this->baitTitleService->analyzeScript(trim((string) $validated['script']), $tenantId);
            $analysis = $result['parsed'];

            if (! is_array($analysis)) {
                Log::warning('BaitController::analyze failed to parse JSON', [
                    'attempts' => $result['attempts'],
                ]);

                return response()->json([
                    'message' => 'Could not parse analysis JSON from the model after one retry. Please try again.',
                ], 422);
            }

            return response()->json([
                'analysis' => $analysis,
                'attempts' => $result['attempts'],
            ]);
        } catch (\Throwable $e) {
            Log::error('BaitController::analyze failed', [
                'error' => $e->getMessage(),
                'exception' => $e::class,
            ]);

            return response()->json([
                'message' => 'Bait analysis failed. Check logs or try again.',
            ], 500);
        }
    }

    public function generate(Request $request): JsonResponse
    {
        $this->raiseRuntimeLimitForAgent();

        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        if (! $this->cortexLlmConfigured($tenantId, CortexAgentKey::Bait)) {
            return response()->json([
                'message' => $this->cortexMissingLlmKeyMessage($tenantId, CortexAgentKey::Bait),
            ], 503);
        }

        $validated = $request->validate([
            'script' => ['required', 'string', 'max:120000'],
            'analysis' => ['required', 'array'],
            'framing_toggle' => ['nullable', 'string', 'in:None,Polarizing Take,Strong Opinion,Contrarian Framing'],
        ]);

        $framingToggle = trim((string) ($validated['framing_toggle'] ?? ''));
        if ($framingToggle === '') {
            $framingToggle = 'None';
        }

        try {
            $output = $this->baitTitleService->generateTitles(
                trim((string) $validated['script']),
                $validated['analysis'],
                $framingToggle,
                $tenantId
            );

            if ($output === '') {
                return response()->json(['message' => 'Bait returned an empty response. Try again.'], 422);
            }

            return response()->json(['result' => $output]);
        } catch (\Throwable $e) {
            Log::error('BaitController::generate failed', [
                'error' => $e->getMessage(),
                'exception' => $e::class,
            ]);

            return response()->json([
                'message' => 'Bait title generation failed. Check logs or try again.',
            ], 500);
        }
    }

    private function raiseRuntimeLimitForAgent(): void
    {
        $seconds = (int) config('cortex.agent_max_execution_time', 300);
        set_time_limit($seconds > 0 ? $seconds : 0);
    }
}
