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
            $table->string('digest_ideas_model', 100)->nullable()->after('digest_model');
            $table->string('digest_tweets_model', 100)->nullable()->after('digest_ideas_model');
        });
    }

    public function down(): void
    {
        Schema::table('pulse_settings', function (Blueprint $table) {
            $table->dropColumn(['digest_ideas_model', 'digest_tweets_model']);
        });
    }
};
