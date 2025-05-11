<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Loan extends Model
{
    protected $fillable = [
        'user_id',
        'package_id',
        'custom_package_id',
        'reference_number',
        'purpose',
        'amount',
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
        'principal_remaining',
        'total_amount_due',
        'current_balance',
        'days_past_due',
        'next_payment_due_date',
        'next_payment_amount',
        'last_payment_date',
        'last_payment_amount',
    ];

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
}
