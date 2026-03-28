<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use SQLite3;
use Symfony\Component\Process\Process;

class DatabaseBackupService
{
    /**
     * @return array{0: string, 1: list<string>} Path to archive and temp files to delete after send
     */
    public function createDatabaseZip(bool $includeTenants): array
    {
        $cleanup = [];
        $zipPath = tempnam(sys_get_temp_dir(), 'laravel_db_backup_');
        if ($zipPath === false) {
            throw new RuntimeException('Could not create temporary file.');
        }
        File::delete($zipPath);

        $zip = new \ZipArchive;
        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException('Could not create ZIP archive.');
        }

        $central = $this->dumpCentralToTemp();
        $cleanup[] = $central['path'];
        $zip->addFile($central['path'], $central['name']);

        if ($includeTenants) {
            $defaultDriver = (string) config('database.connections.'.config('database.default').'.driver');
            foreach (Tenant::query()->orderBy('id')->cursor() as $tenant) {
                $resolvedSqlite = null;
                if ($defaultDriver === 'sqlite') {
                    $resolvedSqlite = $this->resolveTenantSqlitePath($tenant);
                    if ($resolvedSqlite === null) {
                        Log::info('Tenant database backup skipped (no database file on disk)', [
                            'tenant_id' => $tenant->getKey(),
                        ]);

                        continue;
                    }
                }

                try {
                    $t = $this->dumpTenantToTemp($tenant, $resolvedSqlite);
                    $cleanup[] = $t['path'];
                    $zip->addFile($t['path'], $t['name']);
                } catch (\Throwable $e) {
                    Log::warning('Tenant database backup skipped', [
                        'tenant_id' => $tenant->getKey(),
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        if ($zip->close() !== true) {
            foreach ($cleanup as $p) {
                if (is_file($p)) {
                    File::delete($p);
                }
            }
            throw new RuntimeException('Could not finalize ZIP archive.');
        }

        foreach ($cleanup as $p) {
            if (is_file($p)) {
                File::delete($p);
            }
        }

        return [$zipPath, []];
    }

    /**
     * @return array{path: string, name: string}
     */
    public function dumpCentralToTemp(): array
    {
        $connectionName = (string) config('database.default');
        $config = config("database.connections.{$connectionName}");
        if (! is_array($config)) {
            throw new RuntimeException('Database connection is not configured.');
        }

        $driver = (string) ($config['driver'] ?? '');

        return match ($driver) {
            'sqlite' => $this->dumpSqliteConnectionToTemp($config, 'central-database.sqlite'),
            'mysql', 'mariadb' => $this->dumpMysqlLikeToTemp($config, 'central-database.sql'),
            'pgsql' => $this->dumpPgsqlToTemp($config, 'central-database.sql'),
            default => throw new RuntimeException("Unsupported database driver for backup: {$driver}"),
        };
    }

    /**
     * Resolve on-disk path for a tenant SQLite DB, or null if Stancl reports no file (orphan tenant row).
     */
    public function resolveTenantSqlitePath(Tenant $tenant): ?string
    {
        $connectionName = (string) config('database.default');
        $config = config("database.connections.{$connectionName}");
        if (! is_array($config) || ($config['driver'] ?? '') !== 'sqlite') {
            return null;
        }

        $name = $tenant->database()->getName();
        if ($name === null || $name === '') {
            return null;
        }

        $manager = $tenant->database()->manager();
        if (! $manager->databaseExists($name)) {
            return null;
        }

        $path = database_path($name);

        return is_file($path) && is_readable($path) ? $path : null;
    }

    /**
     * @return array{path: string, name: string}
     */
    public function dumpTenantToTemp(Tenant $tenant, ?string $resolvedSqlitePath = null): array
    {
        $name = $tenant->database()->getName();
        if ($name === null || $name === '') {
            throw new RuntimeException('Tenant has no database name.');
        }

        $connectionName = (string) config('database.default');
        $config = config("database.connections.{$connectionName}");
        if (! is_array($config)) {
            throw new RuntimeException('Database connection is not configured.');
        }

        $driver = (string) ($config['driver'] ?? '');
        $safeSlug = preg_replace('/[^a-z0-9_-]+/i', '-', (string) ($tenant->slug ?? 'org')) ?: 'org';
        $base = 'tenant-'.$tenant->getKey().'-'.$safeSlug;

        return match ($driver) {
            'sqlite' => $this->dumpSqliteFileToTemp(
                $resolvedSqlitePath ?? database_path($name),
                $base.'.sqlite'
            ),
            'mysql', 'mariadb' => $this->dumpMysqlLikeToTemp($config, $base.'.sql', $name),
            'pgsql' => $this->dumpPgsqlToTemp($config, $base.'.sql', $name),
            default => throw new RuntimeException("Unsupported database driver for backup: {$driver}"),
        };
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array{path: string, name: string}
     */
    private function dumpSqliteConnectionToTemp(array $config, string $archiveName): array
    {
        $database = (string) ($config['database'] ?? '');
        if ($database === '' || ! is_file($database)) {
            throw new RuntimeException('SQLite database file does not exist or is not configured.');
        }

        return $this->dumpSqliteFileToTemp($database, $archiveName);
    }

    /**
     * @return array{path: string, name: string}
     */
    private function dumpSqliteFileToTemp(string $sqlitePath, string $archiveName): array
    {
        if (! is_file($sqlitePath) || ! is_readable($sqlitePath)) {
            throw new RuntimeException('SQLite database file is not readable: '.$sqlitePath);
        }

        $tmp = tempnam(sys_get_temp_dir(), 'sqlite_bk_');
        if ($tmp === false) {
            throw new RuntimeException('Could not create temporary file.');
        }
        File::delete($tmp);

        $sqlite3 = $this->findSqlite3Binary();
        if ($sqlite3 !== null) {
            $process = new Process([$sqlite3, $sqlitePath, '.backup '.$tmp]);
            $process->setTimeout(120);
            $process->run();
            if ($process->isSuccessful() && is_file($tmp) && filesize($tmp) > 0) {
                return ['path' => $tmp, 'name' => $archiveName];
            }
        }

        if (! extension_loaded('sqlite3')) {
            throw new RuntimeException(
                'SQLite backup failed: install the sqlite3 CLI or enable the PHP sqlite3 extension.'
            );
        }

        $source = new SQLite3($sqlitePath, SQLITE3_OPEN_READONLY);
        $source->busyTimeout(20_000);
        $dest = new SQLite3($tmp);
        $dest->busyTimeout(20_000);
        try {
            $err = $source->backup($dest);
            if ($err === false) {
                throw new RuntimeException('SQLite backup failed.');
            }
        } finally {
            $source->close();
            $dest->close();
        }

        if (! is_file($tmp) || filesize($tmp) === 0) {
            throw new RuntimeException('SQLite backup produced an empty file.');
        }

        return ['path' => $tmp, 'name' => $archiveName];
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array{path: string, name: string}
     */
    private function dumpMysqlLikeToTemp(array $config, string $archiveName, ?string $databaseOverride = null): array
    {
        $binary = $this->findMysqldumpBinary();
        if ($binary === null) {
            throw new RuntimeException('mysqldump was not found in PATH. Install MySQL client tools on the server.');
        }

        $database = $databaseOverride ?? (string) ($config['database'] ?? '');
        if ($database === '') {
            throw new RuntimeException('MySQL database name is missing.');
        }

        $host = (string) ($config['host'] ?? '127.0.0.1');
        $port = (string) ($config['port'] ?? '3306');
        $username = (string) ($config['username'] ?? 'root');
        $password = (string) ($config['password'] ?? '');

        $tmp = tempnam(sys_get_temp_dir(), 'mysql_bk_');
        if ($tmp === false) {
            throw new RuntimeException('Could not create temporary file.');
        }
        File::delete($tmp);

        $args = [
            $binary,
            '--single-transaction',
            '--quick',
            '--routines',
            '--no-tablespaces',
            '-h'.$host,
            '-P'.$port,
            '-u'.$username,
            $database,
        ];

        $process = new Process($args);
        $process->setTimeout(3600);
        $process->setEnv(array_merge($_ENV, ['MYSQL_PWD' => $password]));
        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException('mysqldump failed: '.$process->getErrorOutput().$process->getOutput());
        }

        File::put($tmp, $process->getOutput());

        return ['path' => $tmp, 'name' => $archiveName];
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array{path: string, name: string}
     */
    private function dumpPgsqlToTemp(array $config, string $archiveName, ?string $databaseOverride = null): array
    {
        $binary = $this->findPgDumpBinary();
        if ($binary === null) {
            throw new RuntimeException('pg_dump was not found in PATH. Install PostgreSQL client tools on the server (e.g. postgresql-client).');
        }

        $database = $databaseOverride ?? (string) ($config['database'] ?? '');
        if ($database === '') {
            throw new RuntimeException('PostgreSQL database name is missing.');
        }

        $host = (string) ($config['host'] ?? '127.0.0.1');
        $port = (string) ($config['port'] ?? '5432');
        $username = (string) ($config['username'] ?? 'postgres');
        $password = (string) ($config['password'] ?? '');

        $tmp = tempnam(sys_get_temp_dir(), 'pgsql_bk_');
        if ($tmp === false) {
            throw new RuntimeException('Could not create temporary file.');
        }
        File::delete($tmp);

        $args = [
            $binary,
            '-h', $host,
            '-p', $port,
            '-U', $username,
            '-F', 'p',
            $database,
        ];

        $process = new Process($args);
        $process->setTimeout(3600);
        $process->setEnv(array_merge($_ENV, ['PGPASSWORD' => $password]));
        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException('pg_dump failed: '.$process->getErrorOutput().$process->getOutput());
        }

        File::put($tmp, $process->getOutput());

        return ['path' => $tmp, 'name' => $archiveName];
    }

    private function findSqlite3Binary(): ?string
    {
        $fromPath = $this->findExecutable('sqlite3');
        if ($fromPath !== null) {
            return $fromPath;
        }

        $common = ['/usr/bin/sqlite3', '/bin/sqlite3', '/opt/homebrew/bin/sqlite3', '/usr/local/bin/sqlite3'];
        foreach ($common as $candidate) {
            if (is_file($candidate) && is_executable($candidate)) {
                return $candidate;
            }
        }

        return null;
    }

    private function findPgDumpBinary(): ?string
    {
        $fromPath = $this->findExecutable('pg_dump');
        if ($fromPath !== null) {
            return $fromPath;
        }

        $common = [
            '/usr/bin/pg_dump',
            '/usr/local/bin/pg_dump',
            '/opt/homebrew/bin/pg_dump',
            '/opt/homebrew/opt/libpq/bin/pg_dump',
        ];
        foreach ($common as $candidate) {
            if (is_file($candidate) && is_executable($candidate)) {
                return $candidate;
            }
        }

        return null;
    }

    private function findMysqldumpBinary(): ?string
    {
        $fromPath = $this->findExecutable('mysqldump');
        if ($fromPath !== null) {
            return $fromPath;
        }

        $common = ['/usr/bin/mysqldump', '/usr/local/bin/mysqldump', '/opt/homebrew/bin/mysqldump'];
        foreach ($common as $candidate) {
            if (is_file($candidate) && is_executable($candidate)) {
                return $candidate;
            }
        }

        return null;
    }

    private function findExecutable(string $name): ?string
    {
        $paths = array_filter(explode(PATH_SEPARATOR, (string) getenv('PATH')));
        foreach ($paths as $dir) {
            $candidate = $dir.DIRECTORY_SEPARATOR.$name;
            if (is_file($candidate) && is_executable($candidate)) {
                return $candidate;
            }
        }

        if (PHP_OS_FAMILY === 'Windows') {
            $which = new Process(['where', $name]);
            $which->run();
            if ($which->isSuccessful()) {
                $line = trim(explode("\n", $which->getOutput())[0] ?? '');

                return $line !== '' ? $line : null;
            }
        }

        return null;
    }
}
