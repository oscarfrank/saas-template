<?php

declare(strict_types=1);

namespace Modules\Cortex\Neuron;

use NeuronAI\Agent\Agent;
use App\Services\AiUsage\NeuronOpenAiHttpClientFactory;
use NeuronAI\Providers\AIProviderInterface;
use NeuronAI\Providers\OpenAI\OpenAI;

/**
 * Script writer for the creator’s voice. The system prompt is supplied at runtime
 * via {@see Agent::setInstructions()} from {@see \App\Services\TenantAiPromptResolver} (key cortex.quill).
 */
final class QuillAgent extends Agent
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
        return 'Set the cortex.quill system prompt in Organization Settings → AI prompts. The Quill controller replaces this at runtime.';
    }
}
