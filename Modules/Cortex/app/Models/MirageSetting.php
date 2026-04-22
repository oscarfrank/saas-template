<?php

declare(strict_types=1);

namespace Modules\Cortex\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Cortex\Support\MirageImageProvider;
use Modules\Cortex\Support\MirageOpenAiImageModel;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

final class MirageSetting extends Model
{
    use BelongsToTenant;

    protected $table = 'mirage_settings';

    protected $fillable = [
        'tenant_id',
        'image_provider',
        'openai_image_model',
    ];

    protected function casts(): array
    {
        return [
            'image_provider' => MirageImageProvider::class,
            'openai_image_model' => MirageOpenAiImageModel::class,
        ];
    }

    public static function getOrCreateForTenant(string $tenantId): self
    {
        /** @var self */
        return self::query()->firstOrCreate(
            ['tenant_id' => $tenantId],
            [
                'image_provider' => MirageImageProvider::OpenAi,
                'openai_image_model' => MirageOpenAiImageModel::DallE3,
            ],
        );
    }
}
