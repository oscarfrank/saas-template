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
        Schema::create('custom_packages', function (Blueprint $table) {
            $table->id();
// Basic Package Information
            $table->string('name')->comment('Custom package name');
            $table->string('code')->unique()->comment('Unique package identifier');
            $table->text('description')->nullable()->comment('Detailed description of the custom offer');
            
            // User Associations
            $table->foreignId('user_id')->constrained()->comment('User this package is offered to');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete()->comment('Admin who created this offer');
            
            // Package Type
            $table->enum('user_type', ['borrower', 'lender'])->comment('Whether this is for a borrower or lender');
            
            // Amount Settings
            $table->decimal('amount', 20, 2)->comment('Specific amount for this custom package');
            $table->foreignId('currency_id')->constrained()->comment('Currency for this package');
            
            // Duration Settings
            $table->integer('duration_days')->comment('Duration in days');
            $table->date('start_date')->nullable()->comment('Proposed start date');
            $table->date('end_date')->nullable()->comment('Calculated end date');
            
            // Interest Rate Settings
            $table->decimal('interest_rate', 8, 4)->comment('Custom interest rate (e.g., 5.25 for 5.25%)');
            $table->enum('interest_type', ['simple', 'compound'])->default('simple');
            $table->enum('interest_calculation', ['daily', 'weekly', 'monthly', 'yearly'])->default('monthly');
            $table->enum('interest_payment_frequency', ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'end_of_term'])->default('monthly');
            
            // Additional Fees
            $table->decimal('origination_fee_fixed', 15, 2)->default(0)->comment('Fixed origination fee');
            $table->decimal('origination_fee_percentage', 8, 4)->default(0)->comment('Percentage origination fee');
            $table->decimal('platform_fee_fixed', 15, 2)->default(0)->comment('Fixed platform fee');
            $table->decimal('platform_fee_percentage', 8, 4)->default(0)->comment('Percentage platform fee');
            $table->decimal('late_payment_fee_fixed', 15, 2)->default(0)->comment('Fixed late payment fee');
            $table->decimal('late_payment_fee_percentage', 8, 4)->default(0)->comment('Percentage late payment fee');
            $table->integer('grace_period_days')->default(0)->comment('Grace period before penalties');
            
            // Early Repayment/Withdrawal
            $table->boolean('allows_early_repayment')->default(true)->comment('For lenders');
            $table->decimal('early_repayment_fee_percentage', 8, 4)->default(0);
            $table->boolean('allows_early_withdrawal')->default(false)->comment('For borrowers');
            $table->decimal('early_withdrawal_fee_percentage', 8, 4)->default(0);
            
            // Special Terms
            $table->text('special_terms')->nullable()->comment('Any special terms for this custom offer');
            $table->text('collateral_requirements')->nullable()->comment('Custom collateral requirements if any');
            
            // Package Status
            $table->enum('status', ['draft', 'pending', 'accepted', 'rejected', 'expired', 'completed'])->default('draft');
            $table->timestamp('offered_at')->nullable()->comment('When this was offered to the user');
            $table->timestamp('expires_at')->nullable()->comment('Offer expiration date');
            $table->timestamp('responded_at')->nullable()->comment('When user responded to the offer');
            $table->text('rejection_reason')->nullable()->comment('If rejected by user');
            
            // Associated entities
            $table->foreignId('loan_id')->nullable()->comment('Associated loan if accepted');
            $table->foreignId('borrow_id')->nullable()->comment('Associated borrow if accepted');
            
            // Documents
            $table->string('contract_document')->nullable()->comment('Custom contract document');
            
            // Approval Process
            $table->boolean('requires_admin_approval')->default(false)->comment('Whether admin needs to approve after user accepts');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            
            // Negotiation History
            $table->json('negotiation_history')->nullable()->comment('Record of any changes during negotiation');
            $table->integer('version')->default(1)->comment('Version of this offer if renegotiated');
            
            // Communication
            $table->text('admin_notes')->nullable()->comment('Internal notes for admins');
            $table->text('user_message')->nullable()->comment('Message to user with the offer');
            
            // Standard timestamps
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('user_id');
            $table->index('user_type');
            $table->index('status');
            $table->index('expires_at');
        });
        
        // Ensure unique code
        Schema::table('custom_packages', function (Blueprint $table) {
            $table->unique(['code', 'deleted_at'], 'unique_custom_package_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('custom_packages');
    }
};
