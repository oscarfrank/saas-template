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
        'amount',
        'additional_amount',
        'currency_id',
        'due_at',
        'payment_at',
        'days_late',
        'is_overdue',
        'status',
        'reference_number',
        'transaction_id',
        'notes',
        'metadata',
        'payment_number',
        'payment_date',
        'due_date',
        'proof_file',
        'approved_by',
        'approved_at',
        'rejection_reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'additional_amount' => 'decimal:2',
        'is_overdue' => 'boolean',
        'metadata' => 'array',
        'due_at' => 'datetime',
        'payment_at' => 'datetime',
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
        
        // If payment amount is less than or equal to interest due, apply all to interest
        if ($this->amount <= $interestDue) {
            return [
                'interest_amount' => $this->amount,
                'principal_amount' => 0,
                'fees_amount' => 0
            ];
        }

        // Calculate remaining amount after interest
        $remainingAmount = $this->amount - $interestDue;
        $feesDue = $this->calculateFeesDue($loan);

        // If remaining amount is less than or equal to fees, apply remaining to fees
        if ($remainingAmount <= $feesDue) {
            return [
                'interest_amount' => $interestDue,
                'principal_amount' => 0,
                'fees_amount' => $remainingAmount
            ];
        }

        // Apply remaining amount to principal
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
            // Simple interest: Principal * Rate * Time
            return $loan->principal_remaining * ($loan->interest_rate / 100) * ($days / 365);
        } else {
            // Compound interest: Principal * (1 + Rate)^Time - Principal
            return $loan->principal_remaining * (pow(1 + ($loan->interest_rate / 100), $days / 365) - 1);
        }
    }

    /**
     * Calculate fees due up to the payment date.
     */
    private function calculateFeesDue(Loan $loan): float
    {
        // Calculate late payment fees if applicable
        $daysPastDue = $this->payment_date->diffInDays($loan->next_payment_due_date);
        if ($daysPastDue > $loan->grace_period_days) {
            $lateFee = $loan->late_payment_fee_fixed;
            $lateFee += $loan->principal_remaining * ($loan->late_payment_fee_percentage / 100);
            return $lateFee;
        }
        
        return 0;
    }
}
