<?php

declare(strict_types=1);

namespace Modules\Cortex\Models;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class PulseFeed extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'feed_url',
        'enabled',
        'cached_snapshot',
        'last_fetched_at',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'cached_snapshot' => 'array',
            'last_fetched_at' => 'datetime',
        ];
    }
}
