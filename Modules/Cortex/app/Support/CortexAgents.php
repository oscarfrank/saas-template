<?php

namespace Modules\Cortex\Support;

final class CortexAgents
{
    /**
     * Registry of Cortex agents for the UI (directory / detail routes).
     *
     * @return list<array{id: string, name: string, description: string, route: string}>
     */
    public static function definitions(): array
    {
        return [
            [
                'id' => 'youtube-video',
                'name' => 'YouTube video analyst',
                'description' => 'Pulls captions for a video and suggests summary, themes, and concrete improvements for retention and packaging.',
                'route' => 'cortex.agents.youtube',
            ],
            [
                'id' => 'youtube-doc',
                'name' => 'Youtube Doc',
                'description' => 'Connect YouTube Analytics via OAuth and chat about what’s working, what to improve, and what to test next.',
                'route' => 'cortex.agents.youtube_doc',
            ],
            [
                'id' => 'nexus-planner',
                'name' => 'Nexus planner',
                'description' => 'Plans the creator workflow (shoot/edit/publish) and proposes HR task candidates for the week.',
                'route' => 'cortex.agents.nexus',
            ],
            [
                'id' => 'pulse',
                'name' => 'Pulse',
                'description' => 'Ideation chat from your saved RSS feeds; manage sources on Pulse → Feeds, then brainstorm trends and angles here.',
                'route' => 'cortex.agents.pulse',
            ],
            [
                'id' => 'quill',
                'name' => 'Quill',
                'description' => 'Script writer in your voice: system prompt lives in Organization → AI prompts (cortex.quill).',
                'route' => 'cortex.agents.quill',
            ],
            [
                'id' => 'mirage',
                'name' => 'Mirage',
                'description' => 'Describe your video, choose how many thumbnails and what to show (face, product, scene), and get realistic thumbnail images.',
                'route' => 'cortex.agents.mirage',
            ],
        ];
    }
}
