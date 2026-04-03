<?php

declare(strict_types=1);

namespace Modules\Cortex\Models;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

final class MirageUserPreference extends Model
{
    use BelongsToTenant;

    protected $table = 'mirage_user_preferences';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'use_default_face_reference',
        'use_default_style_references',
    ];

    protected function casts(): array
    {
        return [
            'use_default_face_reference' => 'boolean',
            'use_default_style_references' => 'boolean',
        ];
    }

    public static function getOrCreateForTenantUser(string $tenantId, int $userId): self
    {
        /** @var self */
        return self::query()->firstOrCreate(
            [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
            ],
            [
                'use_default_face_reference' => false,
                'use_default_style_references' => false,
            ],
        );
    }
}
