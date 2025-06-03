<?php

namespace App\Models;

use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Illuminate\Support\Facades\Artisan;
use Modules\User\Models\User;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    protected $fillable = [
        'id',
        'name',
        'slug',
        'created_by',
        'data',
    ];

    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'slug',
            'created_by',
            'data',
            'created_at',
            'updated_at',
        ];
    }

    protected static function booted()
    {
        static::created(function ($tenant) {
            // Run migrations for the new tenant
            Artisan::call('tenants:migrate', [
                '--tenants' => [$tenant->id]
            ]);
        });
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'tenant_user')
            ->withTimestamps()->withPivot('role');
    }
} 