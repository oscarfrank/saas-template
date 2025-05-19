<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Conservative Yield
        DB::table('borrow_packages')->insert([
            'name' => 'Conservative Yield',
            'code' => 'CY-1M',
            'description' => 'Low-risk investment opportunity with stable monthly returns',
            'user_type' => 'borrower',
            'min_amount' => 500,
            'max_amount' => 50000,
            'currency_id' => 1, // USD
            'min_duration_days' => 30,
            'max_duration_days' => 30,
            'has_fixed_duration' => true,
            'fixed_duration_days' => 30,
            'interest_rate' => 2.0,
            'interest_type' => 'simple',
            'interest_calculation' => 'monthly',
            'interest_payment_frequency' => 'end_of_term',
            'platform_fee_percentage' => 0.5,
            'allows_early_withdrawal' => false,
            'is_principal_guaranteed' => true,
            'risk_level' => 'low',
            'min_kyc_level' => 1,
            'funding_type' => 'open',
            'funds_usage' => 'Funds will be used to finance short-term loans to verified borrowers with excellent credit scores.',
            'loan_allocation' => json_encode(['short_term_loans' => 100]),
            'is_active' => true,
            'display_order' => 1,
            'is_featured' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Balanced Growth
        DB::table('borrow_packages')->insert([
            'name' => 'Balanced Growth',
            'code' => 'BG-3M',
            'description' => 'Medium-risk investment with competitive quarterly returns',
            'user_type' => 'borrower',
            'min_amount' => 1000,
            'max_amount' => 100000,
            'currency_id' => 1, // USD
            'min_duration_days' => 90,
            'max_duration_days' => 90,
            'has_fixed_duration' => true,
            'fixed_duration_days' => 90,
            'interest_rate' => 6.0,
            'interest_type' => 'simple',
            'interest_calculation' => 'monthly',
            'interest_payment_frequency' => 'monthly',
            'platform_fee_percentage' => 1.0,
            'allows_early_withdrawal' => true,
            'lock_period_days' => 30,
            'early_withdrawal_fee_percentage' => 2.0,
            'is_principal_guaranteed' => false,
            'risk_level' => 'medium',
            'min_kyc_level' => 2,
            'funding_type' => 'open',
            'funds_usage' => 'Funds will be diversified across medium-term loans to verified borrowers with good credit scores.',
            'loan_allocation' => json_encode(['medium_term_loans' => 80, 'short_term_loans' => 20]),
            'is_active' => true,
            'display_order' => 2,
            'is_featured' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // High Yield Opportunity
        DB::table('borrow_packages')->insert([
            'name' => 'High Yield Opportunity',
            'code' => 'HY-6M',
            'description' => 'Higher-risk investment with substantial returns over a 6-month period',
            'user_type' => 'borrower',
            'min_amount' => 5000,
            'max_amount' => 250000,
            'currency_id' => 1, // USD
            'min_duration_days' => 180,
            'max_duration_days' => 180,
            'has_fixed_duration' => true,
            'fixed_duration_days' => 180,
            'interest_rate' => 15.0,
            'interest_type' => 'compound',
            'interest_calculation' => 'monthly',
            'interest_payment_frequency' => 'monthly',
            'platform_fee_percentage' => 2.0,
            'allows_early_withdrawal' => false,
            'is_principal_guaranteed' => false,
            'risk_level' => 'high',
            'min_kyc_level' => 3,
            'funding_type' => 'fixed',
            'funding_target' => 1000000,
            'funds_usage' => 'Funds will be allocated to higher-yield, longer-term loans with higher interest rates.',
            'loan_allocation' => json_encode(['long_term_loans' => 70, 'medium_term_loans' => 30]),
            'is_active' => true,
            'display_order' => 3,
            'is_featured' => false,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Bitcoin Investment Pool
        DB::table('borrow_packages')->insert([
            'name' => 'Bitcoin Investment Pool',
            'code' => 'BIP-BTC',
            'description' => 'Invest Bitcoin and earn returns in Bitcoin with flexible duration',
            'user_type' => 'borrower',
            'min_amount' => 0.05,
            'max_amount' => 10,
            'currency_id' => 3, // BTC
            'min_duration_days' => 90,
            'max_duration_days' => 365,
            'has_fixed_duration' => false,
            'interest_rate' => 10.0,
            'interest_type' => 'simple',
            'interest_calculation' => 'monthly',
            'interest_payment_frequency' => 'monthly',
            'platform_fee_percentage' => 1.5,
            'allows_early_withdrawal' => true,
            'lock_period_days' => 30,
            'early_withdrawal_fee_percentage' => 3.0,
            'is_principal_guaranteed' => false,
            'risk_level' => 'high',
            'min_kyc_level' => 2,
            'funding_type' => 'open',
            'funds_usage' => 'Funds will be used to provide Bitcoin loans to verified users with strong crypto portfolios.',
            'is_active' => true,
            'display_order' => 4,
            'is_featured' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }

    public function down()
    {
        DB::table('borrow_packages')->whereIn('code', ['CY-1M', 'BG-3M', 'HY-6M', 'BIP-BTC'])->delete();
    }
}; 