<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Basic", "Pro", "Enterprise"
            $table->string('slug')->unique(); // e.g., "basic", "pro", "enterprise"
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('currency_id', 3)->default('USD');
            $table->string('billing_period'); // monthly, yearly, etc.
            $table->json('features'); // ["1 User", "Basic Support", "1GB Storage"]
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->integer('sort_order')->default(0);
            $table->json('provider_plans')->nullable(); // {"stripe": "price_xxx", "paypal": "P-xxx"}
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_plans');
    }
}; 