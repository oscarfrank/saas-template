<?php

namespace Modules\Transaction\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use Modules\User\Models\User;
use Modules\Ticket\Models\TicketReply;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

use Stancl\Tenancy\Database\Concerns\BelongsToTenant;


use Modules\Loan\Models\Loan;
use Modules\Loan\Models\LoanPayment;
use Modules\Loan\Models\Borrow;
use Modules\Loan\Models\BorrowPayment;
use Modules\Payment\Models\PaymentMethod;
use Modules\Payment\Models\Currency;



class Transaction extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'reference_number',
        'user_id',
        'transaction_type',
        'category',
        'amount',
        'currency_id',
        'fee_amount',
        'tax_amount',
        'net_amount',
        'loan_id',
        'loan_payment_id',
        'borrow_id',
        'borrow_payment_id',
        'status',
        'payment_method_id',
        'external_reference',
        'payment_source',
        'payment_destination',
        'sender_id',
        'recipient_id',
        'sender_account',
        'recipient_account',
        'created_by',
        'processed_by',
        'balance_before',
        'balance_after',
        'adjustment_reason',
        'adjusted_by',
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


    public function parent()
    {
        return $this->belongsTo(Transaction::class, 'parent_transaction_id');
    }

    public function refunds()
    {
        return $this->hasMany(Transaction::class, 'parent_transaction_id');
    }


    /**
     * Create a new transaction with the given data
     *
     * @param array $data Transaction data
     * @param array $options Additional options
     * @return Transaction
     */
    public static function createTransaction(array $data, array $options = []): Transaction
    {
        // Generate a unique reference number if not provided
        if (!isset($data['reference_number'])) {
            $data['reference_number'] = 'TRX-' . strtoupper(Str::random(10));
        }

        // Set default status if not provided
        if (!isset($data['status'])) {
            $data['status'] = 'pending';
        }

        // Calculate net amount if not provided
        if (!isset($data['net_amount']) && isset($data['amount'])) {
            $data['net_amount'] = $data['amount'];
            if (isset($data['fee_amount'])) {
                $data['net_amount'] -= $data['fee_amount'];
            }
            if (isset($data['tax_amount'])) {
                $data['net_amount'] -= $data['tax_amount'];
            }
        }

        // Set created_by if not provided and user is authenticated
        if (!isset($data['created_by']) && auth()->check()) {
            $data['created_by'] = auth()->id();
        }

        // Create the transaction
        $transaction = static::create($data);

        // Handle any post-creation logic
        if (isset($options['after_create']) && is_callable($options['after_create'])) {
            $options['after_create']($transaction);
        }

        return $transaction;
    }
}
