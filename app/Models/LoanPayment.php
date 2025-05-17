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
        'payment_number',
        'amount',
        'interest_amount',
        'principal_amount',
        'fees_amount',
        'late_fee_amount',
        'early_payment_fee_amount',
        'additional_amount',
        'currency_id',
        'due_at',
        'payment_at',
        'days_late',
        'is_overdue',
        'status',
        'transaction_id',
        'receipt_number',
        'check_number',
        'confirmation_code',
        'notes',
        'proof_file',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'payer_name',
        'payer_email',
        'payer_phone',
        'payment_source',
        'reminder_sent',
        'last_reminder_sent_at',
        'reminder_count',
        'failure_reason',
        'failure_details',
        'retry_count',
        'next_retry_at',
        'is_auto_payment',
        'auto_payment_scheduled',
        'auto_payment_scheduled_for',
        'principal_balance_after',
        'total_balance_after',
        'interest_rate_applied',
        'days_in_period',
        'is_adjusted',
        'adjusted_by',
        'adjusted_at',
        'adjustment_reason',
        'adjustment_history',
        'is_test_payment',
        'metadata',
        'payment_response_data'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'interest_amount' => 'decimal:2',
        'principal_amount' => 'decimal:2',
        'fees_amount' => 'decimal:2',
        'late_fee_amount' => 'decimal:2',
        'early_payment_fee_amount' => 'decimal:2',
        'additional_amount' => 'decimal:2',
        'principal_balance_after' => 'decimal:2',
        'total_balance_after' => 'decimal:2',
        'interest_rate_applied' => 'decimal:4',
        'is_overdue' => 'boolean',
        'reminder_sent' => 'boolean',
        'is_auto_payment' => 'boolean',
        'auto_payment_scheduled' => 'boolean',
        'is_adjusted' => 'boolean',
        'is_test_payment' => 'boolean',
        'metadata' => 'array',
        'adjustment_history' => 'array',
        'payment_response_data' => 'array',
        'due_at' => 'datetime',
        'payment_at' => 'datetime',
        'approved_at' => 'datetime',
        'last_reminder_sent_at' => 'datetime',
        'next_retry_at' => 'datetime',
        'auto_payment_scheduled_for' => 'datetime',
        'adjusted_at' => 'datetime'
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
