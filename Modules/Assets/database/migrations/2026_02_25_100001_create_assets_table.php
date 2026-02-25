<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->uuid('uuid')->unique();
            $table->foreignId('asset_category_id')->nullable()->constrained('asset_categories')->onDelete('set null');
            $table->string('name');
            $table->string('asset_tag', 64);
            $table->string('serial_number', 128)->nullable();
            $table->text('description')->nullable();
            $table->string('status', 32)->default('available');
            $table->foreignId('assigned_to_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->date('purchase_date')->nullable();
            $table->decimal('purchase_price', 14, 2)->nullable();
            $table->string('currency', 3)->default('USD');
            $table->string('location', 255)->nullable();
            $table->text('notes')->nullable();
            $table->string('condition', 32)->nullable();
            $table->timestamp('disposed_at')->nullable();
            $table->string('disposed_reason', 255)->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onUpdate('cascade')
                ->onDelete('cascade');
            $table->unique(['tenant_id', 'asset_tag']);
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'asset_category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
