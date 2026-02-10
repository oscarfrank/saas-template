<?php

namespace Modules\Script\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScriptTitleOption extends Model
{
    protected $fillable = [
        'script_id',
        'title',
        'thumbnail_text',
        'is_primary',
        'sort_order',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function script(): BelongsTo
    {
        return $this->belongsTo(Script::class);
    }
}
