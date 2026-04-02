<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Console;

use App\Models\Tenant;
use Cron\CronExpression;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Modules\WorkerAgents\Jobs\RunWorkerAgentJob;
use Modules\WorkerAgents\Models\WorkerAgent;

final class DispatchDueWorkerAgentsCommand extends Command
{
    protected $signature = 'worker-agents:dispatch-due';

    protected $description = 'Dispatch scheduled worker agent runs (cron + tenant scope).';

    public function handle(): int
    {
        $tenants = Tenant::query()->get();
        $dispatched = 0;

        foreach ($tenants as $tenant) {
            tenancy()->initialize($tenant);
            try {
                WorkerAgent::query()
                    ->where('enabled', true)
                    ->where('automation_enabled', true)
                    ->whereNull('paused_at')
                    ->whereNotNull('schedule_cron')
                    ->each(function (WorkerAgent $worker) use (&$dispatched): void {
                        try {
                            $cron = CronExpression::factory($worker->schedule_cron);
                        } catch (\Throwable) {
                            return;
                        }

                        $tz = $worker->schedule_timezone ?: 'UTC';
                        $now = Carbon::now($tz);
                        if (! $cron->isDue($now, $tz)) {
                            return;
                        }

                        RunWorkerAgentJob::dispatch($worker->tenant_id, $worker->id, 'scheduled');
                        $dispatched++;
                    });
            } finally {
                tenancy()->end();
            }
        }

        if ($this->output->isVerbose()) {
            $this->info("Dispatched {$dispatched} worker agent job(s).");
        }

        return self::SUCCESS;
    }
}
