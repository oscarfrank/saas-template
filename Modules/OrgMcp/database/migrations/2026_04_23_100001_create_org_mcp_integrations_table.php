<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('org_mcp_integrations', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id');
            $table->string('provider', 64);
            $table->string('status', 32)->default('inactive');
            $table->json('scopes')->nullable();
            $table->longText('credentials')->nullable();
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->unique(['tenant_id', 'provider']);
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('org_mcp_integrations');
    }
};
