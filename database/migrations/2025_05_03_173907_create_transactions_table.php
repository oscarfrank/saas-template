<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            // Basic Transaction Information
            $table->string('reference_number')->unique()->comment('Unique transaction reference');
            $table->foreignId('user_id')->constrained()->comment('User associated with this transaction');
            
            // Transaction Type and Category
            $table->enum('transaction_type', [
                // Loan-related transactions
                'loan_disbursement',      // Platform pays out loan to user
                'loan_repayment',         // User repays loan (principal)
                'loan_interest_payment',  // User pays interest on loan
                'loan_fee_payment',       // User pays fees on loan
                'loan_late_fee',          // User pays late fees
                
                // Investment-related transactions
                'investment_deposit',      // User deposits funds for investment
                'interest_payout',         // Platform pays interest to investor
                'principal_return',        // Platform returns principal to investor
                'early_withdrawal',        // Investor withdraws early
                'investment_fee',          // Investor pays fees
                
                // General transactions
                'deposit',                // User deposits funds to platform
                'withdrawal',             // User withdraws funds from platform
                'transfer',               // Internal transfer between users
                'fee',                    // General fee payment
                'adjustment',             // Manual adjustment by admin
                'refund',                 // Refund to user
                'reversal',               // Transaction reversal
                'other'                   // Other transaction type
            ])->comment('Type of transaction');
            
            $table->string('category')->nullable()->comment('Additional transaction categorization');
            
            // Amount Information
            $table->decimal('amount', 20, 2)->comment('Transaction amount');
            $table->foreignId('currency_id')->constrained()->comment('Currency of transaction');
            $table->decimal('fee_amount', 15, 2)->default(0)->comment('Fee amount for this transaction');
            $table->decimal('tax_amount', 15, 2)->default(0)->comment('Tax amount for this transaction');
            $table->decimal('net_amount', 20, 2)->comment('Net amount after fees and taxes');
            
            // Exchange Rate Information (for currency conversions)
            $table->decimal('exchange_rate', 20, 10)->nullable()->comment('Exchange rate if currency conversion');
            $table->foreignId('original_currency_id')->nullable()->constrained('currencies')->nullOnDelete();
            $table->decimal('original_amount', 20, 2)->nullable()->comment('Original amount before conversion');
            
            // Related Entities
            $table->foreignId('loan_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('loan_payment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('borrow_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('borrow_payment_id')->nullable()->constrained()->nullOnDelete();
            
            // Transaction Status
            $table->enum('status', [
                'pending',      // Transaction initiated but not completed
                'processing',   // Transaction in progress
                'completed',    // Transaction successfully completed
                'failed',       // Transaction failed
                'cancelled',    // Transaction cancelled
                'reversed',     // Transaction reversed
                'refunded'      // Transaction refunded
            ])->default('pending');
            
            // Payment Method
            $table->foreignId('payment_method_id')->nullable()->constrained('payment_methods')->nullOnDelete();
            $table->string('external_reference')->nullable()->comment('External payment processor reference');
            $table->string('payment_source')->nullable()->comment('Source of the payment');
            $table->string('payment_destination')->nullable()->comment('Destination of the payment');
            
            // Timestamps
            $table->timestamp('initiated_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            
            // Processing Information
            $table->string('processor')->nullable()->comment('Payment processor used');
            $table->string('processor_fee')->nullable()->comment('Fee charged by processor');
            $table->string('processor_response_code')->nullable();
            $table->text('processor_response_message')->nullable();
            $table->json('processor_response_data')->nullable();
            
            // For Failed Transactions
            $table->string('failure_reason')->nullable();
            $table->text('failure_details')->nullable();
            $table->boolean('retry_attempted')->default(false);
            $table->integer('retry_count')->default(0);
            
            // For Internal Transfers
            $table->foreignId('sender_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('recipient_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('sender_account')->nullable();
            $table->string('recipient_account')->nullable();
            
            // Admin and System Information
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete()->comment('User who created this transaction');
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete()->comment('Admin who processed transaction if manual');
            $table->boolean('is_automatic')->default(true)->comment('Whether transaction was automatic');
            $table->text('admin_notes')->nullable()->comment('Internal notes about this transaction');
            
            // Balance Information
            $table->decimal('balance_before', 20, 2)->nullable()->comment('User balance before transaction');
            $table->decimal('balance_after', 20, 2)->nullable()->comment('User balance after transaction');
            
            // For Adjustments
            $table->text('adjustment_reason')->nullable();
            $table->foreignId('adjusted_by')->nullable()->constrained('users')->nullOnDelete();
            
            // For Compliance and Reporting
            $table->string('ip_address')->nullable()->comment('IP address of user');
            $table->string('user_agent')->nullable()->comment('User agent information');
            $table->string('geo_location')->nullable()->comment('Geolocation information');
            $table->string('compliance_status')->nullable()->comment('AML/KYC compliance status');
            $table->boolean('requires_review')->default(false)->comment('Whether transaction requires manual review');
            $table->text('review_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            
            // Receipt and Documentation
            $table->string('receipt_number')->nullable();
            $table->string('receipt_url')->nullable();
            $table->boolean('receipt_sent')->default(false);
            
            // System Fields
            $table->boolean('is_test_transaction')->default(false)->comment('Whether this is a test transaction');
            $table->json('metadata')->nullable()->comment('Additional transaction metadata');
            
            // Standard timestamps
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('user_id');
            $table->index('transaction_type');
            $table->index('status');
            $table->index('reference_number');
            $table->index('external_reference');
            $table->index(['loan_id', 'loan_payment_id']);
            $table->index(['borrow_id', 'borrow_payment_id']);
            $table->index('payment_method_id');
            $table->index('initiated_at');
            $table->index('completed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
