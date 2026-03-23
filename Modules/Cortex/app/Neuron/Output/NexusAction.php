<?php

declare(strict_types=1);

namespace Modules\Cortex\Neuron\Output;

enum NexusAction: string
{
    case WriteScript = 'write_script';
    case Shoot = 'shoot';
    case Edit = 'edit';
    case FinalizeEdit = 'finalize_edit';
    case Publish = 'publish';
}
