<?php

declare(strict_types=1);

namespace Modules\Cortex\Support;

/**
 * Keys must match {@see CortexAgents::definitions()} `id` values.
 */
enum CortexAgentKey: string
{
    case YoutubeVideo = 'youtube-video';
    case YoutubeDoc = 'youtube-doc';
    case NexusPlanner = 'nexus-planner';
    case Pulse = 'pulse';
    case Quill = 'quill';
    case Bait = 'bait';
    case Mirage = 'mirage';
}
