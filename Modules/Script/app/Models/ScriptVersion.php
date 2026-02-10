<?php

namespace Modules\Script\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\Models\User;

class ScriptVersion extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'script_id',
        'content',
        'title',
        'description',
        'meta_tags',
        'created_by',
        'created_at',
    ];

    protected $casts = [
        'content' => 'array',
        'created_at' => 'datetime',
    ];

    public function script(): BelongsTo
    {
        return $this->belongsTo(Script::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
