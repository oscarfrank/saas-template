<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('script_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('script_id')->constrained('scripts')->onDelete('cascade');
            $table->longText('content')->nullable();
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->string('meta_tags', 600)->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamp('created_at');

            $table->foreign('created_by')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            $table->index('script_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('script_versions');
    }
};
