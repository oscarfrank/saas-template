<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->string('sold_currency', 3)->nullable()->after('sold_price');
        });

        Schema::table('asset_settings', function (Blueprint $table) {
            $table->string('default_sold_currency', 3)->nullable()->after('default_currency');
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn('sold_currency');
        });
        Schema::table('asset_settings', function (Blueprint $table) {
            $table->dropColumn('default_sold_currency');
        });
    }
};
