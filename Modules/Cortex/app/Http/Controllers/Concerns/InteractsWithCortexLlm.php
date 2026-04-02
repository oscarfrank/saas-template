<?php

declare(strict_types=1);

namespace Modules\Cortex\Http\Controllers\Concerns;

use Modules\Cortex\Models\CortexAgentLlmSetting;
use Modules\Cortex\Services\CortexLlmProviderFactory;
use Modules\Cortex\Support\CortexAgentKey;
use Modules\Cortex\Support\CortexLlmModelCatalog;
use Modules\Cortex\Support\CortexLlmProvider;

trait InteractsWithCortexLlm
{
    protected function cortexLlmFactory(): CortexLlmProviderFactory
    {
        return app(CortexLlmProviderFactory::class);
    }

    /**
     * @return array{llm: array<string, mixed>, openAiConfigured: bool}
     */
    protected function cortexLlmPageProps(?string $tenantId, CortexAgentKey $agentKey): array
    {
        $factory = $this->cortexLlmFactory();
        $openaiOk = $factory->isOpenAiKeyConfigured();
        $anthropicOk = $factory->isAnthropicKeyConfigured();

        if (! is_string($tenantId) || $tenantId === '') {
            return [
                'llm' => [
                    'agent_key' => $agentKey->value,
                    'llm_provider' => 'openai',
                    'chat_model' => null,
                    'default_openai_model' => (string) config('openai.chat_model', 'gpt-4o-mini'),
                    'default_anthropic_model' => (string) config('anthropic.chat_model', 'claude-sonnet-4-20250514'),
                    'openai_key_configured' => $openaiOk,
                    'anthropic_key_configured' => $anthropicOk,
                    'llm_ready' => false,
                    'openai_model_options' => CortexLlmModelCatalog::optionsFor(CortexLlmProvider::OpenAI),
                    'anthropic_model_options' => CortexLlmModelCatalog::optionsFor(CortexLlmProvider::Anthropic),
                ],
                'openAiConfigured' => false,
            ];
        }

        $props = CortexAgentLlmSetting::inertiaPropsFor(
            $tenantId,
            $agentKey,
            $openaiOk,
            $anthropicOk,
        );

        return [
            'llm' => $props,
            'openAiConfigured' => $props['llm_ready'],
        ];
    }

    protected function cortexLlmConfigured(?string $tenantId, CortexAgentKey $agentKey): bool
    {
        if (! is_string($tenantId) || $tenantId === '') {
            return false;
        }

        return $this->cortexLlmFactory()->isTenantAgentConfigured($tenantId, $agentKey);
    }

    protected function cortexMissingLlmKeyMessage(string $tenantId, CortexAgentKey $agentKey): string
    {
        $provider = CortexAgentLlmSetting::resolvedProviderFor($tenantId, $agentKey);

        return $provider === CortexLlmProvider::Anthropic
            ? 'Anthropic is not configured. Add ANTHROPIC_API_KEY to your environment or switch this agent to OpenAI in Agent settings.'
            : 'OpenAI is not configured. Add OPENAI_API_KEY to your environment or switch this agent to Anthropic in Agent settings.';
    }

    /**
     * Use on agent main pages that only need the LLM readiness flag (no full llm payload).
     */
    protected function cortexOpenAiConfiguredProp(?string $tenantId, CortexAgentKey $agentKey): bool
    {
        return $this->cortexLlmPageProps($tenantId, $agentKey)['openAiConfigured'];
    }
}
