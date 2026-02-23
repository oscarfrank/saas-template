<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Snapshot of staff payment details at run creation so we can track how payment was made
     * even if staff later change their bank/tax details.
     */
    public function up(): void
    {
        Schema::table('hr_payment_run_items', function (Blueprint $table) {
            $table->string('tax_id', 64)->nullable()->after('payment_method');
            $table->string('bank_name', 128)->nullable()->after('tax_id');
            $table->string('bank_account_number', 64)->nullable()->after('bank_name');
            $table->string('bank_account_name', 128)->nullable()->after('bank_account_number');
            $table->string('pay_frequency', 32)->nullable()->after('bank_account_name');
        });
    }

    public function down(): void
    {
        Schema::table('hr_payment_run_items', function (Blueprint $table) {
            $table->dropColumn(['tax_id', 'bank_name', 'bank_account_number', 'bank_account_name', 'pay_frequency']);
        });
    }
};
