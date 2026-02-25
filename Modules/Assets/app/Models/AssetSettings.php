<?php

namespace Modules\Assets\Models;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class AssetSettings extends Model
{
    use BelongsToTenant;

    protected $table = 'asset_settings';

    protected $fillable = [
        'tenant_id',
        'asset_tag_prefix',
        'default_currency',
        'default_sold_currency',
        'default_status_filter',
        'default_asset_status',
        'items_per_page',
    ];

    public static function getForTenant(string $tenantId): self
    {
        return static::firstOrCreate(
            ['tenant_id' => $tenantId],
            ['asset_tag_prefix' => 'AST', 'default_currency' => 'USD']
        );
    }

    public function getPrefix(): string
    {
        $p = trim($this->asset_tag_prefix ?? 'AST');
        return $p !== '' ? $p . '-' : 'AST-';
    }
}
