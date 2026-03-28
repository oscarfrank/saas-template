<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\ScheduledBackupRunner;
use Illuminate\Console\Command;

class RunScheduledBackupCommand extends Command
{
    protected $signature = 'backup:run-scheduled';

    protected $description = 'Run scheduled database/storage backup to Google Drive when due';

    public function handle(ScheduledBackupRunner $runner): int
    {
        $runner->runIfDue();

        return self::SUCCESS;
    }
}
