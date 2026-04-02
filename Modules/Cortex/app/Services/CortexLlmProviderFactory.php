<?php

declare(strict_types=1);

namespace Modules\Cortex\Services;

use App\Services\AiUsage\NeuronOpenAiHttpClientFactory;
use Modules\Cortex\Models\CortexAgentLlmSetting;
use Modules\Cortex\Support\CortexAgentKey;
use Modules\Cortex\Support\CortexLlmProvider;
use NeuronAI\Providers\AIProviderInterface;
use NeuronAI\Providers\Anthropic\Anthropic;
use NeuronAI\Providers\OpenAI\OpenAI;

final class CortexLlmProviderFactory
{
    public function isOpenAiKeyConfigured(): bool
    {
        $key = config('openai.api_key');

        return is_string($key) && $key !== '';
    }

    public function isAnthropicKeyConfigured(): bool
    {
        $key = config('anthropic.api_key');

        return is_string($key) && $key !== '';
    }

    /**
     * True when the env has the API key required for this tenant's chosen provider for the agent.
     */
    public function isTenantAgentConfigured(string $tenantId, CortexAgentKey|string $agentKey): bool
    {
        $provider = CortexAgentLlmSetting::resolvedProviderFor($tenantId, $agentKey);

        return match ($provider) {
            CortexLlmProvider::OpenAI => $this->isOpenAiKeyConfigured(),
            CortexLlmProvider::Anthropic => $this->isAnthropicKeyConfigured(),
        };
    }

    /**
     * @param  array<string, mixed>  $extraParameters  Merged into provider request bodies (e.g. temperature).
     */
    public function makeForTenantAgent(
        string $tenantId,
        CortexAgentKey|string $agentKey,
        array $extraParameters = [],
    ): AIProviderInterface {
        $key = $agentKey instanceof CortexAgentKey ? $agentKey->value : $agentKey;

        $row = CortexAgentLlmSetting::query()
            ->where('tenant_id', $tenantId)
            ->where('agent_key', $key)
            ->first();

        $provider = $row?->llm_provider ?? CortexLlmProvider::OpenAI;
        $modelOverride = $row !== null && is_string($row->chat_model) && $row->chat_model !== ''
            ? $row->chat_model
            : null;

        $timeout = (float) config('openai.request_timeout', 120);

        return match ($provider) {
            CortexLlmProvider::OpenAI => $this->makeOpenAi($modelOverride, $extraParameters, $timeout),
            CortexLlmProvider::Anthropic => $this->makeAnthropic($modelOverride, $extraParameters, $timeout),
        };
    }

    /**
     * @param  array<string, mixed>  $extraParameters
     */
    private function makeOpenAi(?string $modelOverride, array $extraParameters, float $timeout): OpenAI
    {
        $apiKey = config('openai.api_key');
        $model = $modelOverride ?? (string) config('openai.chat_model', 'gpt-4o-mini');

        return new OpenAI(
            key: is_string($apiKey) ? $apiKey : '',
            model: $model,
            parameters: $extraParameters,
            httpClient: NeuronOpenAiHttpClientFactory::make($timeout),
        );
    }

    /**
     * @param  array<string, mixed>  $extraParameters
     */
    private function makeAnthropic(?string $modelOverride, array $extraParameters, float $timeout): Anthropic
    {
        $apiKey = config('anthropic.api_key');
        $model = $modelOverride ?? (string) config('anthropic.chat_model', 'claude-sonnet-4-20250514');
        $anthropicTimeout = (float) config('anthropic.request_timeout', $timeout);

        return new Anthropic(
            key: is_string($apiKey) ? $apiKey : '',
            model: $model,
            parameters: $extraParameters,
            httpClient: NeuronOpenAiHttpClientFactory::make($anthropicTimeout),
        );
    }
}
