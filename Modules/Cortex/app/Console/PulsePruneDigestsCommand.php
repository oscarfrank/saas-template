<?php

declare(strict_types=1);

namespace Modules\Cortex\Console;

use Illuminate\Console\Command;
use Modules\Cortex\Models\PulseDailyDigest;

final class PulsePruneDigestsCommand extends Command
{
    protected $signature = 'cortex:pulse-prune-digests {--days=7 : Number of days to keep, including today}';

    protected $description = 'Delete Pulse daily digest rows older than the retention window.';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $cutoff = now()->subDays($days - 1)->toDateString();

        $deleted = PulseDailyDigest::query()
            ->whereDate('digest_date', '<', $cutoff)
            ->delete();

        $this->info("Deleted {$deleted} Pulse digest row(s) older than {$cutoff}.");

        return self::SUCCESS;
    }
}
