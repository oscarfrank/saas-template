<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('worker_agent_proposals', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->uuid('uuid')->unique();
            $table->foreignId('worker_agent_id')->constrained('worker_agents')->cascadeOnDelete();
            $table->foreignId('worker_agent_run_id')->nullable()->constrained('worker_agent_runs')->nullOnDelete();
            $table->string('type', 32);
            $table->json('payload');
            $table->string('status', 32)->default('pending');
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_note')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index(['tenant_id', 'status', 'created_at']);
        });

        Schema::create('worker_agent_handoffs', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->uuid('uuid')->unique();
            $table->foreignId('from_worker_agent_id')->constrained('worker_agents')->cascadeOnDelete();
            $table->foreignId('to_worker_agent_id')->constrained('worker_agents')->cascadeOnDelete();
            $table->foreignId('hr_task_id')->nullable()->constrained('hr_tasks')->nullOnDelete();
            $table->text('message')->nullable();
            $table->string('status', 32)->default('pending');
            $table->foreignId('worker_agent_run_id')->nullable()->constrained('worker_agent_runs')->nullOnDelete();
            $table->foreignId('resolved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index(['tenant_id', 'to_worker_agent_id', 'status']);
        });

        Schema::create('worker_agent_messages', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('worker_agent_id')->constrained('worker_agents')->cascadeOnDelete();
            $table->foreignId('worker_agent_run_id')->nullable()->constrained('worker_agent_runs')->nullOnDelete();
            $table->string('role', 32);
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('staff_id')->nullable()->constrained('hr_staff')->nullOnDelete();
            $table->text('body');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index(['tenant_id', 'worker_agent_id', 'created_at']);
        });

        Schema::create('worker_agent_run_events', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('worker_agent_run_id')->constrained('worker_agent_runs')->cascadeOnDelete();
            $table->string('level', 16)->default('info');
            $table->string('event_type', 64);
            $table->text('message');
            $table->json('context')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index(['worker_agent_run_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('worker_agent_run_events');
        Schema::dropIfExists('worker_agent_messages');
        Schema::dropIfExists('worker_agent_handoffs');
        Schema::dropIfExists('worker_agent_proposals');
    }
};
