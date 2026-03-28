<?php

namespace App\Models;

use Illuminate\Support\Facades\Artisan;
use Modules\Settings\Models\SiteSettings;
use Modules\User\Models\User;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;

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
                '--tenants' => [$tenant->id],
            ]);
        });
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'tenant_user')
            ->withTimestamps()->withPivot('role');
    }

    /**
     * Default script role per user (view/edit/admin). Applies to all scripts in the org.
     */
    public function scriptRoles()
    {
        return $this->hasMany(TenantScriptRole::class);
    }

    /**
     * Per-organization overrides for AI system prompts (built-in keys and custom.* keys).
     */
    public function aiPrompts()
    {
        return $this->hasMany(TenantAiPrompt::class, 'tenant_id');
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
     * Path segment(s) after {tenant}/ for primary dashboard (not the hub).
     * Legacy stored values "dashboard" or "dashboard/hub" resolve to homepage.fallback_landing_path.
     */
    public function getEffectiveDefaultLandingPath(): string
    {
        $path = $this->getDefaultLandingPath();
        if (in_array($path, ['dashboard', 'dashboard/hub'], true)) {
            $path = (string) config('homepage.fallback_landing_path', 'dashboard/workspace');
        }
        $allowed = SiteSettings::getSettings()->getAllowedOrgDefaultLandingPaths();
        if (! in_array($path, $allowed, true)) {
            return $allowed[0] ?? (string) config('homepage.fallback_landing_path', 'dashboard/workspace');
        }

        return $path;
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
