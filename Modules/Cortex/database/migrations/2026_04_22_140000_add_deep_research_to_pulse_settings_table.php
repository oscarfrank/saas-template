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
            $table->boolean('deep_research_enabled')->default(false)->after('tweet_style_prompt');
        });
    }

    public function down(): void
    {
        Schema::table('pulse_settings', function (Blueprint $table) {
            $table->dropColumn('deep_research_enabled');
        });
    }
};
