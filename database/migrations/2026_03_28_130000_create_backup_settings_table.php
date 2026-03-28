<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('backup_settings', function (Blueprint $table) {
            $table->id();
            $table->text('google_drive_refresh_token_encrypted')->nullable();
            $table->string('google_drive_folder_id')->nullable();
            $table->boolean('schedule_enabled')->default(false);
            $table->string('schedule_frequency', 16)->default('daily');
            $table->string('schedule_time', 8)->default('02:00');
            $table->unsignedTinyInteger('schedule_weekday')->nullable();
            $table->boolean('schedule_include_storage')->default(false);
            $table->timestamp('last_scheduled_run_at')->nullable();
            $table->text('last_scheduled_error')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backup_settings');
    }
};
