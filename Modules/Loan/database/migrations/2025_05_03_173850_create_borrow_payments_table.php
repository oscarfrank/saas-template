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
        Schema::create('borrow_payments', function (Blueprint $table) {
            $table->id();
            // Borrow Association
            $table->foreignId('borrow_id')->constrained()->onDelete('cascade');
                        
            // Payment Identification
            $table->string('reference_number')->unique()->comment('Unique reference for this payment');
            $table->integer('payment_number')->comment('Sequential payment number in schedule');

            // Payment Amounts
            $table->decimal('amount', 20, 2)->comment('Total payment amount');
            $table->decimal('principal_amount', 20, 2)->comment('Principal portion of payment');
            $table->decimal('interest_amount', 20, 2)->comment('Interest portion of payment');
            $table->decimal('fee_amount', 20, 2)->default(0)->comment('Fee portion of payment');
            $table->decimal('additional_amount', 20, 2)->default(0)->comment('Any additional amount paid');
            $table->foreignId('currency_id')->constrained();

            // Scheduling Information
            $table->date('due_date')->comment('Date payment is due');
            $table->time('due_time')->nullable()->comment('Time payment is due if applicable');
            $table->date('payment_date')->nullable()->comment('Date payment was actually made');
            $table->time('payment_time')->nullable()->comment('Time payment was made');
            $table->integer('days_late')->default(0)->comment('Number of days payment was late');
            $table->boolean('is_overdue')->default(false)->comment('Whether payment is currently overdue');

            // Payment Status
            $table->enum('status', [
                'scheduled',    // Future payment not yet due
                'due',          // Payment is due today
                'pending',      // Payment initiated but not confirmed
                'processing',   // Payment being processed
                'completed',    // Payment successfully completed
                'failed',       // Payment attempt failed
                'cancelled',    // Payment was cancelled
                'delayed',      // Payment was delayed by platform
                'partial'       // Partial payment received
            ])->default('scheduled');

            // Payment Method
            $table->foreignId('payment_method_id')->nullable()->constrained('payment_methods')->nullOnDelete();
            $table->string('transaction_id')->nullable()->comment('External payment processor transaction ID');
            $table->string('receipt_number')->nullable()->comment('Receipt number for this payment');
            $table->string('confirmation_code')->nullable()->comment('Payment confirmation code');

            // Payment Type
            $table->enum('payment_type', [
                'interest',             // Regular interest payment
                'principal_return',     // Principal return at maturity
                'partial_principal',    // Early partial principal return
                'early_withdrawal',     // Early withdrawal payment
                'bonus',                // Bonus payment to investor
                'penalty',              // Penalty payment to investor for late platform payment
                'other'                 // Other payment type
            ])->default('interest');

            // For Manual Payments
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete()->comment('Admin who processed payment');
            $table->text('notes')->nullable()->comment('Additional notes about this payment');
            $table->string('attachment')->nullable()->comment('Path to payment proof attachment');

            // Payment Details
            $table->string('recipient_name')->nullable()->comment('Name of recipient');
            $table->string('recipient_email')->nullable()->comment('Email of recipient');
            $table->string('recipient_phone')->nullable()->comment('Phone of recipient');

            // Notifications
            $table->boolean('notification_sent')->default(false)->comment('Whether notification was sent');
            $table->timestamp('notification_sent_at')->nullable()->comment('When notification was sent');

            // For Failed Payments
            $table->string('failure_reason')->nullable()->comment('Reason for payment failure');
            $table->text('failure_details')->nullable()->comment('Detailed failure information');
            $table->integer('retry_count')->default(0)->comment('Number of retry attempts');
            $table->timestamp('next_retry_at')->nullable()->comment('When to retry next');

            // For Delayed Payments
            $table->integer('delay_days')->default(0)->comment('Number of days payment was delayed');
            $table->text('delay_reason')->nullable()->comment('Reason for payment delay');
            $table->decimal('penalty_amount', 20, 2)->default(0)->comment('Penalty amount for delay');

            // Automation
            $table->boolean('is_auto_payment')->default(false)->comment('Whether this is an automated payment');
            $table->boolean('auto_payment_scheduled')->default(false)->comment('Whether auto payment is scheduled');
            $table->timestamp('auto_payment_scheduled_for')->nullable()->comment('When auto payment is scheduled');

            // Investment Balance After Payment
            $table->decimal('principal_balance_after', 20, 2)->nullable()->comment('Principal balance after this payment');
            $table->decimal('interest_earned_to_date', 20, 2)->nullable()->comment('Total interest earned to date');

            // Finance Calculations
            $table->decimal('interest_rate_applied', 8, 4)->nullable()->comment('Interest rate applied for this period');
            $table->integer('days_in_period')->nullable()->comment('Number of days in this payment period');
            $table->decimal('annual_yield_equivalent', 8, 4)->nullable()->comment('Annualized yield for this payment');

            // Admin Actions
            $table->boolean('is_adjusted')->default(false)->comment('Whether payment was manually adjusted');
            $table->foreignId('adjusted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('adjusted_at')->nullable();
            $table->text('adjustment_reason')->nullable();
            $table->json('adjustment_history')->nullable()->comment('History of adjustments to this payment');

            // Tax Information
            $table->boolean('is_taxable')->default(true)->comment('Whether this payment is taxable');
            $table->decimal('tax_amount', 20, 2)->default(0)->comment('Tax amount withheld if applicable');
            $table->string('tax_reference')->nullable()->comment('Tax reference number');

            // System Fields
            $table->boolean('is_test_payment')->default(false)->comment('Whether this is a test payment');
            $table->json('metadata')->nullable()->comment('Additional payment metadata');
            $table->json('payment_response_data')->nullable()->comment('Raw response from payment processor');

            // Standard timestamps
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('borrow_id');
            $table->index('due_date');
            $table->index('payment_date');
            $table->index('status');
            $table->index(['borrow_id', 'payment_number']);
            $table->index('is_overdue');
            $table->index('transaction_id');
            $table->index('payment_type');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('borrow_payments');
    }
};
