<?php

namespace Modules\Cortex\Neuron\Tools;

use Modules\Cortex\Services\YoutubeTranscriptService;
use NeuronAI\Tools\PropertyType;
use NeuronAI\Tools\Tool;
use NeuronAI\Tools\ToolProperty;

final class FetchYoutubeTranscriptTool extends Tool
{
    public function __construct()
    {
        parent::__construct(
            name: 'fetch_youtube_transcript',
            description: 'Load the caption transcript for a YouTube video. Pass a full watch URL (youtube.com/watch?v=… or youtu.be/…) or an 11-character video ID. Returns title and transcript text when captions exist.',
        );
    }

    /**
     * @return ToolProperty[]
     */
    protected function properties(): array
    {
        return [
            ToolProperty::make(
                name: 'youtube_url',
                type: PropertyType::STRING,
                description: 'YouTube video URL or raw 11-character video ID.',
            ),
        ];
    }

    public function __invoke(string $youtube_url): string
    {
        $service = app(YoutubeTranscriptService::class);
        $result = $service->fetchTranscript($youtube_url);

        if (! $result['success']) {
            return 'Error: '.$result['error'];
        }

        $note = $result['truncated'] ? "\n\n[Note: transcript was truncated for length.]" : '';

        return 'Title: '.$result['title']."\n\nTranscript:\n".$result['text'].$note;
    }
}
