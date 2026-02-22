<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Co-authors for attribution (display). Access is via collaborators or org default.
     */
    public function up(): void
    {
        if (Schema::hasTable('script_co_authors')) {
            return;
        }
        Schema::create('script_co_authors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('script_id')->constrained('scripts')->onDelete('cascade');
            $table->unsignedBigInteger('user_id');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['script_id', 'user_id']);
            $table->index('script_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('script_co_authors');
    }
};
