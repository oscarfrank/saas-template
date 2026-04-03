<?php

declare(strict_types=1);

namespace Modules\HR\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class Department extends Model
{
    use BelongsToTenant;

    protected $table = 'hr_departments';

    protected $fillable = [
        'tenant_id',
        'uuid',
        'name',
        'slug',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function staff(): HasMany
    {
        return $this->hasMany(Staff::class, 'department_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * @return list<array{id: int, name: string}>
     */
    public static function optionsForSelect(string $tenantId): array
    {
        return self::query()
            ->where('tenant_id', $tenantId)
            ->active()
            ->ordered()
            ->get(['id', 'name'])
            ->map(fn (self $d) => ['id' => $d->id, 'name' => $d->name])
            ->all();
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function booted(): void
    {
        static::creating(function (Department $model): void {
            if (empty($model->uuid)) {
                $model->uuid = (string) \Illuminate\Support\Str::uuid();
            }
            if (empty($model->slug) && ! empty($model->name)) {
                $model->slug = self::uniqueSlugForTenant((string) $model->tenant_id, (string) $model->name, null);
            }
        });
    }

    public static function uniqueSlugForTenant(string $tenantId, string $name, ?int $ignoreId = null): string
    {
        $base = \Illuminate\Support\Str::slug($name) ?: 'department';
        $slug = $base;
        $n = 2;
        while (
            self::query()
                ->where('tenant_id', $tenantId)
                ->where('slug', $slug)
                ->when($ignoreId !== null, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $base.'-'.$n;
            $n++;
        }

        return $slug;
    }
}
