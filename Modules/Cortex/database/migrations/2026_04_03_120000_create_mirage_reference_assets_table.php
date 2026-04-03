<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mirage_reference_assets', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('kind', 16);
            $table->string('label', 120)->nullable();
            $table->string('disk', 32)->default('local');
            $table->string('path', 512);
            $table->string('mime', 96)->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index(['tenant_id', 'kind']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mirage_reference_assets');
    }
};
