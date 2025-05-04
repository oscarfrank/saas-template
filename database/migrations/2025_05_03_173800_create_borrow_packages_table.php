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
        Schema::create('borrow_packages', function (Blueprint $table) {
            $table->id();
            // Basic Package Information
            $table->string('name')->comment('Package name for display');
            $table->string('code')->unique()->comment('Unique package identifier');
            $table->text('description')->nullable()->comment('Detailed description of the package');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            
            // Package Type - Always for borrowers
            $table->enum('user_type', ['borrower'])->default('borrower')->comment('This table is for users investing in the platform');
            
            // Amount Settings
            $table->decimal('min_amount', 20, 2)->comment('Minimum investment amount');
            $table->decimal('max_amount', 20, 2)->comment('Maximum investment amount');
            $table->foreignId('currency_id')->constrained()->comment('Currency for this package');
            
            // Duration Settings
            $table->integer('min_duration_days')->default(30)->comment('Minimum investment duration in days');
            $table->integer('max_duration_days')->default(365)->comment('Maximum investment duration in days');
            $table->boolean('has_fixed_duration')->default(false)->comment('Whether duration is fixed or flexible');
            $table->integer('fixed_duration_days')->nullable()->comment('Fixed duration in days if applicable');
            
            // Interest Rate Settings
            $table->decimal('interest_rate', 8, 4)->comment('Annual interest rate paid to investor (e.g., 5.25 for 5.25%)');
            $table->enum('interest_type', ['simple', 'compound'])->default('simple');
            $table->enum('interest_calculation', ['daily', 'weekly', 'monthly', 'yearly'])->default('monthly');
            $table->enum('interest_payment_frequency', ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'end_of_term'])->default('monthly');
            
            // Additional Fees
            $table->decimal('platform_fee_fixed', 15, 2)->default(0)->comment('Fixed platform fee');
            $table->decimal('platform_fee_percentage', 8, 4)->default(0)->comment('Percentage platform fee');
            $table->decimal('early_withdrawal_fee_fixed', 15, 2)->default(0)->comment('Fixed early withdrawal fee');
            $table->decimal('early_withdrawal_fee_percentage', 8, 4)->default(0)->comment('Percentage early withdrawal fee');
            
            // Early Withdrawal
            $table->boolean('allows_early_withdrawal')->default(false);
            $table->integer('lock_period_days')->default(0)->comment('Minimum days before withdrawal is allowed');
            $table->decimal('min_withdrawal_amount', 15, 2)->nullable()->comment('Minimum withdrawal amount if partial is allowed');
            $table->boolean('allows_partial_withdrawal')->default(false);
            
            // Investment Security
            $table->boolean('is_principal_guaranteed')->default(false);
            $table->text('guarantee_details')->nullable();
            $table->enum('risk_level', ['low', 'medium', 'high'])->default('medium');
            $table->text('risk_disclosure')->nullable();
            
            // Eligibility
            $table->integer('min_kyc_level')->default(1)->comment('Minimum KYC verification level required');
            $table->json('eligible_countries')->nullable()->comment('JSON array of eligible country codes');
            $table->decimal('min_net_worth', 15, 2)->nullable()->comment('Minimum net worth required if applicable');
            $table->boolean('requires_accredited_investor')->default(false);
            
            // Funding Details
            $table->enum('funding_type', ['open', 'fixed'])->default('open')->comment('Open (ongoing) or fixed (one-time) funding');
            $table->decimal('funding_target', 20, 2)->nullable()->comment('Target amount to raise if fixed');
            $table->decimal('current_funding', 20, 2)->default(0)->comment('Current amount raised');
            $table->decimal('utilization_rate', 8, 4)->default(0)->comment('Percentage of funds currently deployed');
            
            // Availability Settings
            $table->boolean('is_active')->default(true);
            $table->timestamp('available_from')->nullable();
            $table->timestamp('available_until')->nullable();
            $table->integer('available_slots')->nullable()->comment('Limited number of investors if applicable');
            $table->integer('remaining_slots')->nullable();
            
            // Purpose & Usage
            $table->text('funds_usage')->nullable()->comment('Description of how funds will be used');
            $table->json('loan_allocation')->nullable()->comment('JSON breakdown of loan allocation');
            
            // Display Settings
            $table->string('icon')->nullable()->comment('Icon for the package');
            $table->string('color_code')->nullable()->comment('Color for UI display');
            $table->integer('display_order')->default(0)->comment('Order for display in lists');
            $table->boolean('is_featured')->default(false)->comment('Whether to feature this package');
            
            // Performance Metrics
            $table->decimal('historical_return', 8, 4)->nullable()->comment('Historical return percentage if applicable');
            $table->decimal('default_rate', 8, 4)->nullable()->comment('Historical default rate if applicable');
            
            // Terms and Documents
            $table->string('terms_document')->nullable()->comment('File path to terms document');
            $table->string('prospectus_document')->nullable()->comment('File path to prospectus if applicable');
            
            // Standard timestamps
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('is_active');
            $table->index('currency_id');
            $table->index('risk_level');
            $table->index('display_order');
        });
        
        // Ensure unique code
        Schema::table('borrow_packages', function (Blueprint $table) {
            $table->unique(['code', 'deleted_at'], 'unique_borrow_package_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('borrow_packages');
    }
};
