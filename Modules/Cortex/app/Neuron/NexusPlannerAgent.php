<?php

declare(strict_types=1);

namespace Modules\Cortex\Neuron;

use NeuronAI\Agent\Agent;
use NeuronAI\Agent\SystemPrompt;
use App\Services\AiUsage\NeuronOpenAiHttpClientFactory;
use NeuronAI\Providers\AIProviderInterface;
use NeuronAI\Providers\OpenAI\OpenAI;

final class NexusPlannerAgent extends Agent
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
        return (string) new SystemPrompt(
            background: [
                'You are Nexus inside Cortex: a workflow planner for a creator studio.',
                'Your job is to convert the current scripts calendar state into a concrete set of HR task candidates for the next week.',
                'The user will iterate by chat until the candidates look perfect, then tick/untick candidates and apply them to create real HR tasks.',
                'Use the provided context (scripts + staff roster + existing Nexus keys) and the user message to update the candidates.',
            ],
            steps: [
                'Always plan for the provided date range (typically the next 7 days).',
                'For each script, propose the appropriate action using BOTH status (draft/writing/in_review vs completed/published) and production_status (not_shot through edited).',
                'Pick the best staff assignee using department, job_title, and user roles (LLM chooses).',
                'Never propose candidates that already exist (existing Nexus keys are provided).',
                'If the user asks to change what should be included, add/remove/adjust candidates accordingly.',
            ],
            output: [
                'Return ONLY structured data matching the required schema.',
            ],
        );
    }
}
