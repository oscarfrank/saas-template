<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('kyc_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Personal Information
            $table->string('full_name');
            $table->date('date_of_birth');
            
            // Contact Information
            $table->string('phone_number');
            
            // Address Information
            $table->string('address_line_1');
            $table->string('address_line_2')->nullable();
            $table->string('city');
            $table->string('state_province');
            $table->string('postal_code');
            $table->string('country');
            
            // ID Verification
            $table->enum('id_type', ['passport', 'national_id', 'drivers_license']);
            $table->string('id_number');
            $table->string('id_document_front')->comment('File path to front of ID document');
            $table->string('id_document_back')->nullable()->comment('File path to back of ID document if applicable');
            
            // Verification Status
            $table->enum('status', ['pending', 'under_review', 'approved', 'rejected'])->default('pending');
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamp('verified_at')->nullable();
            
            // Standard timestamps
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes for better performance
            $table->index('status');
            $table->index('submitted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kyc_verifications');
    }
};
