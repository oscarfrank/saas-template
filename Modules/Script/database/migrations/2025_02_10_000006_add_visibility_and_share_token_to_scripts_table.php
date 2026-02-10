<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('scripts', function (Blueprint $table) {
            if (! Schema::hasColumn('scripts', 'visibility')) {
                $table->string('visibility', 32)->default('private')->after('status');
            }
            if (! Schema::hasColumn('scripts', 'share_token')) {
                $table->string('share_token', 64)->nullable()->unique()->after('visibility');
            }
        });
    }

    public function down(): void
    {
        Schema::table('scripts', function (Blueprint $table) {
            $table->dropColumn(['visibility', 'share_token']);
        });
    }
};
