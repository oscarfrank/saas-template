<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Check if tenant exists
        // $tenant = DB::table('tenants')->where('id', 'oscarmini')->first();
        // if (!$tenant) {
        //     // Create tenant if it doesn't exist
        //     DB::table('tenants')->insert([
        //         'id' => 'oscarmini',
        //         'name' => 'Oscar Mini',
        //         'slug' => 'oscarmini',
        //         'created_at' => now(),
        //         'updated_at' => now()
        //     ]);
        // }

        // // Quick Loan - 1 Month
        // DB::table('loan_packages')->insert([
        //     'name' => 'Quick Loan - 1 Month',
        //     'code' => 'QL-1M',
        //     'tenant_id' => 'oscarmini',
        //     'description' => 'Short-term loan with low interest for 1 month duration',
        //     'user_type' => 'lender',
        //     'min_amount' => 10000,
        //     'max_amount' => 1000000,
        //     'currency_id' => 4, // NGN
        //     'min_duration_days' => 30,
        //     'max_duration_days' => 30,
        //     'has_fixed_duration' => true,
        //     'fixed_duration_days' => 30,
        //     'interest_rate' => 2.5,
        //     'interest_type' => 'simple',
        //     'interest_calculation' => 'monthly',
        //     'interest_payment_frequency' => 'end_of_term',
        //     'min_kyc_level' => 1,
        //     'risk_level' => 'low',
        //     'is_active' => true,
        //     'display_order' => 1,
        //     'is_featured' => true,
        //     'created_at' => now(),
        //     'updated_at' => now()
        // ]);

        // // Standard Loan - 3 Months
        // DB::table('loan_packages')->insert([
        //     'name' => 'Standard Loan - 1 Months with Fees',
        //     'code' => 'SL-11M',
        //     'tenant_id' => 'oscarmini',
        //     'description' => 'Short-term loan with competitive interest for 1 months duration with fees',
        //     'user_type' => 'lender',
        //     'min_amount' => 50000,
        //     'max_amount' => 2500000,
        //     'currency_id' => 4, // NGN
        //     'min_duration_days' => 30,
        //     'max_duration_days' => 30,
        //     'has_fixed_duration' => true,
        //     'fixed_duration_days' => 30,
        //     'interest_rate' => 4.0,
        //     'interest_type' => 'simple',
        //     'interest_calculation' => 'monthly',
        //     'interest_payment_frequency' => 'monthly',

        //     'has_origination_fee' => true,
        //     'origination_fee_type' => 'percentage',
        //     'origination_fee_fixed' => 0,
        //     'origination_fee_percentage' => 0.05,

        //     'late_payment_fee_type' => 'percentage',
        //     'late_payment_fee_fixed' => 0,
        //     'late_payment_fee_percentage' => 0.05,
        //     'grace_period_days' => 7,

        //     'allows_early_repayment' => true,
        //     'early_repayment_type' => 'fixed',
        //     'early_repayment_fee_fixed' => 1000,
        //     'early_repayment_fee_percentage' => 0.05,
        //     'early_repayment_period_days' => 14,

        //     'min_kyc_level' => 2,
        //     'risk_level' => 'medium',
        //     'is_active' => true,
        //     'display_order' => 2,
        //     'is_featured' => true,
        //     'created_at' => now(),
        //     'updated_at' => now()
        // ]);

        // // Long-term Loan - 6 Months
        // DB::table('loan_packages')->insert([
        //     'name' => 'Long-term Loan - 6 Months',
        //     'code' => 'LT-6M',
        //     'tenant_id' => 'oscarmini',
        //     'description' => 'Longer-term loan with higher interest for 6 months duration',
        //     'user_type' => 'lender',
        //     'min_amount' => 100000,
        //     'max_amount' => 5000000,
        //     'currency_id' => 4, // NGN
        //     'min_duration_days' => 180,
        //     'max_duration_days' => 180,
        //     'has_fixed_duration' => true,
        //     'fixed_duration_days' => 180,
        //     'interest_rate' => 20.0,
        //     'interest_type' => 'compound',
        //     'interest_calculation' => 'monthly',
        //     'interest_payment_frequency' => 'monthly',
        //     'min_kyc_level' => 3,
        //     'risk_level' => 'high',
        //     'is_active' => true,
        //     'display_order' => 3,
        //     'is_featured' => false,
        //     'created_at' => now(),
        //     'updated_at' => now()
        // ]);
    }

    public function down()
    {
        DB::table('loan_packages')->whereIn('code', ['QL-1M', 'SL-3M', 'LT-6M'])->delete();
    }
}; 