<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\Models\User;
use Modules\WorkerAgents\Support\WorkerAgentProposalStatus;
use Modules\WorkerAgents\Support\WorkerAgentProposalType;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class WorkerAgentProposal extends Model
{
    use BelongsToTenant;

    protected $table = 'worker_agent_proposals';

    protected $fillable = [
        'tenant_id',
        'uuid',
        'worker_agent_id',
        'worker_agent_run_id',
        'type',
        'payload',
        'status',
        'reviewed_by_user_id',
        'reviewed_at',
        'review_note',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'reviewed_at' => 'datetime',
            'type' => WorkerAgentProposalType::class,
            'status' => WorkerAgentProposalStatus::class,
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

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function booted(): void
    {
        static::creating(function (WorkerAgentProposal $model): void {
            if (empty($model->uuid)) {
                $model->uuid = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }
}
