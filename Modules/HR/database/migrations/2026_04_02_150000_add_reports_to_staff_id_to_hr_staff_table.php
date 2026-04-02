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
            $table->foreignId('reports_to_staff_id')
                ->nullable()
                ->after('kind')
                ->constrained('hr_staff')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('hr_staff', function (Blueprint $table) {
            $table->dropForeign(['reports_to_staff_id']);
        });
    }
};
