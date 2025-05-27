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
        Schema::create('flutterwave_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_id')->nullable()->index();
            $table->string('tx_ref')->index();
            $table->string('flw_ref')->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3);
            $table->decimal('charged_amount', 10, 2)->nullable();
            $table->decimal('app_fee', 10, 2)->nullable();
            $table->decimal('merchant_fee', 10, 2)->nullable();
            $table->string('processor_response')->nullable();
            $table->string('auth_model')->nullable();
            $table->string('payment_type')->nullable();
            $table->string('narration')->nullable();
            $table->string('status');
            $table->timestamp('payment_created_at')->nullable();
            $table->string('account_id')->nullable();
            $table->string('customer_id')->nullable();
            $table->string('customer_name')->nullable();
            $table->string('customer_email')->nullable();
            $table->string('customer_phone')->nullable();
            $table->nullableMorphs('transactable');
            $table->json('meta')->nullable();
            $table->json('card')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('flutterwave_transactions');
    }
};