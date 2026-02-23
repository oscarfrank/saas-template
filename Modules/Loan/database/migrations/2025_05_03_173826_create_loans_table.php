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
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreign('tenant_id')
                    ->references('id')
                    ->on('tenants')
                    ->onUpdate('cascade')
                    ->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->comment('User who applied for the loan');
            $table->foreignId('package_id')->nullable()->constrained('loan_packages')->nullOnDelete()->comment('Associated loan package if standard');
            
            // Basic Loan Information
            $table->string('reference_number')->unique()->comment('Unique reference number for the loan');
            $table->text('purpose')->nullable()->comment('Purpose of the loan');
            
            // Financial Details
            $table->decimal('amount', 20, 2)->comment('Loan amount');
            $table->decimal('current_balance', 20, 2)->default(0)->comment('Current outstanding balance including principal and interest');
            $table->foreignId('currency_id')->constrained()->comment('Currency of the loan');
            $table->decimal('interest_rate', 8, 4)->comment('Interest rate at time of approval');
            $table->enum('interest_type', ['simple', 'compound'])->default('simple');
            $table->enum('interest_calculation', ['daily', 'weekly', 'monthly', 'yearly'])->default('monthly');
            $table->enum('interest_payment_frequency', ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'end_of_term'])->default('monthly');
            
            // Duration Information
            $table->integer('duration_days')->comment('Loan duration in days');
            $table->date('start_date')->nullable()->comment('Actual start date of the loan');
            $table->date('end_date')->nullable()->comment('Expected end date of the loan');
            
            // Fees
            $table->decimal('origination_fee_amount', 15, 2)->default(0)->comment('Actual origination fee amount');
            $table->decimal('platform_fee_amount', 15, 2)->default(0)->comment('Platform fee amount');
            $table->decimal('late_payment_fee_fixed', 15, 2)->default(0)->comment('Fixed late payment fee');
            $table->decimal('late_payment_fee_percentage', 8, 4)->default(0)->comment('Percentage late payment fee');
            $table->integer('grace_period_days')->default(0)->comment('Grace period for late payments');
            
            // Payment Details
            $table->foreignId('payment_method_id')->nullable()->constrained('payment_methods')->nullOnDelete()->comment('Payment method for disbursement');
            $table->foreignId('repayment_method_id')->nullable()->constrained('payment_methods')->nullOnDelete()->comment('Payment method for repayments');
            
            // Loan Status
            $table->enum('status', [
                'pending',   // Submitted, awaiting admin review
                'approved',           // Approved but not yet disbursed
                'rejected',           // Application rejected
                'active',             // Loan is active and in good standing
                'in_arrears',         // Loan has missed payments
                'defaulted',          // Loan is in default
                'paid',               // Loan fully paid
                'cancelled'           // Application cancelled before disbursement
            ])->default('pending');
            
            // Status Timestamps
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('defaulted_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            
            // Approval Information
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('approval_notes')->nullable();
            $table->text('rejection_reason')->nullable();
            
            // Disbursement Details
            $table->string('disbursement_transaction_id')->nullable()->comment('External transaction ID for disbursement');
            
            // Payment Tracking
            $table->decimal('principal_paid', 20, 2)->default(0)->comment('Amount of principal paid so far');
            $table->decimal('interest_paid', 20, 2)->default(0)->comment('Amount of interest paid so far');
            $table->decimal('fees_paid', 20, 2)->default(0)->comment('Amount of fees paid so far');
            $table->integer('completed_payments')->default(0)->comment('Number of completed payments');
            
            // Delinquency Tracking
            $table->date('next_payment_due_date')->nullable()->comment('Date when next payment is due');
            $table->decimal('next_payment_amount', 15, 2)->nullable()->comment('Amount of next payment due');
            $table->date('last_payment_date')->nullable()->comment('Date of last payment received');
            $table->decimal('last_payment_amount', 15, 2)->nullable()->comment('Amount of last payment received');
            
            // Early Repayment
            $table->boolean('allows_early_repayment')->default(true);
            $table->decimal('early_repayment_fee_percentage', 8, 4)->default(0);
            $table->integer('early_repayment_fixed_fee')->default(0);
            $table->integer('early_repayment_period_days')->default(0);
            $table->boolean('has_early_repayment')->default(false)->comment('Whether loan was repaid early');
            
            // Collateral
            $table->boolean('has_collateral')->default(false);
            $table->text('collateral_description')->nullable();
            $table->decimal('collateral_value', 20, 2)->nullable();
            $table->string('collateral_document')->nullable()->comment('Document proving collateral');
            
            // Contract and Documents
            $table->string('contract_document')->nullable()->comment('Loan agreement document');
            
            // Communication
            $table->text('admin_notes')->nullable()->comment('Internal admin notes');
            
            // Auto-payments
            $table->boolean('auto_payments_enabled')->default(false);
            $table->date('auto_payment_start_date')->nullable();
            
            // System Fields
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
            $table->index('days_past_due');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loans');
        $table->dropForeign(['tenant_id']);
        $table->dropColumn('tenant_id');
    }
};
