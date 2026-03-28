<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('site_settings', 'allowed_org_default_landing_paths')) {
                $table->json('allowed_org_default_landing_paths')->nullable()->after('homepage_redirect_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            if (Schema::hasColumn('site_settings', 'allowed_org_default_landing_paths')) {
                $table->dropColumn('allowed_org_default_landing_paths');
            }
        });
    }
};
