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
        if (! Schema::hasTable('mirage_reference_assets')) {
            return;
        }

        if (Schema::hasColumn('mirage_reference_assets', 'user_id')) {
            return;
        }

        Schema::table('mirage_reference_assets', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'kind']);
        });

        DB::table('mirage_reference_assets')->delete();

        Schema::table('mirage_reference_assets', function (Blueprint $table) {
            $table->foreignId('user_id')->after('tenant_id')->constrained('users')->cascadeOnDelete();
            $table->index(['tenant_id', 'user_id', 'kind']);
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('mirage_reference_assets')) {
            return;
        }

        if (! Schema::hasColumn('mirage_reference_assets', 'user_id')) {
            return;
        }

        Schema::table('mirage_reference_assets', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'user_id', 'kind']);
            $table->dropConstrainedForeignId('user_id');
            $table->index(['tenant_id', 'kind']);
        });
    }
};
