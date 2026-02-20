<?php

namespace App\Install;

class InstallChecker
{
    /**
     * Path to the file that marks the application as installed.
     */
    protected static string $installedPath = 'app/installed';

    /**
     * Whether the application has been installed (wizard completed).
     */
    public static function isInstalled(): bool
    {
        return file_exists(storage_path(static::$installedPath));
    }

    /**
     * Mark the application as installed. Call this after the install wizard completes.
     */
    public static function markInstalled(): void
    {
        $path = storage_path(static::$installedPath);
        $dir = dirname($path);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents($path, (string) time());
    }
}
