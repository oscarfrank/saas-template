<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained()->onDelete('cascade');
            $table->foreignId('payment_method_id')->constrained()->onDelete('restrict');
            $table->string('reference_number')->unique();
            $table->integer('payment_number')->comment('Sequential payment number in schedule');
            $table->decimal('amount', 20, 2);
            $table->decimal('interest_amount', 20, 2)->default(0);
            $table->decimal('principal_amount', 20, 2)->default(0);
            $table->decimal('fees_amount', 20, 2)->default(0);
            $table->decimal('late_fee_amount', 20, 2)->default(0);
            $table->decimal('early_payment_fee_amount', 20, 2)->default(0);
            $table->decimal('additional_amount', 20, 2)->default(0);
            $table->foreignId('currency_id')->constrained();
            $table->date('due_date')->comment('Date payment is due');
            $table->time('due_time')->nullable()->comment('Time payment is due if applicable');
            $table->date('payment_date');
            $table->time('payment_time')->nullable();
            $table->integer('days_late')->default(0);
            $table->boolean('is_overdue')->default(false);
            $table->enum('status', [
                'scheduled',    // Future payment not yet due
                'due',          // Payment is due today
                'pending',      // Payment initiated but not confirmed
                'processing',   // Payment being processed
                'completed',    // Payment successfully completed
                'failed',       // Payment attempt failed
                'cancelled',    // Payment was cancelled
                'waived',       // Payment was waived by admin
                'partial'       // Partial payment received
            ])->default('scheduled');
            $table->string('transaction_id')->nullable()->comment('External payment processor transaction ID');
            $table->string('receipt_number')->nullable();
            $table->string('check_number')->nullable();
            $table->string('confirmation_code')->nullable();
            $table->text('notes')->nullable();
            $table->string('proof_file')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('restrict');
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->string('payer_name')->nullable();
            $table->string('payer_email')->nullable();
            $table->string('payer_phone')->nullable();
            $table->string('payment_source')->nullable();
            $table->boolean('reminder_sent')->default(false);
            $table->timestamp('last_reminder_sent_at')->nullable();
            $table->integer('reminder_count')->default(0);
            $table->string('failure_reason')->nullable();
            $table->text('failure_details')->nullable();
            $table->integer('retry_count')->default(0);
            $table->timestamp('next_retry_at')->nullable();
            $table->boolean('is_auto_payment')->default(false);
            $table->boolean('auto_payment_scheduled')->default(false);
            $table->timestamp('auto_payment_scheduled_for')->nullable();
            $table->decimal('principal_balance_after', 20, 2)->nullable();
            $table->decimal('total_balance_after', 20, 2)->nullable();
            $table->decimal('interest_rate_applied', 8, 4)->nullable();
            $table->integer('days_in_period')->nullable();
            $table->boolean('is_adjusted')->default(false);
            $table->foreignId('adjusted_by')->nullable()->constrained('users')->onDelete('restrict');
            $table->timestamp('adjusted_at')->nullable();
            $table->text('adjustment_reason')->nullable();
            $table->json('adjustment_history')->nullable();
            $table->boolean('is_test_payment')->default(false);
            $table->json('metadata')->nullable();
            $table->json('payment_response_data')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('loan_id');
            $table->index('status');
            $table->index('payment_date');
            $table->index('reference_number');
            $table->index('due_date');
            $table->index('is_overdue');
            $table->index('transaction_id');
            $table->index(['loan_id', 'payment_number']);
        });

        // Create payment schedule table for future/planned payments
        Schema::create('loan_payment_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained()->onDelete('cascade');
            $table->integer('payment_number');
            $table->date('due_date');
            $table->decimal('total_amount', 20, 2);
            $table->decimal('principal_amount', 20, 2);
            $table->decimal('interest_amount', 20, 2);
            $table->decimal('fee_amount', 20, 2)->default(0);
            $table->decimal('expected_balance_after', 20, 2);
            $table->foreignId('currency_id')->constrained();
            $table->string('notes')->nullable();
            $table->boolean('is_generated')->default(true)->comment('Whether this was auto-generated or manually added');
            $table->timestamps();
            
            // Indexes
            $table->index('loan_id');
            $table->index('due_date');
            $table->unique(['loan_id', 'payment_number']);
        });

        // Add payment method fields
        Schema::table('payment_methods', function (Blueprint $table) {
            if (!Schema::hasColumn('payment_methods', 'is_online')) {
                $table->boolean('is_online')->default(false)->after('method_type');
            }
            if (!Schema::hasColumn('payment_methods', 'callback_url')) {
                $table->string('callback_url')->nullable()->after('is_online');
            }
            if (!Schema::hasColumn('payment_methods', 'configuration')) {
                $table->json('configuration')->nullable()->after('callback_url');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_payment_schedules');
        Schema::dropIfExists('loan_payments');
        
        Schema::table('payment_methods', function (Blueprint $table) {
            $table->dropColumn(['method_type', 'is_online', 'callback_url', 'configuration']);
        });
    }
}; 