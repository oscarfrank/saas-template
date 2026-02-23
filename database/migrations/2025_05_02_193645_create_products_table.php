<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreign('tenant_id')
                    ->references('id')
                    ->on('tenants')
                    ->onUpdate('cascade')
                    ->onDelete('cascade');
            $table->string('name')->nullable();
            $table->string('description')->nullable();
            $table->decimal('price', 10, 2)->nullable();
            $table->string('featured_image')->nullable();
            $table->string('featured_image_original_name')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
