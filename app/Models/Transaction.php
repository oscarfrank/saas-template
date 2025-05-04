<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Transaction extends Model
{
    protected $fillable = [
        'reference_number',
        'user_id',
        'transaction_type',
        'category',
        'amount',
        'currency_id',
        'fee_amount',
        'tax_amount',
        'net_amount',
        'exchange_rate',
        'original_currency_id',
        'original_amount',
        'loan_id',
        'loan_payment_id',
        'borrow_id',
        'borrow_payment_id',
        'status',
        'payment_method_id',
        'external_reference',
        'payment_source',
        'payment_destination',
        'initiated_at',
        'processed_at',
        'completed_at',
        'failed_at',
        'cancelled_at',
        'processor',
        'processor_fee',
        'processor_response_code',
        'processor_response_message',
        'processor_response_data',
        'failure_reason',
        'failure_details',
        'retry_attempted',
        'retry_count',
        'sender_id',
        'recipient_id',
        'sender_account',
        'recipient_account',
        'created_by',
        'processed_by',
        'is_automatic',
        'admin_notes',
        'balance_before',
        'balance_after',
        'adjustment_reason',
        'adjusted_by',
        'ip_address',
        'user_agent',
        'geo_location',
        'compliance_status',
        'requires_review',
        'review_notes',
        'reviewed_by',
        'receipt_number',
        'receipt_url',
        'receipt_sent',
        'is_test_transaction',
        'metadata'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'fee_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'exchange_rate' => 'decimal:10',
        'original_amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'processor_response_data' => 'json',
        'metadata' => 'json',
        'is_automatic' => 'boolean',
        'retry_attempted' => 'boolean',
        'receipt_sent' => 'boolean',
        'is_test_transaction' => 'boolean',
        'requires_review' => 'boolean',
        'initiated_at' => 'datetime',
        'processed_at' => 'datetime',
        'completed_at' => 'datetime',
        'failed_at' => 'datetime',
        'cancelled_at' => 'datetime'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class);
    }

    public function originalCurrency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'original_currency_id');
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    public function loanPayment(): BelongsTo
    {
        return $this->belongsTo(LoanPayment::class);
    }

    public function borrow(): BelongsTo
    {
        return $this->belongsTo(Borrow::class);
    }

    public function borrowPayment(): BelongsTo
    {
        return $this->belongsTo(BorrowPayment::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function adjuster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adjusted_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
