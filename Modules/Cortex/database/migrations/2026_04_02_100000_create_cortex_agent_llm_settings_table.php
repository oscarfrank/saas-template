<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cortex_agent_llm_settings', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('agent_key', 64);
            $table->string('llm_provider', 16)->default('openai');
            $table->string('chat_model')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'agent_key']);
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cortex_agent_llm_settings');
    }
};
