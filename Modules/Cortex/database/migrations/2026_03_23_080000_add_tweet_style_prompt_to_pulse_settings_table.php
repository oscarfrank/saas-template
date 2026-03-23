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
            $table->text('tweet_style_prompt')->nullable()->after('last_auto_digest_date');
        });
    }

    public function down(): void
    {
        Schema::table('pulse_settings', function (Blueprint $table) {
            $table->dropColumn('tweet_style_prompt');
        });
    }
};
