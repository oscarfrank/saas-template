<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->unsignedSmallInteger('depreciation_useful_life_years')->nullable()->after('currency');
            $table->decimal('depreciation_salvage_value', 14, 2)->nullable()->after('depreciation_useful_life_years');
            $table->string('depreciation_method', 32)->nullable()->after('depreciation_salvage_value');
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn(['depreciation_useful_life_years', 'depreciation_salvage_value', 'depreciation_method']);
        });
    }
};
