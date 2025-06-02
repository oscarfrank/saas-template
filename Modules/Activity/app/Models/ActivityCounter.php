<?php

namespace Modules\Activity\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\Tenant\Models\Tenant;
use Modules\User\Models\User;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class ActivityCounter extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'unread_count'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
} 