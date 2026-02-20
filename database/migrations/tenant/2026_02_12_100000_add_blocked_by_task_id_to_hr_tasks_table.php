<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hr_tasks', function (Blueprint $table) {
            $table->foreignId('blocked_by_task_id')->nullable()->after('script_id')
                ->constrained('hr_tasks')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('hr_tasks', function (Blueprint $table) {
            $table->dropForeign(['blocked_by_task_id']);
        });
    }
};
