<?php

declare(strict_types=1);

namespace Modules\Cortex\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Modules\Cortex\Models\CortexAgentLlmSetting;
use Modules\Cortex\Services\CortexLlmProviderFactory;
use Modules\Cortex\Support\CortexAgentKey;
use Modules\Cortex\Support\CortexLlmModelCatalog;
use Modules\Cortex\Support\CortexLlmProvider;

class CortexLlmSettingsController extends Controller
{
    public function __construct(
        private readonly CortexLlmProviderFactory $llmFactory,
    ) {}

    public function update(Request $request): JsonResponse
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        $validated = $request->validate([
            'agent_key' => ['required', 'string', Rule::enum(CortexAgentKey::class)],
            'llm_provider' => ['required', 'string', Rule::enum(CortexLlmProvider::class)],
            'chat_model' => ['nullable', 'string', 'max:128'],
        ]);

        /** @var CortexAgentKey $agentKeyEnum */
        $agentKeyEnum = CortexAgentKey::from($validated['agent_key']);
        /** @var CortexLlmProvider $providerEnum */
        $providerEnum = CortexLlmProvider::from($validated['llm_provider']);

        $chatModel = isset($validated['chat_model']) ? trim((string) $validated['chat_model']) : '';
        $chatModel = $chatModel === '' ? null : $chatModel;

        $existing = CortexAgentLlmSetting::query()
            ->where('tenant_id', $tenantId)
            ->where('agent_key', $agentKeyEnum->value)
            ->first();

        $allowed = CortexLlmModelCatalog::allowedIdsFor($providerEnum);
        if (
            $existing
            && $existing->llm_provider === $providerEnum
            && is_string($existing->chat_model)
            && $existing->chat_model !== ''
        ) {
            $allowed[] = $existing->chat_model;
        }
        $allowed = array_values(array_unique($allowed));

        if ($chatModel !== null && ! in_array($chatModel, $allowed, true)) {
            throw ValidationException::withMessages([
                'chat_model' => 'The selected model is not allowed for this provider.',
            ]);
        }

        CortexAgentLlmSetting::query()->updateOrCreate(
            [
                'tenant_id' => $tenantId,
                'agent_key' => $agentKeyEnum->value,
            ],
            [
                'llm_provider' => $providerEnum,
                'chat_model' => $chatModel,
            ],
        );

        $props = CortexAgentLlmSetting::inertiaPropsFor(
            $tenantId,
            $agentKeyEnum,
            $this->llmFactory->isOpenAiKeyConfigured(),
            $this->llmFactory->isAnthropicKeyConfigured(),
        );

        return response()->json([
            'message' => 'Saved.',
            'llm' => $props,
            'openAiConfigured' => $props['llm_ready'],
        ]);
    }

    /**
     * Apply the same LLM provider and optional model override to every Cortex agent for this tenant.
     */
    public function bulkReset(Request $request): JsonResponse
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        $validated = $request->validate([
            'llm_provider' => ['required', 'string', Rule::enum(CortexLlmProvider::class)],
            'chat_model' => ['nullable', 'string', 'max:128'],
        ]);

        /** @var CortexLlmProvider $providerEnum */
        $providerEnum = CortexLlmProvider::from($validated['llm_provider']);

        $chatModel = isset($validated['chat_model']) ? trim((string) $validated['chat_model']) : '';
        $chatModel = $chatModel === '' ? null : $chatModel;

        $allowedBulk = CortexLlmModelCatalog::allowedIdsFor($providerEnum);
        if ($chatModel !== null && ! in_array($chatModel, $allowedBulk, true)) {
            throw ValidationException::withMessages([
                'chat_model' => 'The selected model is not allowed for this provider.',
            ]);
        }

        $count = 0;

        DB::transaction(function () use ($tenantId, $providerEnum, $chatModel, &$count): void {
            foreach (CortexAgentKey::cases() as $agentKey) {
                CortexAgentLlmSetting::query()->updateOrCreate(
                    [
                        'tenant_id' => $tenantId,
                        'agent_key' => $agentKey->value,
                    ],
                    [
                        'llm_provider' => $providerEnum,
                        'chat_model' => $chatModel,
                    ],
                );
                $count++;
            }
        });

        return response()->json([
            'message' => 'All '.$count.' agents now use the selected API and model.',
            'agents_updated' => $count,
        ]);
    }
}
