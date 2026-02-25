<?php

namespace Modules\Assets\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class AssetCategory extends Model
{
    use BelongsToTenant;

    protected $table = 'asset_categories';

    protected $fillable = [
        'tenant_id',
        'name',
        'slug',
        'description',
        'parent_id',
        'sort_order',
        'depreciation_useful_life_years',
        'depreciation_salvage_value',
        'depreciation_method',
    ];

    protected $casts = [
        'depreciation_salvage_value' => 'decimal:2',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(AssetCategory::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(AssetCategory::class, 'parent_id')->orderBy('sort_order');
    }

    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class, 'asset_category_id');
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    protected static function booted(): void
    {
        static::creating(function (AssetCategory $category) {
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });
    }
}
