<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Modules\Settings\Models\SiteSettings;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('site_name');
            $table->string('site_title');
            $table->text('site_description')->nullable();
            $table->string('site_keywords')->nullable();
            $table->string('site_logo')->nullable();
            $table->string('site_favicon')->nullable();
            $table->string('company_name');
            $table->string('company_address');
            $table->string('company_phone');
            $table->string('company_email');
            $table->string('company_website')->nullable();
            $table->string('facebook_url')->nullable();
            $table->string('twitter_url')->nullable();
            $table->string('instagram_url')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->string('youtube_url')->nullable();
            $table->text('google_analytics_code')->nullable();
            $table->text('meta_tags')->nullable();
            $table->text('footer_text')->nullable();
            $table->boolean('maintenance_mode')->default(false);
            $table->timestamps();
        });

        // Create default settings
        SiteSettings::create([
            'site_name' => 'LendFast',
            'site_title' => 'LendFast - Your Financial Platform',
            'site_description' => 'A comprehensive financial platform for managing loans, investments, and more.',
            'site_keywords' => 'finance, loans, investments, platform',
            'company_name' => 'LendFast Inc.',
            'company_address' => '123 Financial Street, Suite 100',
            'company_phone' => '+1 (555) 123-4567',
            'company_email' => 'info@illbytes.com',
            'company_website' => 'https://illbytes.com/lendfast',
            'facebook_url' => 'https://facebook.com/illbytes',
            'twitter_url' => 'https://twitter.com/illbytes',
            'instagram_url' => 'https://instagram.com/illbytes',
            'linkedin_url' => 'https://linkedin.com/company/illbytes',
            'youtube_url' => 'https://youtube.com/illbytes',
            'google_analytics_code' => null,
            'meta_tags' => '<meta name="robots" content="index, follow">',
            'footer_text' => '© 2025 Lendfast Inc. All rights reserved.',
            'maintenance_mode' => false,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};
