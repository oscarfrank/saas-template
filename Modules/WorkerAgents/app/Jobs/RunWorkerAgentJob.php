<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Jobs;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Modules\WorkerAgents\Models\WorkerAgent;
use Modules\WorkerAgents\Models\WorkerAgentRun;
use Modules\WorkerAgents\Services\WorkerAgentRunOrchestrator;

final class RunWorkerAgentJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Queued on the default queue — run `php artisan queue:work` (or your dev `composer run dev` which includes a worker).
     */
    public int $timeout = 900;

    public function __construct(
        public string $tenantId,
        public int $workerAgentId,
        public string $trigger,
    ) {}

    /**
     * @return list<object>
     */
    public function middleware(): array
    {
        return [
            (new WithoutOverlapping('worker-agent:'.$this->tenantId.':'.$this->workerAgentId))->releaseAfter(60),
        ];
    }

    public function handle(WorkerAgentRunOrchestrator $orchestrator): void
    {
        $tenant = Tenant::query()->find($this->tenantId);
        if ($tenant === null) {
            return;
        }

        tenancy()->initialize($tenant);

        try {
            $worker = WorkerAgent::query()->find($this->workerAgentId);
            if ($worker === null || ! $worker->enabled) {
                return;
            }

            if ($worker->paused_at !== null) {
                $this->recordSkipped($worker, 'Worker is paused.');

                return;
            }

            if ($this->trigger === 'scheduled' && ! $worker->automation_enabled) {
                $this->recordSkipped($worker, 'Automation disabled.');

                return;
            }

            if ($worker->max_runs_per_hour !== null) {
                $recent = WorkerAgentRun::query()
                    ->where('worker_agent_id', $worker->id)
                    ->where('created_at', '>=', now()->subHour())
                    ->whereIn('status', ['pending', 'running', 'completed'])
                    ->count();
                if ($recent >= $worker->max_runs_per_hour) {
                    $this->recordSkipped($worker, 'Hourly run limit reached.');

                    return;
                }
            }

            $run = WorkerAgentRun::query()->create([
                'tenant_id' => $worker->tenant_id,
                'worker_agent_id' => $worker->id,
                'status' => 'running',
                'trigger' => $this->trigger,
                'started_at' => now(),
            ]);

            try {
                $orchestrator->execute($worker, $run);
            } catch (\Throwable $e) {
                Log::error('WorkerAgent run failed', [
                    'worker_agent_id' => $worker->id,
                    'exception' => $e->getMessage(),
                ]);
                $run->update([
                    'status' => 'failed',
                    'finished_at' => now(),
                    'error_message' => $e->getMessage(),
                ]);
                throw $e;
            }
        } finally {
            tenancy()->end();
        }
    }

    private function recordSkipped(WorkerAgent $worker, string $reason): void
    {
        WorkerAgentRun::query()->create([
            'tenant_id' => $worker->tenant_id,
            'worker_agent_id' => $worker->id,
            'status' => 'skipped',
            'trigger' => $this->trigger,
            'started_at' => now(),
            'finished_at' => now(),
            'summary' => $reason,
        ]);
    }
}
