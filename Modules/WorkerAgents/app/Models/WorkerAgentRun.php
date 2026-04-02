<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class WorkerAgentRun extends Model
{
    use BelongsToTenant;

    protected $table = 'worker_agent_runs';

    protected $fillable = [
        'tenant_id',
        'worker_agent_id',
        'status',
        'trigger',
        'started_at',
        'finished_at',
        'error_message',
        'summary',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function workerAgent(): BelongsTo
    {
        return $this->belongsTo(WorkerAgent::class, 'worker_agent_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(WorkerAgentRunEvent::class, 'worker_agent_run_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(WorkerAgentMessage::class, 'worker_agent_run_id');
    }
}
