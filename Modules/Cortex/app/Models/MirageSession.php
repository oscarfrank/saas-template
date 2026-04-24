<?php

declare(strict_types=1);

namespace Modules\Cortex\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Modules\User\Models\User;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

/**
 * @property string $id
 * @property string $tenant_id
 * @property int $user_id
 * @property string|null $title
 * @property \Illuminate\Support\Carbon $last_activity_at
 */
final class MirageSession extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'mirage_sessions';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'title',
        'last_activity_at',
    ];

    protected function casts(): array
    {
        return [
            'last_activity_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        self::creating(function (self $model): void {
            if ($model->id === null || $model->id === '') {
                $model->id = (string) Str::uuid();
            }
        });
    }

    /**
     * @return HasMany<MirageSessionTurn, $this>
     */
    public function turns(): HasMany
    {
        return $this->hasMany(MirageSessionTurn::class, 'mirage_session_id', 'id')->orderBy('position');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeOwnedBy(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }
}
