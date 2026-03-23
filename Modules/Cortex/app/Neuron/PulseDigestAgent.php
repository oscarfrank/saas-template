<?php

declare(strict_types=1);

namespace Modules\Cortex\Neuron;

use NeuronAI\Agent\Agent;
use NeuronAI\Agent\SystemPrompt;
use NeuronAI\HttpClient\GuzzleHttpClient;
use NeuronAI\Providers\AIProviderInterface;
use NeuronAI\Providers\OpenAI\OpenAI;

final class PulseDigestAgent extends Agent
{
    protected function provider(): AIProviderInterface
    {
        $key = config('openai.api_key');
        $model = config('openai.chat_model', 'gpt-4o-mini');
        $timeout = (float) config('openai.request_timeout', 180);

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
                'You are Pulse Digest inside Cortex: turn cached RSS/Atom headlines into actionable creator ideas.',
                'You receive a block of feed signals (titles, links, summaries). Synthesize patterns; do not invent facts not implied by the signals.',
                'Ideas must feel specific and timely—not generic listicles.',
            ],
            steps: [
                'Read all feed sections and note recurring themes, outliers, and contrarian angles.',
                'Produce distinct ideas for three formats: Twitter/X posts, YouTube Shorts, and long-form YouTube.',
                'Tweets: punchy hooks; Shorts: vertical-native beats; Long-form: clear title + hook + implied structure.',
            ],
            output: [
                'Return ONLY structured data matching the schema.',
                'Fill intro_summary with a tight read on what matters today across feeds.',
            ],
        );
    }
}
