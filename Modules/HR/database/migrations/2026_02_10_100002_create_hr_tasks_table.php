<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_tasks', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('project_id')->nullable()->constrained('hr_projects')->onDelete('set null');
            $table->foreignId('assigned_to')->nullable()->constrained('hr_staff')->onDelete('set null');
            $table->unsignedBigInteger('script_id')->nullable(); // optional link to script (same tenant)
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status', 32)->default('todo'); // todo, in_progress, done, cancelled
            $table->string('priority', 32)->nullable(); // low, medium, high
            $table->timestamp('due_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onUpdate('cascade')
                ->onDelete('cascade');
            $table->foreign('script_id')
                ->references('id')
                ->on('scripts')
                ->onDelete('set null');
            $table->index(['tenant_id', 'status']);
            $table->index(['assigned_to', 'status']);
            $table->index(['script_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_tasks');
    }
};
