<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_staff_events', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('staff_id')->constrained('hr_staff')->onDelete('cascade');
            $table->string('event_type', 64); // policy_violation, warning, commendation, note, salary_change, position_change, general
            $table->string('title', 255)->nullable();
            $table->text('description')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->foreignId('changed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id', 'staff_id']);
            $table->index(['staff_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_staff_events');
    }
};
