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
        Schema::create('borrows', function (Blueprint $table) {
            $table->id();
            // User and Package Associations
            $table->foreignId('user_id')->constrained()->comment('User who made the investment');
            $table->foreignId('package_id')->nullable()->constrained('borrow_packages')->nullOnDelete()->comment('Associated borrow package if standard');
            
            // Basic Investment Information
            $table->string('reference_number')->unique()->comment('Unique reference number for the investment');
            $table->text('investment_strategy')->nullable()->comment('Selected investment strategy if applicable');
            
            // Financial Details
            $table->decimal('amount', 20, 2)->comment('Investment amount');
            $table->foreignId('currency_id')->constrained()->comment('Currency of the investment');
            $table->decimal('interest_rate', 8, 4)->comment('Interest rate at time of approval');
            $table->enum('interest_type', ['simple', 'compound'])->default('simple');
            $table->enum('interest_calculation', ['daily', 'weekly', 'monthly', 'yearly'])->default('monthly');
            $table->enum('interest_payment_frequency', ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'end_of_term'])->default('monthly');
            
            // Duration Information
            $table->integer('duration_days')->comment('Investment duration in days');
            $table->date('start_date')->nullable()->comment('Actual start date of the investment');
            $table->date('end_date')->nullable()->comment('Expected end date of the investment');
            $table->date('actual_end_date')->nullable()->comment('Actual end date if different');
            
            // Fees
            $table->decimal('platform_fee_amount', 15, 2)->default(0)->comment('Platform fee amount');
            $table->decimal('management_fee_percentage', 8, 4)->default(0)->comment('Management fee percentage');
            $table->decimal('management_fee_amount', 15, 2)->default(0)->comment('Management fee amount');
            $table->decimal('early_withdrawal_fee_percentage', 8, 4)->default(0)->comment('Early withdrawal fee percentage');
            
            // Payment Details
            $table->foreignId('deposit_method_id')->nullable()->constrained('payment_methods')->nullOnDelete()->comment('Payment method for deposit');
            $table->foreignId('withdrawal_method_id')->nullable()->constrained('payment_methods')->nullOnDelete()->comment('Payment method for withdrawals');
            $table->integer('total_payments')->nullable()->comment('Total number of payments');
            $table->integer('completed_payments')->default(0)->comment('Number of completed payments');
            
            // Investment Status
            $table->enum('status', [
                'draft',              // Application started but not submitted
                'pending_approval',   // Submitted, awaiting admin review
                'approved',           // Approved but not yet funded
                'rejected',           // Application rejected
                'funded',             // Funds received, investment active
                'active',             // Investment is active
                'partially_withdrawn', // Partial early withdrawal
                'matured',            // Investment has reached maturity
                'closed',             // Investment closed and fully paid out
                'cancelled'           // Application cancelled before funding
            ])->default('draft');
            
            // Status Timestamps
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('funded_at')->nullable();
            $table->timestamp('matured_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            
            // Approval Information
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('approval_notes')->nullable();
            $table->text('rejection_reason')->nullable();
            
            // Deposit Details
            $table->string('deposit_transaction_id')->nullable()->comment('External transaction ID for deposit');
            $table->string('deposit_status')->nullable()->comment('Status of the deposit');
            
            // Performance Tracking
            $table->decimal('principal_invested', 20, 2)->default(0)->comment('Original principal amount');
            $table->decimal('principal_withdrawn', 20, 2)->default(0)->comment('Principal amount withdrawn early if any');
            $table->decimal('principal_remaining', 20, 2)->nullable()->comment('Principal amount remaining');
            $table->decimal('interest_earned', 20, 2)->default(0)->comment('Total interest earned so far');
            $table->decimal('interest_paid', 20, 2)->default(0)->comment('Total interest paid out so far');
            $table->decimal('fees_paid', 20, 2)->default(0)->comment('Total fees paid so far');
            $table->decimal('current_value', 20, 2)->nullable()->comment('Current investment value');
            $table->decimal('annual_yield_percentage', 8, 4)->nullable()->comment('Current annual yield percentage');
            
            // Performance Metrics
            $table->decimal('total_return', 20, 2)->nullable()->comment('Total return amount');
            $table->decimal('total_return_percentage', 8, 4)->nullable()->comment('Total return percentage');
            $table->decimal('annual_return_percentage', 8, 4)->nullable()->comment('Annualized return percentage');
            
            // Payment Schedule
            $table->date('next_payment_date')->nullable()->comment('Date of next scheduled payment');
            $table->decimal('next_payment_amount', 15, 2)->nullable()->comment('Amount of next scheduled payment');
            $table->date('last_payment_date')->nullable()->comment('Date of last payment received');
            $table->decimal('last_payment_amount', 15, 2)->nullable()->comment('Amount of last payment received');
            
            // Early Withdrawal
            $table->boolean('allows_early_withdrawal')->default(false);
            $table->integer('lock_period_days')->default(0)->comment('Minimum days before withdrawal is allowed');
            $table->boolean('has_early_withdrawal')->default(false)->comment('Whether investment had early withdrawal');
            $table->date('early_withdrawal_date')->nullable();
            $table->decimal('early_withdrawal_amount', 20, 2)->nullable();
            $table->decimal('early_withdrawal_fee', 15, 2)->nullable();
            
            // Risk and Portfolio
            $table->enum('risk_level', ['low', 'medium', 'high'])->default('medium');
            $table->json('portfolio_allocation')->nullable()->comment('Breakdown of loan types funded');
            
            // Contract and Documents
            $table->string('agreement_document')->nullable()->comment('Investment agreement document');
            $table->timestamp('agreement_signed_at')->nullable();
            
            // Communication
            $table->text('admin_notes')->nullable()->comment('Internal admin notes');
            $table->text('user_notes')->nullable()->comment('Notes from user');
            
            // Reinvestment Settings
            $table->boolean('auto_reinvest')->default(false)->comment('Whether to automatically reinvest');
            $table->enum('reinvest_option', ['principal_only', 'interest_only', 'both', 'none'])->default('none');
            $table->foreignId('reinvest_package_id')->nullable()->constrained('borrow_packages')->nullOnDelete();
            
            // Tax Information
            $table->boolean('tax_withholding_required')->default(false);
            $table->decimal('tax_withholding_rate', 8, 4)->nullable();
            $table->string('tax_id')->nullable()->comment('Tax ID of investor');
            $table->string('tax_form_type')->nullable()->comment('Type of tax form');
            $table->boolean('tax_form_submitted')->default(false);
            
            // Security and Verification
            $table->boolean('requires_2fa')->default(false)->comment('Whether withdrawals require 2FA');
            $table->boolean('withdrawal_address_whitelisted')->default(false);
            
            // System Fields
            $table->boolean('is_test_investment')->default(false)->comment('Whether this is a test investment');
            $table->json('metadata')->nullable()->comment('Additional metadata');
            
            // Standard timestamps
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('user_id');
            $table->index('status');
            $table->index('start_date');
            $table->index('end_date');
            $table->index('reference_number');
            $table->index('risk_level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('borrows');
    }
};
