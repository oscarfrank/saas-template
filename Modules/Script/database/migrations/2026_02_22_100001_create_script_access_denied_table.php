<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Explicit deny: user has org-level script access but must not see this script.
     */
    public function up(): void
    {
        if (Schema::hasTable('script_access_denied')) {
            return;
        }
        Schema::create('script_access_denied', function (Blueprint $table) {
            $table->id();
            $table->foreignId('script_id')->constrained('scripts')->onDelete('cascade');
            $table->unsignedBigInteger('user_id');
            $table->timestamps();

            $table->unique(['script_id', 'user_id']);
            $table->index('script_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('script_access_denied');
    }
};
