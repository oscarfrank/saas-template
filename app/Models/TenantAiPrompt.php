<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantAiPrompt extends Model
{
    protected $fillable = [
        'tenant_id',
        'key',
        'is_custom',
        'label',
        'system_prompt',
    ];

    protected function casts(): array
    {
        return [
            'is_custom' => 'boolean',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
