<?php

namespace App\Http\Controllers;

use App\Install\InstallChecker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InstallController extends Controller
{
    protected static array $steps = [
        'welcome' => ['title' => 'Welcome', 'order' => 1],
        'requirements' => ['title' => 'Requirements', 'order' => 2],
        'env' => ['title' => 'Environment', 'order' => 3],
        'database' => ['title' => 'Database', 'order' => 4],
        'complete' => ['title' => 'Complete', 'order' => 5],
    ];

    /**
     * Required PHP extensions for the application.
     */
    protected function requiredExtensions(): array
    {
        return [
            'bcmath',
            'ctype',
            'curl',
            'dom',
            'fileinfo',
            'json',
            'mbstring',
            'openssl',
            'pdo',
            'tokenizer',
            'xml',
        ];
    }

    /**
     * Paths that must be writable (relative to base_path).
     */
    protected function writablePaths(): array
    {
        return [
            'storage',
            'storage/app',
            'storage/framework/cache',
            'storage/framework/sessions',
            'storage/framework/views',
            'storage/logs',
            'bootstrap/cache',
        ];
    }

    protected function getRequirements(): array
    {
        $phpVersion = PHP_VERSION;
        $phpOk = version_compare($phpVersion, '8.2.0', '>=');

        $extensions = [];
        foreach ($this->requiredExtensions() as $ext) {
            $loaded = extension_loaded($ext);
            $extensions[] = ['name' => $ext, 'loaded' => $loaded];
        }
        $extensionsOk = ! in_array(false, array_column($extensions, 'loaded'));

        $writable = [];
        foreach ($this->writablePaths() as $path) {
            $full = base_path($path);
            $exists = is_dir($full) || is_file($full);
            $writableFlag = $exists && is_writable($full);
            $writable[] = [
                'path' => $path,
                'exists' => $exists,
                'writable' => $writableFlag,
            ];
        }
        $writableOk = ! in_array(false, array_column($writable, 'writable'));

        return [
            'php_version' => $phpVersion,
            'php_ok' => $phpOk,
            'extensions' => $extensions,
            'extensions_ok' => $extensionsOk,
            'writable' => $writable,
            'writable_ok' => $writableOk,
            'passed' => $phpOk && $extensionsOk && $writableOk,
        ];
    }

    /**
     * Parse .env.example to list variables (keys only; no values).
     */
    protected function getEnvExampleKeys(): array
    {
        $path = base_path('.env.example');
        if (! file_exists($path)) {
            return [];
        }
        $content = file_get_contents($path);
        $keys = [];
        foreach (explode("\n", $content) as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }
            if (str_contains($line, '=')) {
                $keys[] = trim(explode('=', $line, 2)[0]);
            }
        }
        return array_values(array_unique(array_filter($keys)));
    }

    protected function getEnvStatus(): array
    {
        $envPath = base_path('.env');
        $envExists = file_exists($envPath);
        $appKeySet = ! empty(env('APP_KEY'));
        $dbConfigured = false;
        if ($envExists) {
            try {
                DB::connection()->getPdo();
                $dbConfigured = true;
            } catch (\Throwable $e) {
                // ignore
            }
        }

        return [
            'env_exists' => $envExists,
            'app_key_set' => $appKeySet,
            'db_configured' => $dbConfigured,
            'ready' => $envExists && $appKeySet,
        ];
    }

    public function welcome()
    {
        return Inertia::render('install/welcome', [
            'steps' => static::$steps,
            'currentStep' => 'welcome',
        ]);
    }

    public function requirements()
    {
        return Inertia::render('install/requirements', [
            'steps' => static::$steps,
            'currentStep' => 'requirements',
            'requirements' => $this->getRequirements(),
        ]);
    }

    public function env()
    {
        return Inertia::render('install/env', [
            'steps' => static::$steps,
            'currentStep' => 'env',
            'envExampleKeys' => $this->getEnvExampleKeys(),
            'envStatus' => $this->getEnvStatus(),
        ]);
    }

    public function database()
    {
        $envStatus = $this->getEnvStatus();
        if (! $envStatus['ready']) {
            return redirect()->route('install.env')->with('error', 'Please complete the Environment step first.');
        }

        return Inertia::render('install/database', [
            'steps' => static::$steps,
            'currentStep' => 'database',
            'success' => session('success'),
            'error' => session('error'),
            'output' => session('output'),
        ]);
    }

    public function runMigrations(Request $request)
    {
        $request->validate(['confirm' => 'required|in:yes']);

        try {
            Artisan::call('migrate', ['--force' => true]);
            $output = trim(Artisan::output());
            return back()->with('success', 'Migrations ran successfully.')->with('output', $output);
        } catch (\Throwable $e) {
            return back()->with('error', 'Migration failed: ' . $e->getMessage());
        }
    }

    public function complete()
    {
        $envStatus = $this->getEnvStatus();
        if (! $envStatus['ready']) {
            return redirect()->route('install.env');
        }

        try {
            // Ensure migrations have run (e.g. site_settings exists)
            Artisan::call('migrate', ['--force' => true]);
        } catch (\Throwable $e) {
            return redirect()->route('install.database')->with('error', 'Run migrations first: ' . $e->getMessage());
        }

        return Inertia::render('install/complete', [
            'steps' => static::$steps,
            'currentStep' => 'complete',
        ]);
    }

    public function finish(Request $request)
    {
        $request->validate(['confirm' => 'required|in:yes']);

        try {
            Artisan::call('migrate', ['--force' => true]);
        } catch (\Throwable $e) {
            return back()->with('error', 'Migration check failed: ' . $e->getMessage());
        }

        InstallChecker::markInstalled();

        return redirect()->to('/')->with('success', 'Installation complete. Welcome!');
    }
}
