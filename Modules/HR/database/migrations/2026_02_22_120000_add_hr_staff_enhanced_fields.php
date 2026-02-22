<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hr_staff', function (Blueprint $table) {
            $table->unsignedTinyInteger('salary_pay_day')->nullable()->after('pay_frequency'); // 1-31 day of month
            $table->json('allowances')->nullable()->after('salary_pay_day'); // [{ "name": "Housing", "amount": 50000 }, ...]
            $table->json('deductions')->nullable()->after('allowances'); // [{ "name": "Tax", "amount": 10000 }, ...]
            $table->string('passport_photo_path')->nullable()->after('deductions');
            $table->string('tax_id', 64)->nullable()->after('passport_photo_path');
            $table->string('national_id', 64)->nullable()->after('tax_id');
            $table->string('bank_name', 128)->nullable()->after('national_id');
            $table->string('bank_account_number', 64)->nullable()->after('bank_name');
            $table->string('bank_account_name', 128)->nullable()->after('bank_account_number');
        });
    }

    public function down(): void
    {
        Schema::table('hr_staff', function (Blueprint $table) {
            $table->dropColumn([
                'salary_pay_day',
                'allowances',
                'deductions',
                'passport_photo_path',
                'tax_id',
                'national_id',
                'bank_name',
                'bank_account_number',
                'bank_account_name',
            ]);
        });
    }
};
