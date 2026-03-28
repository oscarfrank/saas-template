<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\Models\User;

class AiCallLog extends Model
{
    protected $fillable = [
        'tenant_id',
        'user_id',
        'invocation_kind',
        'source',
        'route_name',
        'provider',
        'api_family',
        'model',
        'prompt_tokens',
        'completion_tokens',
        'total_tokens',
        'duration_ms',
        'success',
        'http_status',
        'error_message',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
            'success' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
