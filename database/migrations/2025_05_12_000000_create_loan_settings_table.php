<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('loan_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value');
            $table->string('type')->default('boolean'); // boolean, string, integer, json
            $table->string('group')->default('general'); // general, borrower, lender
            $table->text('description')->nullable();
            $table->boolean('is_public')->default(false);
            $table->timestamps();
        });

        // Insert default settings
        DB::table('loan_settings')->insert([
            [
                'key' => 'allow_loans_without_kyc',
                'value' => 'false',
                'type' => 'boolean',
                'group' => 'borrower',
                'description' => 'Allow users to activate loans without completing KYC verification',
                'is_public' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'allow_early_payments',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'general',
                'description' => 'Allow borrowers to make payments (interest and capital) before the due date',
                'is_public' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'minimum_loan_amount',
                'value' => '100',
                'type' => 'integer',
                'group' => 'borrower',
                'description' => 'Minimum amount that can be borrowed',
                'is_public' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'maximum_loan_amount',
                'value' => '10000',
                'type' => 'integer',
                'group' => 'borrower',
                'description' => 'Maximum amount that can be borrowed',
                'is_public' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'loan_approval_required',
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'general',
                'description' => 'Whether loans require manual approval before activation',
                'is_public' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loan_settings');
    }
}; 