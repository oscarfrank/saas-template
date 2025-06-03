<?php

namespace Modules\Settings\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Tenant;
use Modules\User\Models\User;

class OrganizationInvite extends Model
{
    protected $fillable = [
        'tenant_id',
        'email',
        'role',
        'invited_by',
        'token',
        'expires_at',
        'status',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    public function getInviteUrl(): string
    {
        return route('organization.invite.accept', ['token' => $this->token]);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
} 