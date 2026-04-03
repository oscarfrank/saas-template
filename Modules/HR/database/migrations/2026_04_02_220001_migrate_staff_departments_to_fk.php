<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('hr_staff', 'department_id')) {
            Schema::table('hr_staff', function (Blueprint $table) {
                $table->foreignId('department_id')->nullable()->after('employee_id')->constrained('hr_departments')->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('hr_staff_position_history', 'department_id')) {
            Schema::table('hr_staff_position_history', function (Blueprint $table) {
                $table->foreignId('department_id')->nullable()->after('job_title')->constrained('hr_departments')->nullOnDelete();
            });
        }

        $this->seedDepartmentsFromStaffStrings();
        $this->assignStaffDepartmentIds();
        $this->assignPositionHistoryDepartmentIds();

        // Dropping columns on SQLite can trigger a full rebuild that surfaces unrelated schema issues in dev DBs.
        // Production (MySQL) should drop the legacy string columns; SQLite may keep them unused.
        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            Schema::table('hr_staff', function (Blueprint $table) {
                $table->dropColumn('department');
            });

            Schema::table('hr_staff_position_history', function (Blueprint $table) {
                $table->dropColumn('department');
            });
        }
    }

    public function down(): void
    {
        Schema::table('hr_staff', function (Blueprint $table) {
            $table->string('department', 128)->nullable()->after('employee_id');
        });

        Schema::table('hr_staff_position_history', function (Blueprint $table) {
            $table->string('department', 128)->nullable()->after('job_title');
        });

        foreach (DB::table('hr_staff')->whereNotNull('department_id')->get() as $row) {
            $name = DB::table('hr_departments')->where('id', $row->department_id)->value('name');
            DB::table('hr_staff')->where('id', $row->id)->update(['department' => $name]);
        }

        foreach (DB::table('hr_staff_position_history')->whereNotNull('department_id')->get() as $row) {
            $name = DB::table('hr_departments')->where('id', $row->department_id)->value('name');
            DB::table('hr_staff_position_history')->where('id', $row->id)->update(['department' => $name]);
        }

        Schema::table('hr_staff_position_history', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropColumn('department_id');
        });

        Schema::table('hr_staff', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropColumn('department_id');
        });
    }

    private function seedDepartmentsFromStaffStrings(): void
    {
        $tenantIds = DB::table('hr_staff')->distinct()->pluck('tenant_id')
            ->merge(DB::table('hr_staff_position_history')->distinct()->pluck('tenant_id'))
            ->unique()
            ->filter();

        foreach ($tenantIds as $tenantId) {
            $names = collect();
            foreach (DB::table('hr_staff')->where('tenant_id', $tenantId)->whereNotNull('department')->get() as $row) {
                $t = trim((string) $row->department);
                if ($t !== '') {
                    $names->push($t);
                }
            }
            foreach (DB::table('hr_staff_position_history')->where('tenant_id', $tenantId)->whereNotNull('department')->get() as $row) {
                $t = trim((string) $row->department);
                if ($t !== '') {
                    $names->push($t);
                }
            }

            foreach ($names->unique() as $name) {
                $this->ensureDepartment((string) $tenantId, $name);
            }

            if (! DB::table('hr_departments')->where('tenant_id', $tenantId)->exists()) {
                $this->insertDepartment((string) $tenantId, 'General');
            }
        }
    }

    private function ensureDepartment(string $tenantId, string $name): void
    {
        $exists = DB::table('hr_departments')
            ->where('tenant_id', $tenantId)
            ->whereRaw('LOWER(name) = ?', [Str::lower($name)])
            ->exists();
        if (! $exists) {
            $this->insertDepartment($tenantId, $name);
        }
    }

    private function insertDepartment(string $tenantId, string $name): void
    {
        $baseSlug = Str::slug($name) ?: 'department';
        $slug = $baseSlug;
        $n = 2;
        while (DB::table('hr_departments')->where('tenant_id', $tenantId)->where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.$n;
            $n++;
        }

        DB::table('hr_departments')->insert([
            'tenant_id' => $tenantId,
            'uuid' => (string) Str::uuid(),
            'name' => $name,
            'slug' => $slug,
            'sort_order' => 0,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function assignStaffDepartmentIds(): void
    {
        foreach (DB::table('hr_staff')->get() as $row) {
            $raw = isset($row->department) ? trim((string) $row->department) : '';
            if ($raw === '') {
                continue;
            }
            $id = DB::table('hr_departments')
                ->where('tenant_id', $row->tenant_id)
                ->whereRaw('LOWER(name) = ?', [Str::lower($raw)])
                ->value('id');
            if ($id !== null) {
                DB::table('hr_staff')->where('id', $row->id)->update(['department_id' => $id]);
            }
        }
    }

    private function assignPositionHistoryDepartmentIds(): void
    {
        foreach (DB::table('hr_staff_position_history')->get() as $row) {
            $raw = isset($row->department) ? trim((string) $row->department) : '';
            if ($raw === '') {
                continue;
            }
            $id = DB::table('hr_departments')
                ->where('tenant_id', $row->tenant_id)
                ->whereRaw('LOWER(name) = ?', [Str::lower($raw)])
                ->value('id');
            if ($id !== null) {
                DB::table('hr_staff_position_history')->where('id', $row->id)->update(['department_id' => $id]);
            }
        }
    }
};
