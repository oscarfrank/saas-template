<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Premium Client Loan Offer
        DB::table('custom_packages')->insert([
            'name' => 'Premium Client Loan Offer',
            'code' => 'PCL-001',
            'description' => 'Exclusive loan offer tailored for our premium client based on their excellent repayment history',
            'user_id' => 2, // Assuming user ID 2 is a premium client
            'created_by' => 1, // Assuming user ID 1 is an admin
            'user_type' => 'lender',
            'amount' => 25000,
            'currency_id' => 1, // USD
            'duration_days' => 90,
            'interest_rate' => 5.5,
            'interest_type' => 'simple',
            'interest_calculation' => 'monthly',
            'interest_payment_frequency' => 'monthly',
            'special_terms' => 'This offer includes priority support and flexible repayment options.',
            'status' => 'pending',
            'offered_at' => now(),
            'expires_at' => now()->addDays(7),
            'requires_admin_approval' => true,
            'user_message' => 'Based on your excellent history with us, we are pleased to offer you this exclusive loan package with preferential terms.',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // VIP Investor Opportunity
        DB::table('custom_packages')->insert([
            'name' => 'VIP Investor Opportunity',
            'code' => 'VIO-001',
            'description' => 'Exclusive high-yield investment opportunity for our VIP investor',
            'user_id' => 3, // Assuming user ID 3 is a VIP investor
            'created_by' => 1, // Assuming user ID 1 is an admin
            'user_type' => 'borrower',
            'amount' => 100000,
            'currency_id' => 1, // USD
            'duration_days' => 180,
            'interest_rate' => 12.0,
            'interest_type' => 'compound',
            'interest_calculation' => 'monthly',
            'interest_payment_frequency' => 'monthly',
            'platform_fee_percentage' => 0.5,
            'allows_early_withdrawal' => true,
            'early_withdrawal_fee_percentage' => 1.0,
            'special_terms' => 'This exclusive offer provides priority access to our premium loan portfolio with enhanced returns.',
            'status' => 'pending',
            'offered_at' => now(),
            'expires_at' => now()->addDays(5),
            'user_message' => 'As one of our most valued investors, we are delighted to offer you this exclusive opportunity with enhanced returns and flexible terms.',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Bitcoin Premium Loan
        DB::table('custom_packages')->insert([
            'name' => 'Bitcoin Premium Loan',
            'code' => 'BPL-001',
            'description' => 'Custom Bitcoin loan with favorable terms',
            'user_id' => 4, // Assuming user ID 4 is a crypto client
            'created_by' => 1, // Assuming user ID 1 is an admin
            'user_type' => 'lender',
            'amount' => 1.5,
            'currency_id' => 3, // BTC
            'duration_days' => 60,
            'interest_rate' => 8.0,
            'interest_type' => 'simple',
            'interest_calculation' => 'monthly',
            'interest_payment_frequency' => 'end_of_term',
            'special_terms' => 'This offer includes reduced fees and flexible repayment options for crypto users.',
            'status' => 'pending',
            'offered_at' => now(),
            'expires_at' => now()->addDays(3),
            'user_message' => 'Based on your crypto portfolio and transaction history, we are pleased to offer you this custom Bitcoin loan package.',
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }

    public function down()
    {
        DB::table('custom_packages')->whereIn('code', ['PCL-001', 'VIO-001', 'BPL-001'])->delete();
    }
}; 