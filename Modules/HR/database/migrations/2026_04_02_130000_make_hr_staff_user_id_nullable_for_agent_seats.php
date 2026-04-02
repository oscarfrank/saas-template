<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hr_staff', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('hr_staff', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change()->constrained('users')->cascadeOnDelete();
            $table->string('kind', 16)->default('human')->after('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::table('hr_staff', function (Blueprint $table) {
            $table->dropColumn('kind');
        });

        Schema::table('hr_staff', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('hr_staff', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable(false)->change()->constrained('users')->cascadeOnDelete();
        });
    }
};
