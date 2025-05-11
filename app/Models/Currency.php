<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Currency extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'symbol',
        'type',
        'decimal_places',
        'decimal_separator',
        'thousand_separator',
        'symbol_position',
        'is_base_currency',
        'exchange_rate_to_base',
        'exchange_rate_updated_at',
        'blockchain_network',
        'confirmation_blocks',
        'is_active',
        'min_transaction_amount',
        'max_transaction_amount',
        'withdrawal_fee_fixed',
        'withdrawal_fee_percent',
        'deposit_fee_fixed',
        'deposit_fee_percent',
        'risk_level',
        'requires_enhanced_verification',
        'description',
        'additional_info',
        'icon',
        'is_default'
    ];

    protected $casts = [
        'is_base_currency' => 'boolean',
        'is_active' => 'boolean',
        'is_loan_available' => 'boolean',
        'is_borrow_available' => 'boolean',
        'requires_enhanced_verification' => 'boolean',
        'is_default' => 'boolean',
        'exchange_rate_to_base' => 'decimal:10',
        'min_transaction_amount' => 'decimal:10',
        'max_transaction_amount' => 'decimal:10',
        'withdrawal_fee_fixed' => 'decimal:10',
        'withdrawal_fee_percent' => 'decimal:6',
        'deposit_fee_fixed' => 'decimal:10',
        'deposit_fee_percent' => 'decimal:6',
        'additional_info' => 'array',
        'exchange_rate_updated_at' => 'datetime',
    ];

    public function setAsDefault()
    {
        // Remove default status from all other currencies
        static::where('is_default', true)->update(['is_default' => false]);
        
        // Set this currency as default
        $this->update(['is_default' => true]);
    }

    public function formatAmount($amount)
    {
        $formatted = number_format(
            $amount,
            $this->decimal_places,
            $this->decimal_separator,
            $this->thousand_separator
        );

        return $this->symbol_position === 'before'
            ? $this->symbol . $formatted
            : $formatted . $this->symbol;
    }
}
