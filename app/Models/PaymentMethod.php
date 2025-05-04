<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    protected $fillable = [
        'user_id',
        'method_type',
        'name',
        'is_default',
        'bank_name',
        'account_number',
        'account_holder_name',
        'routing_number',
        'swift_bic_code',
        'iban',
        'branch_code',
        'branch_address',
        'card_type',
        'card_last_four',
        'card_expiry_month',
        'card_expiry_year',
        'card_token',
        'crypto_currency',
        'wallet_address',
        'wallet_network',
        'mobile_provider',
        'mobile_number',
        'mobile_account_name',
        'gateway_name',
        'gateway_email',
        'gateway_username',
        'gateway_account_id',
        'is_verified',
        'verified_at',
        'currency_id',
        'daily_limit',
        'monthly_limit',
        'requires_2fa',
        'additional_details',
        'is_active',
        'last_used_at'
    ];
}
