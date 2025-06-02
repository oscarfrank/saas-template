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
        Schema::create('user_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->json('preferences')->default('{
                "language": "en",
                "timezone": "UTC",
                "date_format": "MM/DD/YYYY",
                "time_format": "12h",
                "email_notifications": true,
                "marketing_emails": false,
                "activity_visibility": "connections",
                "last_tenant_id": null,
                "last_visited_page": null
            }');
            $table->timestamps();

            $table->unique('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_preferences');
    }
}; 