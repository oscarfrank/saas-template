<?php

namespace Modules\Script\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ScriptThumbnail extends Model
{
    protected $appends = ['url'];
    protected $fillable = [
        'script_id',
        'type',
        'storage_path',
        'disk',
        'filename',
        'mime_type',
        'size',
        'sort_order',
    ];

    protected $casts = [
        'size' => 'integer',
        'sort_order' => 'integer',
    ];

    public function script(): BelongsTo
    {
        return $this->belongsTo(Script::class);
    }

    public function getUrlAttribute(): ?string
    {
        if (! $this->storage_path) {
            return null;
        }
        // Use asset() so the URL matches the app base (works with subpath, tenant, and APP_URL).
        if ($this->disk === 'public') {
            return asset('storage/' . ltrim($this->storage_path, '/'));
        }
        return Storage::disk($this->disk)->url($this->storage_path);
    }
}
