<?php

declare(strict_types=1);

namespace Modules\Cortex\Neuron\Output;

use NeuronAI\StructuredOutput\SchemaProperty;

final class NexusTaskCandidateOutput
{
    #[SchemaProperty(required: true, description: 'ID of the script this candidate task refers to.')]
    public int $script_id;

    #[SchemaProperty(required: true, description: 'Type of workflow action the task represents.')]
    public NexusAction $action;

    #[SchemaProperty(required: true, description: 'Staff id assigned to handle this task (must exist in tenant staff roster).')]
    public int $assigned_to;

    #[SchemaProperty(required: true, description: 'Human readable title for the HR task.')]
    public string $title;

    #[SchemaProperty(required: true, description: 'Human readable description/body for the HR task.')]
    public string $description;

    #[SchemaProperty(required: true, description: 'ISO-8601 due date/time.')]
    public string $due_at;

    #[SchemaProperty(required: true, description: 'ISO-8601 due date/time recommended by Nexus.')]
    public string $recommended_due_at;

    #[SchemaProperty(required: false, description: 'Priority: low, medium, high.')]
    public ?string $priority = null;
}
