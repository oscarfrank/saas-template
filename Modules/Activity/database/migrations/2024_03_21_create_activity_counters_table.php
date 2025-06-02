<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('activity_counters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->integer('unread_count')->default(0);
            $table->timestamps();

            $table->unique(['tenant_id', 'user_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('activity_counters');
    }
}; 