<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('worker_agent_runs', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('worker_agent_id')->constrained('worker_agents')->cascadeOnDelete();
            $table->string('status', 32)->default('pending');
            $table->string('trigger', 32);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->text('error_message')->nullable();
            $table->text('summary')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index(['tenant_id', 'worker_agent_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('worker_agent_runs');
    }
};
