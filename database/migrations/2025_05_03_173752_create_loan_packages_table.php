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
        Schema::create('loan_packages', function (Blueprint $table) {
            $table->id();
             // Basic Package Information
             $table->string('name')->comment('Package name for display');
             $table->string('code')->unique()->comment('Unique package identifier');
             $table->text('description')->nullable()->comment('Detailed description of the package');
             $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
             
             // Package Type
             $table->enum('user_type', ['borrower', 'lender'])->comment('Which user type this package is for');
             
             // Amount Settings
             $table->decimal('min_amount', 20, 2)->comment('Minimum loan amount');
             $table->decimal('max_amount', 20, 2)->comment('Maximum loan amount');
             $table->foreignId('currency_id')->constrained()->comment('Currency for this package');
             
             // Duration Settings
             $table->integer('min_duration_days')->default(30)->comment('Minimum loan duration in days');
             $table->integer('max_duration_days')->default(365)->comment('Maximum loan duration in days');
             $table->boolean('has_fixed_duration')->default(false)->comment('Whether duration is fixed or flexible');
             $table->integer('fixed_duration_days')->nullable()->comment('Fixed duration in days if applicable');
             
             // Interest Rate Settings
             $table->decimal('interest_rate', 8, 4)->comment('Annual interest rate (e.g., 5.25 for 5.25%)');
             $table->enum('interest_type', ['simple', 'compound'])->default('simple');
             $table->enum('interest_calculation', ['daily', 'weekly', 'monthly', 'yearly'])->default('monthly');
             $table->enum('interest_payment_frequency', ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'end_of_term'])->default('monthly');
             
             // Additional Fees
             $table->boolean('has_origination_fee')->default(false);
             $table->enum('origination_fee_type', ['fixed', 'percentage'])->default('percentage')->comment('Type of origination fee');
             $table->decimal('origination_fee_fixed', 15, 2)->default(0)->comment('Fixed origination fee');
             $table->decimal('origination_fee_percentage', 8, 4)->default(0)->comment('Percentage origination fee');

             $table->enum('late_payment_fee_type', ['fixed', 'percentage'])->default('percentage')->comment('Type of late payment fee');
             $table->decimal('late_payment_fee_fixed', 15, 2)->default(0)->comment('Fixed late payment fee');
             $table->decimal('late_payment_fee_percentage', 8, 4)->default(0)->comment('Percentage late payment fee');
             $table->integer('grace_period_days')->default(0)->comment('Grace period for late payments before penalties');
             
             // Early Repayment
             $table->boolean('allows_early_repayment')->default(true);
             $table->enum('early_repayment_type', ['fixed', 'percentage'])->default('percentage')->comment('Type of early repayment fee');
             $table->decimal('early_repayment_fee_fixed', 15, 2)->default(0)->comment('Fixed early repayment fee');
             $table->decimal('early_repayment_fee_percentage', 8, 4)->default(0)->comment('Percentage early repayment fee');
             $table->integer('early_repayment_period_days')->default(0)->comment('Period for early repayment fee');
             
             // Collateral Requirements
             $table->boolean('requires_collateral')->default(false);
             $table->decimal('collateral_percentage', 8, 4)->nullable()->comment('Required collateral as percentage of loan');
             $table->text('collateral_requirements')->nullable();
             
             // Risk and Eligibility
             $table->integer('min_credit_score')->nullable();
             $table->decimal('min_income', 15, 2)->nullable();
             $table->integer('min_kyc_level')->default(1)->comment('Minimum KYC verification level required');
             $table->json('eligible_countries')->nullable()->comment('JSON array of eligible country codes');
             $table->enum('risk_level', ['low', 'medium', 'high'])->default('medium');
             
             // Availability Settings
             $table->boolean('is_active')->default(true);
             $table->timestamp('available_from')->nullable();
             $table->timestamp('available_until')->nullable();
             $table->integer('available_quantity')->nullable()->comment('Limited quantity if applicable');
             $table->integer('remaining_quantity')->nullable();
             
             // Display Settings
             $table->string('icon')->nullable()->comment('Icon for the package');
             $table->string('color_code')->nullable()->comment('Color for UI display');
             $table->integer('display_order')->default(0)->comment('Order for display in lists');
             $table->boolean('is_featured')->default(false)->comment('Whether to feature this package');
             
             // Terms and Documents
             $table->string('terms_document')->nullable()->comment('File path to terms document');
             $table->string('contract_template')->nullable()->comment('File path to contract template');
             
             // Standard timestamps
             $table->timestamps();
             $table->softDeletes();
             
             // Indexes
             $table->index('user_type');
             $table->index('is_active');
             $table->index('currency_id');
             $table->index('display_order');
         });
         
         // Ensure only one base currency
         Schema::table('loan_packages', function (Blueprint $table) {
             $table->unique(['code', 'deleted_at'], 'unique_loan_package_code');
         });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loan_packages');
    }
};
