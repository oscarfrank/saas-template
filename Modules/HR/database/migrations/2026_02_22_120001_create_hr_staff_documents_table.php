<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_staff_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('hr_staff')->onDelete('cascade');
            $table->string('name');
            $table->string('type', 64); // contract, id, certificate, other
            $table->string('file_path');
            $table->unsignedInteger('file_size');
            $table->string('mime_type', 128);
            $table->text('description')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['staff_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_staff_documents');
    }
};
