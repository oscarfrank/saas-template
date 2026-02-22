<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\Models\User;

/**
 * Organization-level default script role. Applies to all scripts in the tenant
 * unless overridden by script_collaborators or denied by script_access_denied.
 * Uses central DB connection.
 */
class TenantScriptRole extends Model
{
    public const ROLE_VIEW = 'view';
    public const ROLE_EDIT = 'edit';
    public const ROLE_ADMIN = 'admin';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'role',
    ];

    public function getConnectionName(): ?string
    {
        return config('tenancy.database.central_connection', config('database.default'));
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function canEdit(): bool
    {
        return in_array($this->role, [self::ROLE_EDIT, self::ROLE_ADMIN], true);
    }

    public function canManageAccess(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }
}
