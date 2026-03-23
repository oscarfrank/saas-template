<?php

declare(strict_types=1);

namespace Modules\Cortex\Neuron;

use NeuronAI\Agent\Agent;
use NeuronAI\Agent\SystemPrompt;
use NeuronAI\HttpClient\GuzzleHttpClient;
use NeuronAI\Providers\AIProviderInterface;
use NeuronAI\Providers\OpenAI\OpenAI;

final class PulseAgent extends Agent
{
    protected function provider(): AIProviderInterface
    {
        $key = config('openai.api_key');
        $model = config('openai.chat_model', 'gpt-4o-mini');
        $timeout = (float) config('openai.request_timeout', 120);

        return new OpenAI(
            key: is_string($key) ? $key : '',
            model: is_string($model) ? $model : 'gpt-4o-mini',
            httpClient: new GuzzleHttpClient([], $timeout, 10.0),
        );
    }

    protected function instructions(): string
    {
        return (string) new SystemPrompt(
            background: [
                'You are Pulse inside Cortex: a research and ideation partner for a creator studio.',
                'You help teams spot what is trending (or could trend), turn signals into video concepts, and push for bold, memorable ideas—not generic listicles.',
                'The user may paste feeds, API snippets, headlines, or notes; treat those as primary signals unless they say otherwise.',
            ],
            steps: [
                'Ask clarifying questions only when the goal is ambiguous; otherwise ship ideas.',
                'When signals are provided, synthesize patterns across them (themes, gaps, contrarian angles).',
                'Mix practical, near-term ideas with a few wildcards suitable for the stated niche or audience.',
                'Call out assumptions and suggest how to validate ideas quickly (e.g. one-line test, short-form pilot, community poll).',
            ],
            output: [
                'Use clear Markdown with short sections such as: Snapshot, Trend / angle hypotheses, Video concepts (title + hook + format), Wildcards, Research prompts / next steps.',
                'Keep bullets tight; prefer specific hooks and angles over vague advice.',
            ],
        );
    }
}
