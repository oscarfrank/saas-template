<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('worker_agent_memories', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('worker_agent_id')->constrained('worker_agents')->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            /** @var string Long-lived notes for this agent; surfaced to the model and to tenant users on the agent profile. */
            $table->text('body');
            /**
             * manual: entered by a person in the UI.
             * run_snapshot: optional auto-capture from a completed run (summary).
             */
            $table->string('source', 32)->default('manual');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('worker_agent_run_id')->nullable()->constrained('worker_agent_runs')->nullOnDelete();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index(['tenant_id', 'worker_agent_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('worker_agent_memories');
    }
};
