<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('organization_invites', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreign('tenant_id')
                    ->references('id')
                    ->on('tenants')
                    ->onUpdate('cascade')
                    ->onDelete('cascade');
            $table->string('email');
            $table->string('role')->default('member');
            $table->foreignId('invited_by')->constrained('users')->onDelete('cascade');
            $table->string('token')->unique();
            $table->timestamp('expires_at');
            $table->enum('status', ['pending', 'accepted', 'expired'])->default('pending');
            $table->timestamps();

            $table->unique(['tenant_id', 'email']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('organization_invites');
    }
}; 