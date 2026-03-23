<?php

declare(strict_types=1);

namespace Modules\Cortex\Neuron\Output;

use NeuronAI\StructuredOutput\SchemaProperty;

final class PulseDigestIdeaItem
{
    #[SchemaProperty(required: true, description: 'Short working title for the piece.')]
    public string $title;

    #[SchemaProperty(required: true, description: 'Hook or opening line (for tweets, keep under ~240 characters).')]
    public string $hook;

    #[SchemaProperty(required: false, description: 'Angle, format note, or why it could land with the audience.')]
    public ?string $angle = null;
}
