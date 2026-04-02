<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Cortex\Support\CortexLlmProvider;
use Modules\WorkerAgents\Support\WorkerAgentInputScope;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class WorkerAgent extends Model
{
    use BelongsToTenant;

    protected $table = 'worker_agents';

    protected $fillable = [
        'tenant_id',
        'uuid',
        'staff_id',
        'name',
        'skills',
        'capabilities',
        'organization_goal_ids',
        'schedule_kind',
        'schedule_time',
        'schedule_day_of_week',
        'schedule_cron',
        'schedule_timezone',
        'input_scope',
        'input_worker_agent_ids',
        'input_project_ids',
        'automation_enabled',
        'requires_approval',
        'max_runs_per_hour',
        'daily_llm_budget_cents',
        'paused_at',
        'enabled',
        'llm_provider',
        'chat_model',
        'config_version',
    ];

    protected function casts(): array
    {
        return [
            'capabilities' => 'array',
            'organization_goal_ids' => 'array',
            'input_worker_agent_ids' => 'array',
            'input_project_ids' => 'array',
            'schedule_day_of_week' => 'integer',
            'automation_enabled' => 'boolean',
            'requires_approval' => 'boolean',
            'paused_at' => 'datetime',
            'enabled' => 'boolean',
            'llm_provider' => CortexLlmProvider::class,
        ];
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(\Modules\HR\Models\Staff::class, 'staff_id');
    }

    public function runs(): HasMany
    {
        return $this->hasMany(WorkerAgentRun::class, 'worker_agent_id');
    }

    public function proposals(): HasMany
    {
        return $this->hasMany(WorkerAgentProposal::class, 'worker_agent_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(WorkerAgentMessage::class, 'worker_agent_id');
    }

    public function handoffsFrom(): HasMany
    {
        return $this->hasMany(WorkerAgentHandoff::class, 'from_worker_agent_id');
    }

    public function handoffsTo(): HasMany
    {
        return $this->hasMany(WorkerAgentHandoff::class, 'to_worker_agent_id');
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function inputScopeEnum(): WorkerAgentInputScope
    {
        return WorkerAgentInputScope::tryFrom((string) $this->input_scope)
            ?? WorkerAgentInputScope::AllWorkers;
    }

    protected static function booted(): void
    {
        static::creating(function (WorkerAgent $model): void {
            if (empty($model->uuid)) {
                $model->uuid = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }
}
