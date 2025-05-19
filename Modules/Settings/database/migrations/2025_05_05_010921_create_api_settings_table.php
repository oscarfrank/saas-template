<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Modules\Settings\Models\ApiSetting; 

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('api_settings', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['payment', 'ai', 'email', 'other']);
            $table->text('api_key');
            $table->text('api_secret')->nullable();
            $table->string('webhook_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->json('additional_data')->nullable();
            $table->timestamps();
        });

        // Insert default API settings
        $defaultApis = [
            // Payment APIs
            [
                'name' => 'Stripe',
                'type' => 'payment',
                'api_key' => 'xxxxxxxxxxxxxxxxxx',
                'api_secret' => 'xxxxxxxxxxxxxxxxxx',
                'webhook_url' => '',
                'is_active' => true,
                'is_default' => true,
            ],
            [
                'name' => 'Flutterwave',
                'type' => 'payment',
                'api_key' => 'xxxxxxxxxxxxxxxxxx',
                'api_secret' => 'xxxxxxxxxxxxxxxxxx',
                'webhook_url' => '',
                'is_active' => true,
                'is_default' => true,
            ],
            // AI APIs
            [
                'name' => 'OpenAI',
                'type' => 'ai',
                'api_key' => 'xxxxxxxxxxxxxxxxxx',
                'is_active' => true,
                'is_default' => true,
            ],
            [
                'name' => 'Anthropic',
                'type' => 'ai',
                'api_key' => 'xxxxxxxxxxxxxxxxxx',
                'is_active' => true,
                'is_default' => true,
            ],
            [
                'name' => 'BedrockAI',
                'type' => 'ai',
                'api_key' => 'xxxxxxxxxxxxxxxxxx',
                'is_active' => true,
                'is_default' => true,
            ],
            // Email APIs
            [
                'name' => 'Mailgun',
                'type' => 'email',
                'api_key' => 'xxxxxxxxxxxxxxxxxx',
                'is_active' => true,
                'is_default' => true,
            ],
        ];

        foreach ($defaultApis as $api) {
            ApiSetting::create($api);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('api_settings');
    }
};
