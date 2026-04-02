<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\WorkerAgents\Support\WorkerAgentRunEventLevel;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class WorkerAgentRunEvent extends Model
{
    use BelongsToTenant;

    protected $table = 'worker_agent_run_events';

    protected $fillable = [
        'tenant_id',
        'worker_agent_run_id',
        'level',
        'event_type',
        'message',
        'context',
    ];

    protected function casts(): array
    {
        return [
            'context' => 'array',
            'level' => WorkerAgentRunEventLevel::class,
        ];
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(WorkerAgentRun::class, 'worker_agent_run_id');
    }
}
