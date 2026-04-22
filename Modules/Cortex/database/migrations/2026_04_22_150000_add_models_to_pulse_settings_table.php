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
            $table->string('chat_model', 100)->nullable()->after('deep_research_enabled');
            $table->string('digest_model', 100)->nullable()->after('chat_model');
            $table->string('script_model', 100)->nullable()->after('digest_model');
        });
    }

    public function down(): void
    {
        Schema::table('pulse_settings', function (Blueprint $table) {
            $table->dropColumn(['chat_model', 'digest_model', 'script_model']);
        });
    }
};
