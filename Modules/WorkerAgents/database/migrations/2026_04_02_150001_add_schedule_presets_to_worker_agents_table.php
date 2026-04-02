<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('worker_agents', function (Blueprint $table) {
            $table->string('schedule_kind', 16)->default('off')->after('organization_goal_ids');
            $table->string('schedule_time', 8)->nullable()->after('schedule_kind');
            $table->unsignedTinyInteger('schedule_day_of_week')->nullable()->after('schedule_time');
        });

        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            DB::table('worker_agents')->whereNotNull('schedule_cron')->where('schedule_cron', '!=', '')->update(['schedule_kind' => 'custom']);
        } else {
            DB::table('worker_agents')->whereNotNull('schedule_cron')->update(['schedule_kind' => 'custom']);
        }
    }

    public function down(): void
    {
        Schema::table('worker_agents', function (Blueprint $table) {
            $table->dropColumn(['schedule_kind', 'schedule_time', 'schedule_day_of_week']);
        });
    }
};
