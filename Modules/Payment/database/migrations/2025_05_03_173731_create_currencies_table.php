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
        Schema::create('currencies', function (Blueprint $table) {
            $table->id();
            // Basic Currency Information
            $table->string('code', 10)->unique()->comment('ISO currency code (USD, EUR, BTC)');
            $table->string('name', 100)->comment('Full currency name');
            $table->string('symbol', 10)->comment('Currency symbol ($, €, ₿)');

            // Currency Type
            $table->enum('type', ['fiat', 'crypto', 'other'])->default('fiat');
            
            // Display Settings
            $table->tinyInteger('decimal_places')->default(2)->comment('Number of decimal places to display');
            $table->string('decimal_separator', 1)->default('.')->comment('Symbol for decimal separator');
            $table->string('thousand_separator', 1)->default(',')->comment('Symbol for thousand separator');
            $table->enum('symbol_position', ['before', 'after'])->default('before')->comment('Position of currency symbol');
            
            // Exchange Rate Information
            $table->boolean('is_base_currency')->default(false)->comment('Is this the base currency for conversions');
            $table->decimal('exchange_rate_to_base', 20, 10)->default(1.00)->comment('Exchange rate to base currency');
            $table->timestamp('exchange_rate_updated_at')->nullable()->comment('When the exchange rate was last updated');
            
            // Crypto-specific fields
            $table->string('blockchain_network')->nullable()->comment('Network/blockchain name for crypto');
            $table->integer('confirmation_blocks')->nullable()->comment('Required confirmations for crypto transactions');
            
            // Status and System Information
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);

            // Limits
            $table->decimal('min_transaction_amount', 20, 8)->nullable();
            $table->decimal('max_transaction_amount', 20, 8)->nullable();
            
            // Fees
            $table->decimal('withdrawal_fee_fixed', 20, 10)->nullable()->comment('Fixed fee for withdrawals');
            $table->decimal('withdrawal_fee_percent', 8, 6)->nullable()->comment('Percentage fee for withdrawals');
            $table->decimal('deposit_fee_fixed', 20, 10)->nullable()->comment('Fixed fee for deposits');
            $table->decimal('deposit_fee_percent', 8, 6)->nullable()->comment('Percentage fee for deposits');
            
            // Risk and Compliance
            $table->enum('risk_level', ['low', 'medium', 'high'])->default('low');
            $table->boolean('requires_enhanced_verification')->default(false);
            
            // Metadata
            $table->text('description')->nullable();
            $table->json('additional_info')->nullable();
            $table->string('icon')->nullable()->comment('Path to currency icon');
            
            // Standard timestamps
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('type');
            $table->index('is_active');
            $table->index('is_base_currency');
        });
        
        // Ensure only one base currency
        Schema::table('currencies', function (Blueprint $table) {
            $table->unique(['is_base_currency', 'deleted_at'], 'unique_base_currency');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('currencies');
    }
};
