<?php

declare(strict_types=1);

namespace Modules\Cortex\Models;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class PulseSetting extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'max_items_per_feed',
        'auto_pull_enabled',
        'auto_pull_time',
        'digest_timezone',
        'last_auto_digest_date',
        'tweet_style_prompt',
    ];

    protected function casts(): array
    {
        return [
            'max_items_per_feed' => 'integer',
            'auto_pull_enabled' => 'boolean',
            'last_auto_digest_date' => 'date',
        ];
    }

    public static function maxItemsForTenant(string $tenantId): int
    {
        $row = static::query()->where('tenant_id', $tenantId)->first();

        if ($row === null) {
            return 25;
        }

        $n = (int) $row->max_items_per_feed;

        return max(1, min(100, $n));
    }

    public static function getOrCreateForTenant(string $tenantId): self
    {
        /** @var self */
        return static::query()->firstOrCreate(
            ['tenant_id' => $tenantId],
            ['max_items_per_feed' => 25],
        );
    }
}
