<?php

namespace Database\Seeders;

use App\Models\Transaction;
use App\Models\User;
use App\Models\Currency;
use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class TransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();
        $currencies = Currency::all();
        $paymentMethods = PaymentMethod::all();

        $transactionTypes = [
            'loan_disbursement',
            'loan_repayment',
            'loan_interest_payment',
            'loan_fee_payment',
            'loan_late_fee',
            'investment_deposit',
            'interest_payout',
            'principal_return',
            'early_withdrawal',
            'investment_fee',
            'deposit',
            'withdrawal',
            'transfer',
            'fee',
            'adjustment',
            'refund',
            'reversal',
            'other'
        ];

        $statuses = [
            'pending',
            'processing',
            'completed',
            'failed',
            'cancelled',
            'reversed',
            'refunded'
        ];

        $categories = [
            'loan',
            'investment',
            'payment',
            'transfer',
            'fee',
            'adjustment',
            'refund',
            'other'
        ];

        for ($i = 0; $i < 20; $i++) {
            $user = $users->random();
            $currency = $currencies->random();
            $paymentMethod = $paymentMethods->random();
            $transactionType = $transactionTypes[array_rand($transactionTypes)];
            $status = $statuses[array_rand($statuses)];
            $category = $categories[array_rand($categories)];
            
            $amount = rand(1000, 1000000) / 100; // Random amount between 10 and 10000
            $feeAmount = $amount * (rand(1, 5) / 100); // Random fee between 1% and 5%
            $taxAmount = $amount * (rand(1, 3) / 100); // Random tax between 1% and 3%
            $netAmount = $amount - $feeAmount - $taxAmount;

            $initiatedAt = Carbon::now()->subDays(rand(0, 30));
            $processedAt = $status !== 'pending' ? $initiatedAt->copy()->addMinutes(rand(1, 60)) : null;
            $completedAt = $status === 'completed' ? $processedAt->copy()->addMinutes(rand(1, 60)) : null;
            $failedAt = $status === 'failed' ? $processedAt->copy()->addMinutes(rand(1, 60)) : null;
            $cancelledAt = $status === 'cancelled' ? $processedAt->copy()->addMinutes(rand(1, 60)) : null;

            Transaction::create([
                'reference_number' => 'TRX' . str_pad($i + 1, 8, '0', STR_PAD_LEFT),
                'user_id' => $user->id,
                'transaction_type' => $transactionType,
                'category' => $category,
                'amount' => $amount,
                'currency_id' => $currency->id,
                'fee_amount' => $feeAmount,
                'tax_amount' => $taxAmount,
                'net_amount' => $netAmount,
                'status' => $status,
                'payment_method_id' => $paymentMethod->id,
                'external_reference' => 'EXT' . str_pad($i + 1, 8, '0', STR_PAD_LEFT),
                'initiated_at' => $initiatedAt,
                'processed_at' => $processedAt,
                'completed_at' => $completedAt,
                'failed_at' => $failedAt,
                'cancelled_at' => $cancelledAt,
                'failure_reason' => $status === 'failed' ? 'Payment declined' : null,
                'failure_details' => $status === 'failed' ? 'Insufficient funds' : null,
                'created_by' => $user->id,
                'is_automatic' => rand(0, 1),
                'balance_before' => rand(1000, 1000000) / 100,
                'balance_after' => rand(1000, 1000000) / 100,
                'ip_address' => '192.168.1.' . rand(1, 255),
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'geo_location' => 'Lagos, Nigeria',
                'compliance_status' => 'approved',
                'requires_review' => rand(0, 1),
                'receipt_number' => 'RCP' . str_pad($i + 1, 8, '0', STR_PAD_LEFT),
                'receipt_url' => 'https://example.com/receipts/' . str_pad($i + 1, 8, '0', STR_PAD_LEFT),
                'receipt_sent' => rand(0, 1),
                'is_test_transaction' => false,
                'metadata' => [
                    'source' => 'web',
                    'device' => 'desktop',
                    'browser' => 'chrome',
                    'os' => 'windows'
                ]
            ]);
        }
    }
} 