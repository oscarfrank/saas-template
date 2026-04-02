<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Support;

enum WorkerAgentInputScope: string
{
    case AllWorkers = 'all_workers';
    case SelectedWorkers = 'selected_workers';
}
