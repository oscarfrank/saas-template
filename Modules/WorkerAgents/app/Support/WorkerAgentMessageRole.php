<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Support;

enum WorkerAgentMessageRole: string
{
    case System = 'system';
    case Agent = 'agent';
    case Human = 'human';
    case Handoff = 'handoff';
}
