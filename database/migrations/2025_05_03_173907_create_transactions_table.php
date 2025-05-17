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
            
            // For Internal Transfers
            $table->foreignId('sender_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('recipient_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('sender_account')->nullable();
            $table->string('recipient_account')->nullable();
            
            // Admin and System Information
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete()->comment('User who created this transaction');
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete()->comment('Admin who processed transaction if manual');
            
            // Balance Information
            $table->decimal('balance_before', 20, 2)->nullable()->comment('User balance before transaction');
            $table->decimal('balance_after', 20, 2)->nullable()->comment('User balance after transaction');
            
            // For Adjustments
            $table->text('adjustment_reason')->nullable();
            $table->foreignId('adjusted_by')->nullable()->constrained('users')->nullOnDelete();

            // System Fields
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
