<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Quick Loan - 1 Month
        DB::table('loan_packages')->insert([
            'name' => 'Quick Loan - 1 Month',
            'code' => 'QL-1M',
            'description' => 'Short-term loan with low interest for 1 month duration',
            'user_type' => 'lender',
            'min_amount' => 100,
            'max_amount' => 10000,
            'currency_id' => 1, // USD
            'min_duration_days' => 30,
            'max_duration_days' => 30,
            'has_fixed_duration' => true,
            'fixed_duration_days' => 30,
            'interest_rate' => 2.5,
            'interest_type' => 'simple',
            'interest_calculation' => 'monthly',
            'interest_payment_frequency' => 'end_of_term',
            'min_kyc_level' => 1,
            'risk_level' => 'low',
            'is_active' => true,
            'display_order' => 1,
            'is_featured' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Standard Loan - 3 Months
        DB::table('loan_packages')->insert([
            'name' => 'Standard Loan - 3 Months',
            'code' => 'SL-3M',
            'description' => 'Medium-term loan with competitive interest for 3 months duration',
            'user_type' => 'lender',
            'min_amount' => 500,
            'max_amount' => 25000,
            'currency_id' => 1, // USD
            'min_duration_days' => 90,
            'max_duration_days' => 90,
            'has_fixed_duration' => true,
            'fixed_duration_days' => 90,
            'interest_rate' => 8.0,
            'interest_type' => 'simple',
            'interest_calculation' => 'monthly',
            'interest_payment_frequency' => 'monthly',
            'min_kyc_level' => 2,
            'risk_level' => 'medium',
            'is_active' => true,
            'display_order' => 2,
            'is_featured' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Long-term Loan - 6 Months
        DB::table('loan_packages')->insert([
            'name' => 'Long-term Loan - 6 Months',
            'code' => 'LT-6M',
            'description' => 'Longer-term loan with higher interest for 6 months duration',
            'user_type' => 'lender',
            'min_amount' => 1000,
            'max_amount' => 50000,
            'currency_id' => 1, // USD
            'min_duration_days' => 180,
            'max_duration_days' => 180,
            'has_fixed_duration' => true,
            'fixed_duration_days' => 180,
            'interest_rate' => 20.0,
            'interest_type' => 'compound',
            'interest_calculation' => 'monthly',
            'interest_payment_frequency' => 'monthly',
            'min_kyc_level' => 3,
            'risk_level' => 'high',
            'is_active' => true,
            'display_order' => 3,
            'is_featured' => false,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Crypto Loan - Bitcoin
        DB::table('loan_packages')->insert([
            'name' => 'Crypto Loan - Bitcoin',
            'code' => 'CL-BTC',
            'description' => 'Loan in Bitcoin with flexible duration from 1 to 6 months',
            'user_type' => 'lender',
            'min_amount' => 0.01,
            'max_amount' => 5,
            'currency_id' => 3, // BTC
            'min_duration_days' => 30,
            'max_duration_days' => 180,
            'has_fixed_duration' => false,
            'interest_rate' => 15.0,
            'interest_type' => 'simple',
            'interest_calculation' => 'monthly',
            'interest_payment_frequency' => 'monthly',
            'min_kyc_level' => 2,
            'risk_level' => 'high',
            'is_active' => true,
            'display_order' => 4,
            'is_featured' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }

    public function down()
    {
        DB::table('loan_packages')->whereIn('code', ['QL-1M', 'SL-3M', 'LT-6M', 'CL-BTC'])->delete();
    }
}; 