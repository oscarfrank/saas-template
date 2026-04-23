<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('org_mcp_audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('client_id')->constrained('org_mcp_clients')->cascadeOnDelete();
            $table->unsignedBigInteger('profile_user_id')->nullable();
            $table->string('tool', 120);
            $table->string('request_hash', 64)->nullable();
            $table->json('request_meta')->nullable();
            $table->json('response_meta')->nullable();
            $table->string('status', 32);
            $table->text('error_message')->nullable();
            $table->unsignedInteger('duration_ms')->default(0);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index(['tenant_id', 'tool']);
            $table->index(['tenant_id', 'status']);
            $table->index(['profile_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('org_mcp_audit_logs');
    }
};
