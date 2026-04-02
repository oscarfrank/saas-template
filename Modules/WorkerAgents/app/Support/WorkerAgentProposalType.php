<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Support;

enum WorkerAgentProposalType: string
{
    case TaskCreate = 'task_create';
}
