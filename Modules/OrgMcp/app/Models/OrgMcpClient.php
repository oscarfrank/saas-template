<?php

declare(strict_types=1);

namespace Modules\OrgMcp\Models;

use Illuminate\Database\Eloquent\Model;

class OrgMcpClient extends Model
{
    protected $table = 'org_mcp_clients';

    protected $fillable = [
        'tenant_id',
        'name',
        'client_key',
        'client_secret_hash',
        'allowed_tools',
        'is_active',
        'last_used_at',
    ];

    protected function casts(): array
    {
        return [
            'allowed_tools' => 'array',
            'is_active' => 'boolean',
            'last_used_at' => 'datetime',
        ];
    }
}
