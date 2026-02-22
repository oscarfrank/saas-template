<?php

namespace Modules\Script\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\Models\User;

/**
 * Co-author attribution for a script. Access is via collaborators or org default.
 */
class ScriptCoAuthor extends Model
{
    protected $fillable = [
        'script_id',
        'user_id',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
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
