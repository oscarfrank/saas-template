<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE pulse_daily_digests ALTER COLUMN intro_summary TYPE text');

            return;
        }

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE pulse_daily_digests MODIFY intro_summary TEXT NULL');
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE pulse_daily_digests ALTER COLUMN intro_summary TYPE varchar(255)');

            return;
        }

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE pulse_daily_digests MODIFY intro_summary VARCHAR(255) NULL');
        }
    }
};
