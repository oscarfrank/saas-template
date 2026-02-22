<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Organization-level default script role (view/edit/admin).
     * Applies to all scripts in the tenant unless overridden or denied per script.
     */
    public function up(): void
    {
        if (Schema::hasTable('tenant_script_roles')) {
            return;
        }
        Schema::create('tenant_script_roles', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('role', 32); // 'view', 'edit', 'admin'
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');
            $table->unique(['tenant_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_script_roles');
    }
};
