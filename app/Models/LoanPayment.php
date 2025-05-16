<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LoanPayment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'loan_id',
        'payment_method_id',
        'reference_number',
        'amount',
        'interest_amount',
        'principal_amount',
        'fees_amount',
        'payment_date',
        'status',
        'notes',
        'proof_file',
        'approved_by',
        'approved_at',
        'rejection_reason'
    ];

    protected $casts = [
        'payment_date' => 'date',
        'approved_at' => 'datetime',
        'amount' => 'decimal:2',
        'interest_amount' => 'decimal:2',
        'principal_amount' => 'decimal:2',
        'fees_amount' => 'decimal:2'
    ];

    /**
     * Get the loan that owns the payment.
     */
    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    /**
     * Get the payment method for this payment.
     */
    public function payment_method(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    /**
     * Get the user who approved the payment.
     */
    public function approved_by_user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Calculate how the payment should be split between interest and principal.
     */
    public function calculatePaymentSplit(): array
    {
        $loan = $this->loan;
        $interestDue = $this->calculateInterestDue($loan);
        
        if ($this->amount <= $interestDue) {
            return [
                'interest_amount' => $this->amount,
                'principal_amount' => 0,
                'fees_amount' => 0
            ];
        }

        $remainingAmount = $this->amount - $interestDue;
        $feesDue = $this->calculateFeesDue($loan);

        if ($remainingAmount <= $feesDue) {
            return [
                'interest_amount' => $interestDue,
                'principal_amount' => 0,
                'fees_amount' => $remainingAmount
            ];
        }

        return [
            'interest_amount' => $interestDue,
            'fees_amount' => $feesDue,
            'principal_amount' => $remainingAmount - $feesDue
        ];
    }

    /**
     * Calculate interest due up to the payment date.
     */
    private function calculateInterestDue(Loan $loan): float
    {
        $lastPaymentDate = $loan->last_payment_date ?? $loan->start_date;
        $days = $this->payment_date->diffInDays($lastPaymentDate);
        
        // Calculate based on loan's interest type and calculation method
        if ($loan->interest_type === 'simple') {
            return $loan->principal_remaining * ($loan->interest_rate / 100) * ($days / 365);
        } else {
            // Compound interest calculation
            return $loan->principal_remaining * (pow(1 + ($loan->interest_rate / 100), $days / 365) - 1);
        }
    }

    /**
     * Calculate fees due up to the payment date.
     */
    private function calculateFeesDue(Loan $loan): float
    {
        // Implement fee calculation logic based on loan terms
        return 0; // Placeholder
    }
}
