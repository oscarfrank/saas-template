<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Standalone / historical payslips attached to staff. Can be generated for past periods,
     * edited to reflect what was actually paid, and viewed from the staff profile.
     */
    public function up(): void
    {
        Schema::create('hr_payslips', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('staff_id')->constrained('hr_staff')->onDelete('cascade');
            $table->date('period_start');
            $table->date('period_end');
            $table->string('currency', 3)->default('USD');
            $table->decimal('gross', 14, 2)->default(0);
            $table->decimal('net_amount', 14, 2);
            $table->decimal('deductions_total', 14, 2)->default(0);
            $table->json('allowances_detail')->nullable(); // [{"name":"...","amount":...}]
            $table->json('deductions_detail')->nullable();  // [{"name":"...","amount":...}]
            $table->string('tax_id', 64)->nullable();
            $table->string('bank_name', 128)->nullable();
            $table->string('bank_account_number', 64)->nullable();
            $table->string('bank_account_name', 128)->nullable();
            $table->string('pay_frequency', 32)->nullable();
            $table->string('narration', 255)->nullable();
            $table->date('date_paid')->nullable();
            $table->string('payment_method', 32)->nullable();
            $table->boolean('prorate')->default(false);
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onUpdate('cascade')
                ->onDelete('cascade');
            $table->index(['tenant_id', 'staff_id']);
            $table->index(['staff_id', 'period_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_payslips');
    }
};
