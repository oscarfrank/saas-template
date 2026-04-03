<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\Models\User;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class WorkerAgentMemory extends Model
{
    use BelongsToTenant;

    protected $table = 'worker_agent_memories';

    protected $fillable = [
        'tenant_id',
        'worker_agent_id',
        'uuid',
        'body',
        'source',
        'user_id',
        'worker_agent_run_id',
    ];

    public function workerAgent(): BelongsTo
    {
        return $this->belongsTo(WorkerAgent::class, 'worker_agent_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(WorkerAgentRun::class, 'worker_agent_run_id');
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function booted(): void
    {
        static::creating(function (WorkerAgentMemory $model): void {
            if (empty($model->uuid)) {
                $model->uuid = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }
}
