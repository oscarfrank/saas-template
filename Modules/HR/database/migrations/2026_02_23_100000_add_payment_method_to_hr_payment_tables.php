<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hr_payment_runs', function (Blueprint $table) {
            $table->string('payment_method', 32)->nullable()->after('currency');
        });

        Schema::table('hr_payment_run_items', function (Blueprint $table) {
            $table->string('payment_method', 32)->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('hr_payment_runs', function (Blueprint $table) {
            $table->dropColumn('payment_method');
        });

        Schema::table('hr_payment_run_items', function (Blueprint $table) {
            $table->dropColumn('payment_method');
        });
    }
};
