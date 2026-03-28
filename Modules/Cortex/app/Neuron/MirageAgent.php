<?php

declare(strict_types=1);

namespace Modules\Cortex\Neuron;

use NeuronAI\Agent\Agent;
use App\Services\AiUsage\NeuronOpenAiHttpClientFactory;
use NeuronAI\Providers\AIProviderInterface;
use NeuronAI\Providers\OpenAI\OpenAI;

/**
 * Title & thumbnail ideation. System prompt from {@see \App\Services\TenantAiPromptResolver} (cortex.mirage).
 */
final class MirageAgent extends Agent
{
    protected function provider(): AIProviderInterface
    {
        $key = config('openai.api_key');
        $model = config('openai.chat_model', 'gpt-4o-mini');

        return new OpenAI(
            key: is_string($key) ? $key : '',
            model: is_string($model) ? $model : 'gpt-4o-mini',
            httpClient: NeuronOpenAiHttpClientFactory::make(),
        );
    }

    protected function instructions(): string
    {
        return 'Set the cortex.mirage system prompt in Organization Settings → AI prompts. The Mirage controller replaces this at runtime.';
    }
}
