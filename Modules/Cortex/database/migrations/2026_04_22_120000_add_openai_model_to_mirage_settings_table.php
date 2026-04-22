<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mirage_settings', function (Blueprint $table) {
            $table->string('openai_image_model', 32)->default('dall-e-3')->after('image_provider');
        });

        DB::table('mirage_settings')
            ->where('image_provider', 'dall_e_3')
            ->update([
                'image_provider' => 'openai',
                'openai_image_model' => 'dall-e-3',
            ]);

        DB::table('mirage_settings')
            ->where('image_provider', 'gpt_image_1')
            ->update([
                'image_provider' => 'openai',
                'openai_image_model' => 'gpt-image-1.5',
            ]);
    }

    public function down(): void
    {
        DB::table('mirage_settings')
            ->where('image_provider', 'openai')
            ->where('openai_image_model', 'dall-e-3')
            ->update(['image_provider' => 'dall_e_3']);

        DB::table('mirage_settings')
            ->where('image_provider', 'openai')
            ->whereIn('openai_image_model', ['gpt-image-1.5', 'gpt-image-2'])
            ->update(['image_provider' => 'gpt_image_1']);

        Schema::table('mirage_settings', function (Blueprint $table) {
            $table->dropColumn('openai_image_model');
        });
    }
};
