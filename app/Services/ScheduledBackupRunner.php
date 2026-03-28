<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\BackupSettings;
use Carbon\Carbon;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Throwable;

class ScheduledBackupRunner
{
    public function __construct(
        protected DatabaseBackupService $databaseBackup,
        protected StorageBackupService $storageBackup,
        protected GoogleDriveBackupService $googleDrive
    ) {}

    /**
     * Run scheduled backup if settings and clock say so. Safe to call every minute.
     */
    public function runIfDue(): void
    {
        $settings = BackupSettings::instance();

        if (! $settings->schedule_enabled) {
            return;
        }

        if (! $settings->isGoogleDriveConnected()) {
            return;
        }

        if (! $this->shouldRunNow($settings)) {
            return;
        }

        $refresh = (string) $settings->google_drive_refresh_token_encrypted;
        $folderId = $settings->google_drive_folder_id;
        $folderId = is_string($folderId) && $folderId !== '' ? $folderId : null;

        $stamp = Carbon::now()->format('Y-m-d_His');
        $cleanup = [];

        try {
            [$dbZip, $dbCleanup] = $this->databaseBackup->createDatabaseZip(true);
            $cleanup = array_merge($cleanup, $dbCleanup, [$dbZip]);

            $this->googleDrive->uploadFile(
                $dbZip,
                "laravel-databases-{$stamp}.zip",
                $folderId,
                $refresh
            );

            if ($settings->schedule_include_storage) {
                [$storageZip] = $this->storageBackup->createStorageAppZip();
                $cleanup[] = $storageZip;

                $this->googleDrive->uploadFile(
                    $storageZip,
                    "laravel-storage-app-{$stamp}.zip",
                    $folderId,
                    $refresh
                );
            }

            $settings->last_scheduled_run_at = Carbon::now();
            $settings->last_scheduled_error = null;
            $settings->save();
        } catch (Throwable $e) {
            Log::error('Scheduled backup failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            $settings->last_scheduled_error = $e->getMessage();
            $settings->save();
        } finally {
            foreach ($cleanup as $path) {
                if (is_string($path) && $path !== '' && is_file($path)) {
                    File::delete($path);
                }
            }
        }
    }

    private function shouldRunNow(BackupSettings $settings): bool
    {
        $now = Carbon::now();
        $time = (string) $settings->schedule_time;
        if (! preg_match('/^(\d{1,2}):(\d{2})$/', $time, $m)) {
            return false;
        }

        $hour = (int) $m[1];
        $minute = (int) $m[2];
        if ($now->hour !== $hour || $now->minute !== $minute) {
            return false;
        }

        $frequency = (string) $settings->schedule_frequency;

        if ($frequency === 'daily') {
            if ($settings->last_scheduled_run_at instanceof Carbon && $settings->last_scheduled_run_at->isSameDay($now)) {
                return false;
            }

            return true;
        }

        if ($frequency === 'weekly') {
            $wd = $settings->schedule_weekday;
            if ($wd === null || (int) $now->dayOfWeek !== (int) $wd) {
                return false;
            }
            if ($settings->last_scheduled_run_at instanceof Carbon && $settings->last_scheduled_run_at->isSameDay($now)) {
                return false;
            }

            return true;
        }

        return false;
    }
}
