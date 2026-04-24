<?php

declare(strict_types=1);

namespace Modules\Cortex\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\Models\User;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

/**
 * Append-only usage for credits / analytics (kept when user deletes generations).
 */
final class MirageUsageEvent extends Model
{
    use BelongsToTenant;

    public $timestamps = false;

    protected $table = 'mirage_usage_events';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'event_type',
        'quantity',
        'mirage_session_id',
        'mirage_session_turn_id',
        'meta_json',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'meta_json' => 'array',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @param  array<string, mixed>|null  $meta
     */
    public static function logIdeas(
        string $tenantId,
        int $userId,
        int $count,
        ?string $sessionUuid = null,
        ?int $turnId = null,
        ?array $meta = null,
    ): void {
        self::query()->create([
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'event_type' => 'mirage_ideas',
            'quantity' => $count,
            'mirage_session_id' => $sessionUuid,
            'mirage_session_turn_id' => $turnId,
            'meta_json' => $meta,
            'created_at' => now(),
        ]);
    }

    /**
     * @param  array<string, mixed>|null  $meta
     */
    public static function logImages(
        string $tenantId,
        int $userId,
        int $imageAttempts,
        ?string $sessionUuid = null,
        ?int $turnId = null,
        ?array $meta = null,
    ): void {
        self::query()->create([
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'event_type' => 'mirage_images',
            'quantity' => $imageAttempts,
            'mirage_session_id' => $sessionUuid,
            'mirage_session_turn_id' => $turnId,
            'meta_json' => $meta,
            'created_at' => now(),
        ]);
    }
}
