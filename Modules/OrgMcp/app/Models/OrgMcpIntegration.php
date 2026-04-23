<?php

declare(strict_types=1);

namespace Modules\OrgMcp\Models;

use Illuminate\Database\Eloquent\Model;

class OrgMcpIntegration extends Model
{
    protected $table = 'org_mcp_integrations';

    protected $fillable = [
        'tenant_id',
        'provider',
        'status',
        'scopes',
        'credentials',
        'last_sync_at',
    ];

    protected function casts(): array
    {
        return [
            'scopes' => 'array',
            'credentials' => 'encrypted:array',
            'last_sync_at' => 'datetime',
        ];
    }
}
