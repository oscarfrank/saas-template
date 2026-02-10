<?php

namespace Modules\Script\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\Models\User;

class ScriptCollaborator extends Model
{
    public const ROLE_VIEW = 'view';
    public const ROLE_EDIT = 'edit';
    public const ROLE_ADMIN = 'admin';

    protected $fillable = [
        'script_id',
        'user_id',
        'role',
    ];

    public function script(): BelongsTo
    {
        return $this->belongsTo(Script::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function canEdit(): bool
    {
        return in_array($this->role, [self::ROLE_EDIT, self::ROLE_ADMIN], true);
    }

    public function canDelete(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function canManageAccess(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }
}
