<?php

namespace Modules\Cortex\Neuron;

use Modules\Cortex\Neuron\Tools\FetchYoutubeTranscriptTool;
use NeuronAI\Agent\Agent;
use NeuronAI\Agent\SystemPrompt;
use NeuronAI\HttpClient\GuzzleHttpClient;
use NeuronAI\Providers\AIProviderInterface;
use NeuronAI\Providers\OpenAI\OpenAI;
use NeuronAI\Tools\ToolInterface;

final class YouTubeVideoAgent extends Agent
{
    protected function provider(): AIProviderInterface
    {
        $key = config('openai.api_key');
        $model = config('openai.chat_model', 'gpt-4o-mini');
        $timeout = (float) config('openai.request_timeout', 120);

        $httpClient = new GuzzleHttpClient([], $timeout, 10.0);

        return new OpenAI(
            key: is_string($key) ? $key : '',
            model: is_string($model) ? $model : 'gpt-4o-mini',
            httpClient: $httpClient,
        );
    }

    protected function instructions(): string
    {
        return (string) new SystemPrompt(
            background: [
                'You are a YouTube strategist embedded in a business app (Cortex).',
                'You help creators improve packaging, retention, and clarity using what is actually said in the video (captions).',
            ],
            steps: [
                'When the user gives a video URL or ID, call fetch_youtube_transcript first so your advice is grounded in the real transcript.',
                'If the tool returns an error, explain it briefly and suggest what the user can do (e.g. pick another video, check captions).',
                'If there is no usable transcript, say so honestly and give only generic best-practice guidance, labeled as generic.',
            ],
            output: [
                'Use clear Markdown: short title line, then sections Summary, Themes & tone, Actionable improvements (numbered).',
                'Under Actionable improvements include specific references to moments or topics from the transcript when possible.',
                'Keep a practical, concise tone; avoid fluff.',
            ],
        );
    }

    /**
     * @return ToolInterface[]
     */
    protected function tools(): array
    {
        return [
            new FetchYoutubeTranscriptTool,
        ];
    }
}
