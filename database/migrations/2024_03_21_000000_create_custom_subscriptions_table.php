<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('custom_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_plan_id')->constrained()->onDelete('restrict');
            $table->enum('provider', ['stripe', 'paypal', 'crypto', 'bank_transfer'])->default('stripe');
            $table->string('plan_id');
            $table->string('plan_name');
            $table->decimal('amount', 10, 2);
            $table->foreignId('currency_id')->constrained('currencies')->onDelete('restrict');
            $table->enum('status', ['active', 'cancelled', 'expired', 'trial', 'past_due', 'unpaid'])->default('active');
            $table->json('features')->nullable(); // Store plan features
            $table->json('metadata')->nullable(); // Store provider-specific data
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'provider', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_subscriptions');
    }
}; 