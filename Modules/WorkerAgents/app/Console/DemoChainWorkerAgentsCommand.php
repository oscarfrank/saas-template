<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Console;

use App\Models\Tenant;
use Illuminate\Console\Command;
use Modules\WorkerAgents\Jobs\RunWorkerAgentJob;
use Modules\WorkerAgents\Services\WorkerAgentDemoChainService;

/**
 * Seeds a repeatable multi-agent scenario: lead analyzes → handoff (auto_accept) → specialist completes work → human calendar todo.
 *
 * Usage:
 *   php artisan worker-agents:demo-chain
 *   php artisan worker-agents:demo-chain your-tenant-slug
 *   php artisan worker-agents:demo-chain your-tenant-slug --run
 */
final class DemoChainWorkerAgentsCommand extends Command
{
    protected $signature = 'worker-agents:demo-chain
                            {tenant_slug? : Tenant slug (defaults to first tenant)}
                            {--run : After seeding, dispatch the lead worker job (requires queue worker unless sync)}';

    protected $description = 'Create Demo Chain lead + specialist workers, a shared goal, and a human staff delegate for calendar todos';

    public function handle(WorkerAgentDemoChainService $demoChain): int
    {
        $slug = $this->argument('tenant_slug');

        $tenant = $slug !== null && $slug !== ''
            ? Tenant::query()->where('slug', $slug)->first()
            : Tenant::query()->orderBy('id')->first();

        if ($tenant === null) {
            $this->error('No tenant found. Pass a valid tenant_slug or create a tenant first.');

            return self::FAILURE;
        }

        tenancy()->initialize($tenant);
        $tenantId = (string) $tenant->id;

        try {
            $result = $demoChain->prepare($tenantId);

            $this->newLine();
            $this->info('Demo chain scenario is ready.');
            $this->table(
                ['Item', 'Value'],
                [
                    ['Tenant', $tenant->name.' ('.$tenant->slug.')'],
                    ['Organization goal', $result->goal->title.' (id '.$result->goal->id.')'],
                    ['Human delegate (calendar todo)', 'Staff #'.$result->human->id.' · '.$result->human->employee_id],
                    ['Lead worker', $result->lead->name.' (id '.$result->lead->id.', uuid '.$result->lead->uuid.')'],
                    ['Specialist worker', $result->specialist->name.' (id '.$result->specialist->id.', uuid '.$result->specialist->uuid.')'],
                ]
            );

            $this->line('Next steps:');
            $this->line('  1. Ensure <fg=cyan>OPENAI_API_KEY</> (or Anthropic) is set and queue is running (<fg=cyan>composer dev</> includes <fg=cyan>queue:listen</>).');
            $this->line('  2. Open Worker agents → Demo chain or run <fg=cyan>'.$result->lead->name.'</> (Run now), or use <fg=cyan>--run</> below.');
            $this->line('  3. Watch runs/messages on both workers; check HR → Tasks for analysis, completion, and human todo.');
            $this->newLine();

            if ($this->option('run')) {
                RunWorkerAgentJob::dispatch($tenantId, $result->lead->id, 'demo_chain');
                $this->info('Dispatched RunWorkerAgentJob for the lead worker (trigger=demo_chain).');
            } else {
                $this->comment('Tip: re-run with --run to queue the lead job from the CLI, or use the Demo chain page in the app.');
            }
        } finally {
            tenancy()->end();
        }

        return self::SUCCESS;
    }
}
