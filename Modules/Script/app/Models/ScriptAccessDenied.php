<?php

namespace Modules\Script\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\Models\User;

/**
 * Explicit deny: user has org-level script access but must not see this script.
 */
class ScriptAccessDenied extends Model
{
    protected $table = 'script_access_denied';

    protected $fillable = [
        'script_id',
        'user_id',
    ];

    public function script(): BelongsTo
    {
        return $this->belongsTo(Script::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
