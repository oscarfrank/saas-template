<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\File;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;
use SplFileInfo;
use ZipArchive;

class StorageBackupService
{
    /**
     * Relative paths under storage/app to skip (volatile or huge).
     */
    private const SKIP_PREFIXES = [
        'framework/cache',
        'framework/sessions',
        'framework/views',
    ];

    /**
     * @return array{0: string, 1: list<string>} Zip path and temp paths to cleanup (empty for this impl.)
     */
    public function createStorageAppZip(): array
    {
        $root = storage_path('app');
        if (! is_dir($root)) {
            throw new RuntimeException('storage/app does not exist.');
        }

        $zipPath = tempnam(sys_get_temp_dir(), 'laravel_storage_backup_');
        if ($zipPath === false) {
            throw new RuntimeException('Could not create temporary file.');
        }
        File::delete($zipPath);

        $zip = new ZipArchive;
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException('Could not create ZIP archive.');
        }

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($root, RecursiveDirectoryIterator::SKIP_DOTS)
        );

        /** @var SplFileInfo $file */
        foreach ($iterator as $file) {
            if (! $file->isFile()) {
                continue;
            }
            $full = $file->getPathname();
            $relative = ltrim(str_replace($root.DIRECTORY_SEPARATOR, '', $full), DIRECTORY_SEPARATOR);
            $relativeUnix = str_replace(DIRECTORY_SEPARATOR, '/', $relative);
            if ($this->shouldSkip($relativeUnix)) {
                continue;
            }
            $zip->addFile($full, 'storage-app/'.$relativeUnix);
        }

        if ($zip->close() !== true) {
            File::delete($zipPath);
            throw new RuntimeException('Could not finalize storage ZIP archive.');
        }

        return [$zipPath, []];
    }

    private function shouldSkip(string $relativeUnix): bool
    {
        foreach (self::SKIP_PREFIXES as $prefix) {
            if ($relativeUnix === $prefix || str_starts_with($relativeUnix, $prefix.'/')) {
                return true;
            }
        }

        return false;
    }
}
