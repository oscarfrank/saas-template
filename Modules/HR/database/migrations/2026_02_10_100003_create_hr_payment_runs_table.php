<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_payment_runs', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->date('period_start');
            $table->date('period_end');
            $table->string('status', 32)->default('draft'); // draft, processed
            $table->decimal('total_amount', 14, 2)->default(0);
            $table->string('currency', 3)->default('USD');
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onUpdate('cascade')
                ->onDelete('cascade');
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_payment_run_items');
        Schema::dropIfExists('hr_payment_runs');
    }
};
