<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\HR\Models\Staff;
use Modules\User\Models\User;
use Modules\WorkerAgents\Support\WorkerAgentMessageRole;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class WorkerAgentMessage extends Model
{
    use BelongsToTenant;

    protected $table = 'worker_agent_messages';

    protected $fillable = [
        'tenant_id',
        'worker_agent_id',
        'worker_agent_run_id',
        'role',
        'user_id',
        'staff_id',
        'body',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'role' => WorkerAgentMessageRole::class,
        ];
    }

    public function workerAgent(): BelongsTo
    {
        return $this->belongsTo(WorkerAgent::class, 'worker_agent_id');
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(WorkerAgentRun::class, 'worker_agent_run_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }
}
