<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_staff_position_history', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('staff_id')->constrained('hr_staff')->onDelete('cascade');
            $table->string('job_title', 128)->nullable();
            $table->string('department', 128)->nullable();
            $table->date('started_at')->nullable();
            $table->date('ended_at')->nullable();
            $table->decimal('salary', 14, 2)->nullable();
            $table->string('salary_currency', 3)->nullable();
            $table->string('pay_frequency', 32)->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'staff_id']);
            $table->index(['staff_id', 'started_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_staff_position_history');
    }
};
