<?php

namespace App\Events\Loan;

use App\Models\LoanPayment;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LoanPaymentSubmitted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $payment;

    /**
     * Create a new event instance.
     */
    public function __construct(LoanPayment $payment)
    {
        $this->payment = $payment;
    }
} 