<?php

declare(strict_types=1);

namespace Modules\Cortex\Neuron\Output;

use NeuronAI\StructuredOutput\SchemaProperty;

final class PulseDigestOutput
{
    #[SchemaProperty(required: true, description: 'One or two sentences summarizing cross-feed themes for today.')]
    public string $intro_summary;

    /**
     * @var list<PulseDigestIdeaItem>
     */
    #[SchemaProperty(
        required: true,
        description: '5–8 tweet-sized ideas (sharp hooks, timely angles).',
        anyOf: [PulseDigestIdeaItem::class],
    )]
    public array $tweets;

    /**
     * @var list<PulseDigestIdeaItem>
     */
    #[SchemaProperty(
        required: true,
        description: '4–6 YouTube Shorts concepts (vertical, fast payoff).',
        anyOf: [PulseDigestIdeaItem::class],
    )]
    public array $shorts;

    /**
     * @var list<PulseDigestIdeaItem>
     */
    #[SchemaProperty(
        required: true,
        description: '3–5 full YouTube long-form video ideas (title-level + hook + suggested structure).',
        anyOf: [PulseDigestIdeaItem::class],
    )]
    public array $youtube;
}
