<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Insert USD
        DB::table('currencies')->insert([
            'code' => 'USD',
            'name' => 'US Dollar',
            'symbol' => '$',
            'type' => 'fiat',
            'decimal_places' => 2,
            'decimal_separator' => '.',
            'thousand_separator' => ',',
            'symbol_position' => 'before',
            'is_base_currency' => true,
            'exchange_rate_to_base' => 1.00,
            'is_active' => true,
            'is_loan_available' => true,
            'is_borrow_available' => true,
            'risk_level' => 'low',
            'requires_enhanced_verification' => false,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Insert EUR
        DB::table('currencies')->insert([
            'code' => 'EUR',
            'name' => 'Euro',
            'symbol' => '€',
            'type' => 'fiat',
            'decimal_places' => 2,
            'decimal_separator' => '.',
            'thousand_separator' => ',',
            'symbol_position' => 'before',
            'is_base_currency' => false,
            'exchange_rate_to_base' => 1.08,
            'is_active' => true,
            'is_loan_available' => true,
            'is_borrow_available' => true,
            'risk_level' => 'low',
            'requires_enhanced_verification' => false,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Insert BTC
        DB::table('currencies')->insert([
            'code' => 'BTC',
            'name' => 'Bitcoin',
            'symbol' => '₿',
            'type' => 'crypto',
            'decimal_places' => 8,
            'decimal_separator' => '.',
            'thousand_separator' => ',',
            'symbol_position' => 'before',
            'is_base_currency' => false,
            'exchange_rate_to_base' => 69000.00,
            'blockchain_network' => 'Bitcoin',
            'confirmation_blocks' => 3,
            'is_active' => true,
            'is_loan_available' => true,
            'is_borrow_available' => true,
            'risk_level' => 'medium',
            'requires_enhanced_verification' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Insert ETH
        DB::table('currencies')->insert([
            'code' => 'ETH',
            'name' => 'Ethereum',
            'symbol' => 'Ξ',
            'type' => 'crypto',
            'decimal_places' => 8,
            'decimal_separator' => '.',
            'thousand_separator' => ',',
            'symbol_position' => 'before',
            'is_base_currency' => false,
            'exchange_rate_to_base' => 3500.00,
            'blockchain_network' => 'Ethereum',
            'confirmation_blocks' => 12,
            'is_active' => true,
            'is_loan_available' => true,
            'is_borrow_available' => true,
            'risk_level' => 'medium',
            'requires_enhanced_verification' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }

    public function down()
    {
        DB::table('currencies')->whereIn('code', ['USD', 'EUR', 'BTC', 'ETH'])->delete();
    }
}; 