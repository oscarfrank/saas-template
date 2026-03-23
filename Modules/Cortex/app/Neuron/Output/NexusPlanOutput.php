<?php

declare(strict_types=1);

namespace Modules\Cortex\Neuron\Output;

use NeuronAI\StructuredOutput\SchemaProperty;

final class NexusPlanOutput
{
    #[SchemaProperty(required: true, description: 'Short assistant message explaining the plan changes and how to proceed.')]
    public string $assistant_message;

    /**
     * @var list<NexusTaskCandidateOutput>
     */
    #[SchemaProperty(
        required: true,
        description: 'List of task candidates that the user can tick to create HR tasks.',
        anyOf: [NexusTaskCandidateOutput::class],
    )]
    public array $candidates;
}
