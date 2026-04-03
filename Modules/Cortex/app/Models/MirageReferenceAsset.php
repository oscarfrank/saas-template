<?php

declare(strict_types=1);

namespace Modules\Cortex\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Modules\Cortex\Support\MirageDataImageDecoder;
use Modules\User\Models\User;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

final class MirageReferenceAsset extends Model
{
    use BelongsToTenant;

    public const KIND_FACE = 'face';

    public const KIND_STYLE = 'style';

    /** Max saved references per user, per kind, within an organization. */
    public const MAX_PER_KIND = 30;

    protected $table = 'mirage_reference_assets';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'kind',
        'label',
        'disk',
        'path',
        'mime',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeKind(Builder $query, string $kind): Builder
    {
        return $query->where('kind', $kind);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * @return BelongsTo<User, self>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Browser-style data URL for Mirage prompts (max {@see MirageDataImageDecoder::MAX_BYTES}).
     */
    public function toDataUrlString(): ?string
    {
        if (! Storage::disk($this->disk)->exists($this->path)) {
            return null;
        }
        $binary = Storage::disk($this->disk)->get($this->path);
        if ($binary === false || strlen($binary) > MirageDataImageDecoder::MAX_BYTES) {
            return null;
        }
        $mime = $this->mime ?? 'image/png';
        if (! str_starts_with((string) $mime, 'image/')) {
            $mime = 'image/png';
        }

        return 'data:'.$mime.';base64,'.base64_encode($binary);
    }

    /**
     * Route binding: only the current user’s assets in the current tenant.
     *
     * @param  mixed  $value
     * @param  string|null  $field
     * @return self
     */
    public function resolveRouteBinding($value, $field = null)
    {
        $query = self::query()->where($field ?? $this->getRouteKeyName(), $value);

        $tenantId = tenant('id');
        if (is_string($tenantId) && $tenantId !== '') {
            $query->where('tenant_id', $tenantId);
        }

        $userId = auth()->id();
        if ($userId === null) {
            throw (new ModelNotFoundException)->setModel(self::class, [$value]);
        }

        $query->where('user_id', $userId);

        return $query->firstOrFail();
    }
}
