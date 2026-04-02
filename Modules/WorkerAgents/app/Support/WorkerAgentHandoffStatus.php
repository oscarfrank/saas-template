<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Support;

enum WorkerAgentHandoffStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Declined = 'declined';
    case Cancelled = 'cancelled';
}
