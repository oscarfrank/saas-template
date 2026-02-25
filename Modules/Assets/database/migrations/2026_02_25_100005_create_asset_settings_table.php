<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_settings', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('asset_tag_prefix', 32)->default('AST');
            $table->string('default_currency', 3)->default('USD');
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onUpdate('cascade')
                ->onDelete('cascade');
            $table->unique('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_settings');
    }
};
