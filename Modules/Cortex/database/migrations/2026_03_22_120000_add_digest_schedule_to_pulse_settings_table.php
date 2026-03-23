<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pulse_settings', function (Blueprint $table) {
            $table->boolean('auto_pull_enabled')->default(false)->after('max_items_per_feed');
            $table->string('auto_pull_time', 5)->default('07:00')->after('auto_pull_enabled');
            $table->string('digest_timezone', 64)->nullable()->after('auto_pull_time');
            $table->date('last_auto_digest_date')->nullable()->after('digest_timezone');
        });
    }

    public function down(): void
    {
        Schema::table('pulse_settings', function (Blueprint $table) {
            $table->dropColumn([
                'auto_pull_enabled',
                'auto_pull_time',
                'digest_timezone',
                'last_auto_digest_date',
            ]);
        });
    }
};
