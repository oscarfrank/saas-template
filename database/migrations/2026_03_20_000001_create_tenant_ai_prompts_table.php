<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_ai_prompts', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('key', 160);
            $table->boolean('is_custom')->default(false);
            $table->string('label', 255)->nullable();
            $table->longText('system_prompt');
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->unique(['tenant_id', 'key']);
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_ai_prompts');
    }
};
