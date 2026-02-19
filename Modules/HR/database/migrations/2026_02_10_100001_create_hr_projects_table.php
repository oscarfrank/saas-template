<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_projects', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('status', 32)->default('active'); // active, on_hold, completed, cancelled
            $table->foreignId('owner_id')->nullable()->constrained('hr_staff')->onDelete('set null');
            $table->timestamps();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onUpdate('cascade')
                ->onDelete('cascade');
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_projects');
    }
};
