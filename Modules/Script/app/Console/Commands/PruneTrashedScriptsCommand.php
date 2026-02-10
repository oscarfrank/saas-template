<?php

namespace Modules\Script\Console\Commands;

use Illuminate\Console\Command;
use Modules\Script\Models\Script;

class PruneTrashedScriptsCommand extends Command
{
    protected $signature = 'script:prune-trashed
                            {--days=30 : Permanently delete scripts that have been in the recycle bin for this many days}
                            {--dry-run : List what would be deleted without deleting}';

    protected $description = 'Permanently delete scripts that have been in the recycle bin for more than the specified days (default 30).';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $dryRun = $this->option('dry-run');
        $cutoff = now()->subDays($days);

        $query = Script::onlyTrashed()->where('deleted_at', '<', $cutoff);
        $count = $query->count();

        if ($count === 0) {
            $this->info('No trashed scripts older than ' . $days . ' days.');
            return self::SUCCESS;
        }

        if ($dryRun) {
            $this->warn("[Dry run] Would permanently delete {$count} script(s) (trashed before " . $cutoff->toDateString() . ').');
            return self::SUCCESS;
        }

        $bar = $this->output->createProgressBar($count);
        $bar->start();
        $deleted = 0;
        $query->chunkById(50, function ($scripts) use (&$deleted, $bar) {
            foreach ($scripts as $script) {
                $script->forceDelete();
                $deleted++;
                $bar->advance();
            }
        });
        $bar->finish();
        $this->newLine();
        $this->info("Permanently deleted {$deleted} script(s).");
        return self::SUCCESS;
    }
}
