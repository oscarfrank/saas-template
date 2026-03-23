<?php

declare(strict_types=1);

namespace Modules\Cortex\Console;

use Illuminate\Console\Command;
use Modules\Cortex\Jobs\PulseRunDigestPipelineJob;
use Modules\Cortex\Models\PulseSetting;

final class PulseScheduledDigestsCommand extends Command
{
    protected $signature = 'cortex:pulse-scheduled-digests';

    protected $description = 'Dispatch scheduled Pulse digest runs (feeds + ideas) for tenants with auto-pull enabled.';

    public function handle(): int
    {
        $settings = PulseSetting::query()
            ->where('auto_pull_enabled', true)
            ->get();

        foreach ($settings as $row) {
            $tenantId = (string) $row->tenant_id;
            $tz = is_string($row->digest_timezone) && $row->digest_timezone !== ''
                ? $row->digest_timezone
                : (string) config('app.timezone');
            $now = now($tz);
            $today = $now->toDateString();
            $target = (string) $row->auto_pull_time;

            if ($now->format('H:i') !== $target) {
                continue;
            }

            if ($row->last_auto_digest_date !== null && $row->last_auto_digest_date->toDateString() === $today) {
                continue;
            }

            PulseRunDigestPipelineJob::dispatch($tenantId, 'full', $today, true);
            $this->line("Queued Pulse digest for tenant {$tenantId} ({$today}).");
        }

        return self::SUCCESS;
    }
}
