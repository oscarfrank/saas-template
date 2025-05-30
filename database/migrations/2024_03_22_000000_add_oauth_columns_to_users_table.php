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
        Schema::table('users', function (Blueprint $table) {
            // Provider-specific IDs
            $table->string('google_id')->nullable()->unique();
            $table->string('facebook_id')->nullable()->unique();
            $table->string('github_id')->nullable()->unique();
            $table->string('azure_id')->nullable()->unique();
            
            // OAuth tokens and metadata
            $table->json('oauth_tokens')->nullable()->comment('Stores OAuth tokens for all providers');
            $table->string('oauth_provider')->nullable()->comment('The primary OAuth provider used for login');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'google_id',
                'facebook_id',
                'github_id',
                'azure_id',
                'oauth_tokens',
                'oauth_provider'
            ]);
        });
    }
}; 