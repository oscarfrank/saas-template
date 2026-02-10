<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('script_collaborators')) {
            return;
        }
        Schema::create('script_collaborators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('script_id')->constrained('scripts')->onDelete('cascade');
            $table->unsignedBigInteger('user_id');
            $table->string('role', 32); // 'view', 'edit', 'admin'
            $table->timestamps();

            $table->unique(['script_id', 'user_id']);
            $table->index('script_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('script_collaborators');
    }
};
