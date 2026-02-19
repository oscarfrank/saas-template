<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hr_tasks', function (Blueprint $table) {
            $table->string('uuid', 36)->nullable()->after('id');
        });

        foreach (\Modules\HR\Models\Task::whereNull('uuid')->get() as $task) {
            $task->update(['uuid' => (string) Str::uuid()]);
        }

        Schema::table('hr_tasks', function (Blueprint $table) {
            $table->unique(['tenant_id', 'uuid']);
        });
    }

    public function down(): void
    {
        Schema::table('hr_tasks', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'uuid']);
            $table->dropColumn('uuid');
        });
    }
};
