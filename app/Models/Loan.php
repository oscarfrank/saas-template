<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Loan extends Model
{
    protected $fillable = [
        'user_id',
        'package_id',
        'reference_number',
        'purpose',
        'amount',
        'current_balance',
        'currency_id',
        'interest_rate',
        'interest_type',
        'interest_calculation',
        'interest_payment_frequency',
        'duration_days',
        'start_date',
        'end_date',
        'status',
        'submitted_at',
        'approved_at',
        'approved_by',
        'rejected_at',
        'disbursed_at',
        'defaulted_at',
        'paid_at',
        'closed_at',
        'monthly_payment_amount',
        'total_payments',
        'completed_payments',
        'principal_paid',
        'interest_paid',
        'fees_paid',
        'total_amount_due',
        'current_balance',
        'days_past_due',
        'next_payment_due_date',
        'next_payment_amount',
        'last_payment_date',
        'last_payment_amount',
        'payment_method_id',
        'disbursement_transaction_id',
        'origination_fee_amount',
        'platform_fee_amount',
        'late_payment_fee_fixed',
        'late_payment_fee_percentage',
        'grace_period_days',
        'allows_early_repayment',
        'early_repayment_fee_percentage',
        'early_repayment_fixed_fee',
        'early_repayment_period_days',
        'has_early_repayment',
        'has_collateral',
        'collateral_description'
    ];

    protected $appends = ['current_interest_due', 'principal_remaining'];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'disbursed_at' => 'datetime',
        'defaulted_at' => 'datetime',
        'paid_at' => 'datetime',
        'closed_at' => 'datetime',
        'next_payment_due_date' => 'datetime',
        'last_payment_date' => 'datetime',
    ];

    /**
     * Get the user that owns the loan.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user that approved the loan.
     */
    public function approved_by_user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by')
            ->select(['id', 'first_name', 'last_name', 'email'])
            ->withDefault([
                'id' => null,
                'first_name' => 'N/A',
                'last_name' => 'N/A',
                'email' => 'N/A'
            ]);
    }

    /**
     * Get the package that owns the loan.
     */
    public function package(): BelongsTo
    {
        return $this->belongsTo(LoanPackage::class);
    }

    /**
     * Get the custom package that owns the loan.
     */
    public function customPackage(): BelongsTo
    {
        return $this->belongsTo(CustomPackage::class);
    }

    /**
     * Get the currency that owns the loan.
     */
    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    /**
     * Get the documents for the loan.
     */
    public function documents(): HasMany
    {
        return $this->hasMany(LoanDocument::class);
    }

    /**
     * Get the notes for the loan.
     */
    public function notes(): HasMany
    {
        return $this->hasMany(LoanNote::class);
    }

    /**
     * Get the payments for the loan.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(LoanPayment::class);
    }

    /**
     * Get the last payment made for the loan.
     */
    public function lastPayment(): HasOne
    {
        return $this->hasOne(LoanPayment::class)->latest();
    }

    /**
     * Get the pending payments for the loan.
     */
    public function pendingPayments(): HasMany
    {
        return $this->hasMany(LoanPayment::class)->where('status', 'pending');
    }

    /**
     * Get the payment method for the loan.
     */
    public function payment_method(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    /**
     * Calculate the next payment due date based on loan duration and start date.
     */
    public function calculateNextPaymentDueDate(): \DateTime
    {
        if (!$this->start_date) {
            return new \DateTime();
        }

        $startDate = new \DateTime($this->start_date);
        $now = new \DateTime();
        
        // If we haven't started yet, return the start date
        if ($now < $startDate) {
            return $startDate;
        }

        // Calculate how many periods have passed
        $daysSinceStart = $now->diff($startDate)->days;
        $periodsPassed = ceil($daysSinceStart / $this->duration_days);
        
        // Calculate the next due date
        $nextDueDate = clone $startDate;
        $nextDueDate->modify("+{$this->duration_days} days");
        
        // If the next due date is in the past, keep adding periods until it's in the future
        while ($nextDueDate <= $now) {
            $nextDueDate->modify("+{$this->duration_days} days");
        }
        
        return $nextDueDate;
    }

    /**
     * Get the next payment due date.
     */
    public function getNextPaymentDueDateAttribute($value)
    {
        try {
            if (!$value) {
                return $this->calculateNextPaymentDueDate()->format('Y-m-d H:i:s');
            }
            return $value;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get the current interest due attribute.
     */
    public function getCurrentInterestDueAttribute(): float
    {
        return $this->currentInterestDue();
    }

    /**
     * Get the remaining principal amount.
     */
    public function getPrincipalRemainingAttribute(): float
    {
        return $this->amount - $this->principal_paid;
    }

    /**
     * Calculate current interest due up to today.
     */
    public function currentInterestDue(): float
    {
        // Step 1: Basic validation
        if (!$this->start_date || !$this->amount || !$this->interest_rate || !$this->duration_days) {
            \Log::info('Interest calculation failed validation', [
                'loan_id' => $this->id,
                'start_date' => $this->start_date,
                'amount' => $this->amount,
                'interest_rate' => $this->interest_rate,
                'duration_days' => $this->duration_days
            ]);
            return 0;
        }

        try {
            // Step 2: Get the start date and current date
            $startDate = new \DateTime($this->start_date);
            $now = new \DateTime();
            
            // If loan hasn't started yet, return 0
            if ($now < $startDate) {
                return 0;
            }
            
            // Step 3: Calculate days elapsed
            $days = $now->diff($startDate)->days;
            
            // Step 4: Calculate daily interest rate based on interest calculation method
            $dailyRate = match($this->interest_calculation) {
                'daily' => $this->interest_rate / 100,
                'weekly' => $this->interest_rate / 100 / 7,
                'monthly' => $this->interest_rate / 100 / 30,
                'yearly' => $this->interest_rate / 100 / 365,
                default => $this->interest_rate / 100 / 30, // Default to monthly
            };
            
            // Step 5: Calculate interest using current_balance instead of principal_remaining
            $interest = $this->current_balance * $dailyRate * $days;

            // Step 6: Subtract any interest already paid
            $interest = max(0, $interest - $this->interest_paid);
            // $interest = $interest;

            \Log::info('Interest calculation details', [
                'loan_id' => $this->id,
                'original_amount' => $this->amount,
                'principal_paid' => $this->principal_paid,
                'principal_remaining' => $this->principal_remaining,
                'current_balance' => $this->current_balance,
                'interest_rate' => $this->interest_rate,
                'interest_calculation' => $this->interest_calculation,
                'duration_days' => $this->duration_days,
                'days_elapsed' => $days,
                'daily_rate' => $dailyRate,
                'calculated_interest' => $interest,
                'interest_paid' => $this->interest_paid,
                'start_date' => $startDate->format('Y-m-d'),
                'now' => $now->format('Y-m-d')
            ]);

            return round($interest, 2);
        } catch (\Exception $e) {
            \Log::error('Error calculating interest due', [
                'loan_id' => $this->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return 0;
        }
    }

    /**
     * Calculate the monthly payment amount based on current balance.
     */
    public function calculateMonthlyPaymentAmount(): float
    {
        if (!$this->current_balance || !$this->interest_rate || !$this->duration_days) {
            return 0;
        }

        try {
            // Calculate remaining days
            $now = new \DateTime();
            $endDate = new \DateTime($this->end_date);
            $remainingDays = $now->diff($endDate)->days;
            
            if ($remainingDays <= 0) {
                return $this->current_balance; // Return full balance if loan has ended
            }

            // Calculate monthly rate based on interest calculation method
            $monthlyRate = match($this->interest_calculation) {
                'daily' => $this->interest_rate / 100 / 30,
                'weekly' => $this->interest_rate / 100 / 4,
                'monthly' => $this->interest_rate / 100,
                'yearly' => $this->interest_rate / 100 / 12,
                default => $this->interest_rate / 100, // Default to monthly
            };

            // Calculate remaining number of payments
            $remainingPayments = ceil($remainingDays / 30);

            if ($monthlyRate === 0 || $remainingPayments === 0) {
                return $this->current_balance / $remainingPayments;
            }

            // Calculate monthly payment using the formula: P = (P0 * r * (1 + r)^n) / ((1 + r)^n - 1)
            // Where P0 is current balance, r is monthly rate, n is number of remaining payments
            $monthlyPayment = ($this->current_balance * $monthlyRate * pow(1 + $monthlyRate, $remainingPayments)) / 
                            (pow(1 + $monthlyRate, $remainingPayments) - 1);

            \Log::info('Monthly payment calculation details', [
                'loan_id' => $this->id,
                'current_balance' => $this->current_balance,
                'interest_rate' => $this->interest_rate,
                'interest_calculation' => $this->interest_calculation,
                'remaining_days' => $remainingDays,
                'remaining_payments' => $remainingPayments,
                'monthly_rate' => $monthlyRate,
                'calculated_payment' => $monthlyPayment
            ]);

            return round($monthlyPayment, 2);
        } catch (\Exception $e) {
            \Log::error('Error calculating monthly payment', [
                'loan_id' => $this->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return 0;
        }
    }

    /**
     * Get the monthly payment amount.
     */
    public function getMonthlyPaymentAmountAttribute($value)
    {
        if (!$value) {
            return $this->calculateMonthlyPaymentAmount();
        }
        return $value;
    }
}
