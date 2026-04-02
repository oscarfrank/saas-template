<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('worker_agents', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->uuid('uuid')->unique();
            $table->foreignId('staff_id')->constrained('hr_staff')->cascadeOnDelete();
            $table->string('name');
            $table->text('skills')->nullable();
            $table->json('capabilities')->nullable();
            $table->json('organization_goal_ids')->nullable();
            $table->string('schedule_cron')->nullable();
            $table->string('schedule_timezone', 64)->default('UTC');
            $table->string('input_scope', 32)->default('all_workers');
            $table->json('input_worker_agent_ids')->nullable();
            $table->json('input_project_ids')->nullable();
            $table->boolean('automation_enabled')->default(true);
            $table->boolean('requires_approval')->default(false);
            $table->unsignedTinyInteger('max_runs_per_hour')->nullable();
            $table->unsignedInteger('daily_llm_budget_cents')->nullable();
            $table->timestamp('paused_at')->nullable();
            $table->boolean('enabled')->default(true);
            $table->string('llm_provider', 16)->default('openai');
            $table->string('chat_model')->nullable();
            $table->unsignedInteger('config_version')->default(1);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->unique(['tenant_id', 'staff_id']);
            $table->index(['tenant_id', 'enabled', 'automation_enabled']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('worker_agents');
    }
};
