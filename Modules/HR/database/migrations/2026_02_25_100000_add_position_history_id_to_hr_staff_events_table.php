<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hr_staff_events', function (Blueprint $table) {
            $table->foreignId('position_history_id')->nullable()->after('changed_by_user_id')
                ->constrained('hr_staff_position_history')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('hr_staff_events', function (Blueprint $table) {
            $table->dropForeign(['position_history_id']);
        });
    }
};
