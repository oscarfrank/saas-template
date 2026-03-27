<?php

declare(strict_types=1);

namespace Modules\Cortex\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Cortex\Support\MirageImageProvider;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

final class MirageSetting extends Model
{
    use BelongsToTenant;

    protected $table = 'mirage_settings';

    protected $fillable = [
        'tenant_id',
        'image_provider',
    ];

    protected function casts(): array
    {
        return [
            'image_provider' => MirageImageProvider::class,
        ];
    }

    public static function getOrCreateForTenant(string $tenantId): self
    {
        /** @var self */
        return self::query()->firstOrCreate(
            ['tenant_id' => $tenantId],
            ['image_provider' => MirageImageProvider::DallE3],
        );
    }
}
