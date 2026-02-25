<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asset_settings', function (Blueprint $table) {
            $table->string('default_status_filter', 32)->nullable()->after('default_sold_currency');
            $table->string('default_asset_status', 32)->nullable()->after('default_status_filter');
            $table->unsignedTinyInteger('items_per_page')->nullable()->after('default_asset_status');
        });
    }

    public function down(): void
    {
        Schema::table('asset_settings', function (Blueprint $table) {
            $table->dropColumn(['default_status_filter', 'default_asset_status', 'items_per_page']);
        });
    }
};
