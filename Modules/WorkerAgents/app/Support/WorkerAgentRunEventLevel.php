<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Support;

enum WorkerAgentRunEventLevel: string
{
    case Info = 'info';
    case Warning = 'warning';
    case Error = 'error';
}
