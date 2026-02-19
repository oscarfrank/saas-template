<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_evaluations', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('staff_id')->constrained('hr_staff')->onDelete('cascade');
            $table->string('period', 64)->nullable(); // e.g. "2025 Q1"
            $table->foreignId('reviewer_id')->nullable()->constrained('hr_staff')->onDelete('set null');
            $table->json('ratings')->nullable(); // flexible dimensions
            $table->text('goals')->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 32)->default('draft'); // draft, submitted
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onUpdate('cascade')
                ->onDelete('cascade');
            $table->index(['tenant_id', 'staff_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_evaluations');
    }
};
