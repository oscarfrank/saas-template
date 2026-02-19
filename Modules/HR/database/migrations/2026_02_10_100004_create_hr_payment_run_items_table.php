<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_payment_run_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_run_id')->constrained('hr_payment_runs')->onDelete('cascade');
            $table->foreignId('staff_id')->constrained('hr_staff')->onDelete('cascade');
            $table->decimal('amount', 14, 2);
            $table->string('currency', 3)->default('USD');
            $table->string('status', 32)->default('pending'); // pending, paid
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['payment_run_id']);
            $table->index(['staff_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_payment_run_items');
    }
};
