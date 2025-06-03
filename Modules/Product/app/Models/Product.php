<?php

namespace Modules\Product\Models;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use App\Traits\TenantAwareModelBinding;

class Product extends Model
{
    use BelongsToTenant, TenantAwareModelBinding;

    protected $fillable = [
        'name',
        'tenant_id',
        'description',
        'price',
        'featured_image',
        'featured_image_original_name',
    ];
}
