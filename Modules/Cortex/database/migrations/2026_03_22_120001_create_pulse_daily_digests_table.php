<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pulse_daily_digests', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->date('digest_date');
            $table->string('feeds_status', 32)->default('pending');
            $table->string('ideas_status', 32)->default('pending');
            $table->timestamp('feeds_refreshed_at')->nullable();
            $table->timestamp('ideas_generated_at')->nullable();
            $table->text('feeds_error')->nullable();
            $table->text('ideas_error')->nullable();
            $table->json('tweets')->nullable();
            $table->json('shorts')->nullable();
            $table->json('youtube')->nullable();
            $table->string('intro_summary')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'digest_date']);
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pulse_daily_digests');
    }
};
