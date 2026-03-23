<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pulse_feeds', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('name', 255);
            $table->string('feed_url', 2000);
            $table->boolean('enabled')->default(true);
            $table->json('cached_snapshot')->nullable();
            $table->timestamp('last_fetched_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->unique(['tenant_id', 'feed_url']);
            $table->index(['tenant_id', 'enabled']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pulse_feeds');
    }
};
