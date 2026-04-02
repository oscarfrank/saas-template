<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\HR\Models\Task;
use Modules\User\Models\User;
use Modules\WorkerAgents\Support\WorkerAgentHandoffStatus;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class WorkerAgentHandoff extends Model
{
    use BelongsToTenant;

    protected $table = 'worker_agent_handoffs';

    protected $fillable = [
        'tenant_id',
        'uuid',
        'from_worker_agent_id',
        'to_worker_agent_id',
        'hr_task_id',
        'message',
        'status',
        'worker_agent_run_id',
        'resolved_by_user_id',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
            'status' => WorkerAgentHandoffStatus::class,
        ];
    }

    public function fromWorkerAgent(): BelongsTo
    {
        return $this->belongsTo(WorkerAgent::class, 'from_worker_agent_id');
    }

    public function toWorkerAgent(): BelongsTo
    {
        return $this->belongsTo(WorkerAgent::class, 'to_worker_agent_id');
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'hr_task_id');
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(WorkerAgentRun::class, 'worker_agent_run_id');
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by_user_id');
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function booted(): void
    {
        static::creating(function (WorkerAgentHandoff $model): void {
            if (empty($model->uuid)) {
                $model->uuid = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }
}
