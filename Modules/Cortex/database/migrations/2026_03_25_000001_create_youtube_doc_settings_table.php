<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('youtube_doc_settings', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->unique();

            // The channel we’re analyzing (set from YouTube Data API after OAuth).
            $table->string('youtube_channel_id')->nullable();
            $table->string('youtube_channel_title')->nullable();

            // OAuth tokens (encrypted at rest by the application).
            $table->text('google_refresh_token_encrypted')->nullable();
            $table->text('google_access_token_encrypted')->nullable();
            $table->timestamp('google_access_token_expires_at')->nullable();

            $table->timestamp('connected_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('youtube_doc_settings');
    }
};
