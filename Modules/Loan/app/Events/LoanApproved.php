<?php

namespace Modules\Loan\Events;

use Modules\Loan\Models\Loan;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LoanApproved
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $loan;

    /**
     * Create a new event instance.
     */
    public function __construct(Loan $loan)
    {
        $this->loan = $loan;
    }
} 