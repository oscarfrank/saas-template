<?php

declare(strict_types=1);

namespace Modules\Cortex\Models;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

final class YoutubeDocSetting extends Model
{
    use BelongsToTenant;

    protected $table = 'youtube_doc_settings';

    protected $fillable = [
        'tenant_id',
        'youtube_channel_id',
        'youtube_channel_title',
        'google_refresh_token_encrypted',
        'google_access_token_encrypted',
        'google_access_token_expires_at',
        'connected_at',
    ];

    protected function casts(): array
    {
        return [
            'google_access_token_expires_at' => 'datetime',
            'connected_at' => 'datetime',
        ];
    }

    public static function getOrCreateForTenant(string $tenantId): self
    {
        /** @var self */
        return self::query()->firstOrCreate(
            ['tenant_id' => $tenantId],
            [],
        );
    }

    public function hasConnectedChannel(): bool
    {
        return ! empty($this->youtube_channel_id)
            && ! empty($this->google_refresh_token_encrypted);
    }
}
