<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Support;

enum WorkerAgentProposalStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Applied = 'applied';
    case Cancelled = 'cancelled';
}
