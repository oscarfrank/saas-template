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
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Payment Method Type
            $table->enum('method_type', [
                'bank_account', 
                'credit_card', 
                'debit_card', 
                'crypto_wallet',
                'mobile_money',
                'payment_gateway'
            ]);
            
            // Method Name (for user reference)
            $table->string('name')->nullable();
            $table->boolean('is_default')->default(false);
            
            // Common Payment Details
            $table->string('account_number')->nullable();
            $table->string('account_holder_name')->nullable();
            
            // Bank Account Details
            $table->string('bank_name')->nullable();
            $table->string('routing_number')->nullable();
            $table->string('swift_bic_code')->nullable();
            
            // Card Details
            $table->string('card_type')->nullable();
            $table->string('card_last_four')->nullable();
            $table->string('card_expiry_month')->nullable();
            $table->string('card_expiry_year')->nullable();
            $table->string('card_token')->nullable();
            
            // Crypto Wallet Details
            $table->string('crypto_currency')->nullable();
            $table->string('wallet_address')->nullable();
            
            // Mobile Money Details
            $table->string('mobile_provider')->nullable();
            $table->string('mobile_number')->nullable();
            
            // Payment Gateway Details
            $table->string('gateway_name')->nullable();
            $table->string('gateway_email')->nullable();
            
            // Verification Status
            $table->boolean('is_verified')->default(false);
            $table->timestamp('verified_at')->nullable();
            
            // Currency
            $table->foreignId('currency_id')->nullable()->constrained()->nullOnDelete();
            
            // Security & Limits
            $table->decimal('daily_limit', 15, 2)->nullable();
            $table->decimal('monthly_limit', 15, 2)->nullable();
            
            // Status
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_used_at')->nullable();
            
            // Standard timestamps
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('method_type');
            $table->index('is_default');
            $table->index('is_active');
        });

        // Enforce only one default payment method per user
        Schema::table('payment_methods', function (Blueprint $table) {
            $table->unique(['user_id', 'is_default'], 'unique_default_payment_method_per_user');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};
