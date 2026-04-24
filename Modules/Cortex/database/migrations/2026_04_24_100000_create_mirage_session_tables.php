<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mirage_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tenant_id');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 200)->nullable();
            $table->timestamp('last_activity_at')->useCurrent();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'user_id', 'last_activity_at']);
        });

        Schema::create('mirage_session_turns', function (Blueprint $table) {
            $table->id();
            $table->uuid('mirage_session_id');
            $table->unsignedInteger('position');
            $table->string('input_mode', 32);
            $table->string('focus', 32);
            $table->unsignedInteger('idea_count');
            $table->text('input_text')->nullable();
            $table->string('youtube_url', 2048)->nullable();
            $table->json('source_json')->nullable();
            $table->json('ideas_json');
            $table->timestamps();

            $table->foreign('mirage_session_id')
                ->references('id')
                ->on('mirage_sessions')
                ->cascadeOnDelete();

            $table->index(['mirage_session_id', 'position']);
        });

        Schema::create('mirage_session_outputs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mirage_session_turn_id')->constrained('mirage_session_turns')->cascadeOnDelete();
            $table->string('idea_id', 64);
            $table->string('title', 512);
            $table->text('thumb_text')->nullable();
            $table->text('rationale')->nullable();
            $table->text('image_prompt');
            $table->string('disk', 32)->default('public');
            $table->string('path', 2048)->nullable();
            $table->string('mime', 128)->nullable();
            $table->text('revised_prompt')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['mirage_session_turn_id', 'idea_id']);
        });

        Schema::create('mirage_usage_events', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('event_type', 32);
            $table->unsignedInteger('quantity');
            $table->uuid('mirage_session_id')->nullable();
            $table->unsignedBigInteger('mirage_session_turn_id')->nullable();
            $table->json('meta_json')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['tenant_id', 'user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mirage_usage_events');
        Schema::dropIfExists('mirage_session_outputs');
        Schema::dropIfExists('mirage_session_turns');
        Schema::dropIfExists('mirage_sessions');
    }
};
