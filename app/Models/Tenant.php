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

    protected $casts = [
        'data' => 'array',
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

    /**
     * Get the organization's default landing path (e.g. 'dashboard', 'dashboard/workspace').
     * Set by org admin in Settings → Organization → General.
     * Stored in the tenant's data JSON; VirtualColumn exposes it as $tenant->default_landing_path.
     */
    public function getDefaultLandingPath(): string
    {
        return (string) ($this->getAttribute('default_landing_path') ?? 'dashboard');
    }

    /**
     * Set the organization's default landing path.
     * Uses the virtual attribute so Stancl's VirtualColumn (HasDataColumn) persists it into the data JSON.
     */
    public function setDefaultLandingPath(string $path): void
    {
        $this->setAttribute('default_landing_path', $path);
        $this->save();
    }
} 