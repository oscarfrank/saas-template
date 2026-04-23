<?php

declare(strict_types=1);

namespace Modules\OrgMcp\Models;

use Illuminate\Database\Eloquent\Model;

class OrgMcpAuditLog extends Model
{
    protected $table = 'org_mcp_audit_logs';

    protected $fillable = [
        'tenant_id',
        'client_id',
        'profile_user_id',
        'tool',
        'request_hash',
        'request_meta',
        'response_meta',
        'status',
        'error_message',
        'duration_ms',
    ];

    protected function casts(): array
    {
        return [
            'request_meta' => 'array',
            'response_meta' => 'array',
            'profile_user_id' => 'integer',
            'duration_ms' => 'integer',
        ];
    }
}
