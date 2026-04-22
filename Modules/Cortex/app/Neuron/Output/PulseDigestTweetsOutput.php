<?php

declare(strict_types=1);

namespace Modules\Cortex\Neuron\Output;

use NeuronAI\StructuredOutput\SchemaProperty;

final class PulseDigestTweetsOutput
{
    /**
     * @var list<PulseDigestIdeaItem>
     */
    #[SchemaProperty(
        required: true,
        description: '5–8 tweet-sized ideas (sharp hooks, timely angles).',
        anyOf: [PulseDigestIdeaItem::class],
    )]
    public array $tweets;
}
