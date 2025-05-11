<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanPayment extends Model
{
    protected $fillable = [
        'loan_id',
        'reference_number',
        'payment_number',
        'amount',
        'principal_amount',
        'interest_amount',
        'currency_id',
        'due_date',
        'payment_date',
        'status',
        'payment_method_id',
        'notes',
        'attachment',
        'payer_name',
        'payer_email',
        'recorded_by',
        'adjusted_by',
        'failure_reason',
        'failure_details',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'payment_date' => 'datetime',
        'amount' => 'decimal:2',
        'principal_amount' => 'decimal:2',
        'interest_amount' => 'decimal:2',
    ];

    /**
     * Get the loan that owns the payment.
     */
    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    /**
     * Get the currency that owns the payment.
     */
    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    /**
     * Get the payment method that owns the payment.
     */
    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    /**
     * Get the user who recorded the payment.
     */
    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /**
     * Get the user who adjusted the payment.
     */
    public function adjuster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adjusted_by');
    }
}
