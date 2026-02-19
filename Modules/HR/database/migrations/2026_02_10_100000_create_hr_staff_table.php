<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_staff', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('employee_id', 64)->nullable();
            $table->string('department', 128)->nullable();
            $table->string('job_title', 128)->nullable();
            $table->decimal('salary', 14, 2)->nullable();
            $table->string('salary_currency', 3)->default('USD');
            $table->string('pay_frequency', 32)->nullable(); // monthly, bi_weekly, weekly
            $table->date('started_at')->nullable();
            $table->date('ended_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onUpdate('cascade')
                ->onDelete('cascade');
            $table->unique(['tenant_id', 'user_id']);
            $table->index(['tenant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_staff');
    }
};
