<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Attributes\RouteCatalogEntry;
use App\Http\Controllers\Controller;
use App\Models\BackupSettings;
use App\Services\DatabaseBackupService;
use App\Services\GoogleDriveBackupService;
use App\Services\StorageBackupService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class BackupController extends Controller
{
    public function __construct(
        protected DatabaseBackupService $databaseBackup,
        protected StorageBackupService $storageBackup,
        protected GoogleDriveBackupService $googleDrive
    ) {}

    protected function ensureSuperAdmin(): void
    {
        $user = auth()->user();
        if (! $user || (! $user->hasRole('superadmin') && ! $user->hasRole('super-admin'))) {
            abort(403, 'Only super administrators can manage backups.');
        }
    }

    #[RouteCatalogEntry(
        title: 'Backups',
        description: 'Download database and storage archives; schedule uploads to Google Drive.'
    )]
    public function index(): Response
    {
        $this->ensureSuperAdmin();

        $settings = BackupSettings::instance();
        $connection = (string) config('database.default');
        $driver = (string) config("database.connections.{$connection}.driver");

        [$backupMethodLabel, $cliTool, $serverRequirement] = match ($driver) {
            'sqlite' => [
                'SQLite database file (online backup via sqlite3 or PHP)',
                'sqlite3',
                'Prefer the sqlite3 CLI on PATH; otherwise the PHP sqlite3 extension is used.',
            ],
            'mysql', 'mariadb' => [
                'Plain SQL text dump',
                'mysqldump',
                'MySQL client tools (mysqldump) must be on the server PATH.',
            ],
            'pgsql' => [
                'Plain SQL text dump',
                'pg_dump',
                'PostgreSQL client tools (pg_dump) must be on the server PATH (e.g. postgresql-client package).',
            ],
            default => [
                'Driver not supported for automated backup',
                '',
                'Set DB_CONNECTION to sqlite, mysql/mariadb, or pgsql.',
            ],
        };

        $scheduleTime = (string) $settings->schedule_time;
        if (preg_match('/^(\d{1,2}):(\d{2})$/', $scheduleTime, $m)) {
            $scheduleTime = sprintf('%02d:%02d', (int) $m[1], (int) $m[2]);
        }

        return Inertia::render('admin/backup', [
            'settings' => [
                'google_drive_connected' => $settings->isGoogleDriveConnected(),
                'google_drive_folder_id' => $settings->google_drive_folder_id,
                'schedule_enabled' => $settings->schedule_enabled,
                'schedule_frequency' => $settings->schedule_frequency,
                'schedule_time' => $scheduleTime,
                'schedule_weekday' => $settings->schedule_weekday,
                'schedule_include_storage' => $settings->schedule_include_storage,
                'last_scheduled_run_at' => $settings->last_scheduled_run_at?->toIso8601String(),
                'last_scheduled_error' => $settings->last_scheduled_error,
            ],
            'database' => [
                'connection' => $connection,
                'driver' => $driver,
                'backup_method_label' => $backupMethodLabel,
                'cli_tool' => $cliTool,
                'server_requirement' => $serverRequirement,
            ],
            'tenant_count' => \App\Models\Tenant::query()->count(),
            'backup_oauth_callback_url' => (string) config('services.google.backup_redirect'),
        ]);
    }

    public function downloadDatabase(Request $request): BinaryFileResponse|RedirectResponse|JsonResponse
    {
        $this->ensureSuperAdmin();

        set_time_limit(300);

        $scope = (string) $request->query('scope', 'central');
        $includeTenants = $scope === 'all';

        try {
            [$zipPath] = $this->databaseBackup->createDatabaseZip($includeTenants);
        } catch (Throwable $e) {
            return $this->failedBackupDownload($request, $e, 'Database backup download failed');
        }

        $name = 'laravel-databases-'.Carbon::now()->format('Y-m-d_His').'.zip';

        return response()->download($zipPath, $name)->deleteFileAfterSend(true);
    }

    public function downloadStorage(Request $request): BinaryFileResponse|RedirectResponse|JsonResponse
    {
        $this->ensureSuperAdmin();

        set_time_limit(300);

        try {
            [$zipPath] = $this->storageBackup->createStorageAppZip();
        } catch (Throwable $e) {
            return $this->failedBackupDownload($request, $e, 'Storage backup download failed');
        }

        $name = 'laravel-storage-app-'.Carbon::now()->format('Y-m-d_His').'.zip';

        return response()->download($zipPath, $name)->deleteFileAfterSend(true);
    }

    /**
     * JSON errors when the client sends X-Backup-Download (fetch from backup UI); redirect + flash otherwise.
     */
    private function failedBackupDownload(Request $request, Throwable $e, string $logContext): RedirectResponse|JsonResponse
    {
        Log::error($logContext, ['error' => $e->getMessage()]);

        $message = $e->getMessage();

        if ($request->header('X-Backup-Download') === '1') {
            return response()->json(['message' => $message], 422);
        }

        return redirect()->route('admin.backup')->with('error', $message);
    }

    public function updateSettings(Request $request): RedirectResponse
    {
        $this->ensureSuperAdmin();

        $data = $request->validate([
            'schedule_frequency' => 'required|in:daily,weekly',
            'schedule_time' => ['required', 'regex:/^\d{1,2}:\d{2}$/'],
            'schedule_weekday' => [
                Rule::requiredIf(fn () => $request->input('schedule_frequency') === 'weekly'),
                'nullable',
                'integer',
                'min:0',
                'max:6',
            ],
            'google_drive_folder_id' => 'nullable|string|max:255',
        ]);

        $frequency = (string) $data['schedule_frequency'];
        $weekday = $frequency === 'weekly' ? (int) ($data['schedule_weekday'] ?? 0) : null;

        $settings = BackupSettings::instance();
        $scheduleTime = (string) $data['schedule_time'];
        if (preg_match('/^(\d{1,2}):(\d{2})$/', $scheduleTime, $tm)) {
            $scheduleTime = sprintf('%02d:%02d', (int) $tm[1], (int) $tm[2]);
        }

        $settings->fill([
            'schedule_enabled' => $request->boolean('schedule_enabled'),
            'schedule_frequency' => $frequency,
            'schedule_time' => $scheduleTime,
            'schedule_weekday' => $weekday,
            'schedule_include_storage' => $request->boolean('schedule_include_storage'),
            'google_drive_folder_id' => $data['google_drive_folder_id'] ?? null,
        ]);
        $settings->save();

        return redirect()->route('admin.backup')->with('success', 'Backup settings saved.');
    }

    public function googleDriveConnect(Request $request): RedirectResponse
    {
        $this->ensureSuperAdmin();

        $nonce = Str::random(40);
        session()->put('backup_google_oauth_nonce', $nonce);

        $statePayload = [
            'user_id' => (string) auth()->id(),
            'nonce' => $nonce,
        ];
        $state = Crypt::encryptString(json_encode($statePayload, JSON_THROW_ON_ERROR));

        $clientId = (string) config('services.google.client_id', '');
        if ($clientId === '') {
            abort(503, 'Google OAuth client_id is not configured.');
        }

        $redirectUri = (string) config('services.google.backup_redirect');

        $scopes = [
            'https://www.googleapis.com/auth/drive.file',
        ];

        $authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => implode(' ', $scopes),
            'access_type' => 'offline',
            'prompt' => 'consent',
            'include_granted_scopes' => 'true',
            'state' => $state,
        ]);

        return redirect()->away($authUrl);
    }

    public function googleDriveCallback(Request $request): RedirectResponse
    {
        $this->ensureSuperAdmin();

        $stateParam = (string) ($request->query('state') ?? '');
        $code = (string) ($request->query('code') ?? '');

        if ($stateParam === '' || $code === '') {
            abort(400, 'Missing OAuth state or code.');
        }

        $sessionNonce = (string) (session()->get('backup_google_oauth_nonce') ?? '');
        session()->forget('backup_google_oauth_nonce');

        try {
            $payload = json_decode(Crypt::decryptString($stateParam), true, flags: JSON_THROW_ON_ERROR);
        } catch (\Throwable $e) {
            abort(400, 'Invalid OAuth state.');
        }

        if (! is_array($payload)) {
            abort(400, 'Invalid OAuth state payload.');
        }

        $nonce = (string) ($payload['nonce'] ?? '');
        $stateUserId = (string) ($payload['user_id'] ?? '');

        if ($nonce === '' || $stateUserId === '') {
            abort(400, 'Incomplete OAuth state payload.');
        }
        if ($sessionNonce === '' || ! hash_equals($sessionNonce, $nonce)) {
            abort(400, 'OAuth state verification failed.');
        }
        if (! hash_equals((string) auth()->id(), $stateUserId)) {
            abort(403, 'OAuth state user mismatch.');
        }

        $redirectUri = (string) config('services.google.backup_redirect');

        try {
            $googleToken = Http::asForm()->timeout(30)->post('https://oauth2.googleapis.com/token', [
                'code' => $code,
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'redirect_uri' => $redirectUri,
                'grant_type' => 'authorization_code',
            ])->throw()->json();

            $refreshToken = $googleToken['refresh_token'] ?? null;
            if (! is_string($refreshToken) || $refreshToken === '') {
                return redirect()->route('admin.backup')->with(
                    'error',
                    'Google did not return a refresh token. Try again and ensure you grant access when prompted.'
                );
            }

            $settings = BackupSettings::instance();
            $settings->google_drive_refresh_token_encrypted = Crypt::encryptString($refreshToken);
            $settings->save();
        } catch (\Throwable $e) {
            Log::error('Backup Google OAuth callback failed', ['error' => $e->getMessage()]);

            return redirect()->route('admin.backup')->with('error', 'Google Drive connection failed: '.$e->getMessage());
        }

        return redirect()->route('admin.backup')->with('success', 'Google Drive connected for backups.');
    }

    public function googleDriveDisconnect(): RedirectResponse
    {
        $this->ensureSuperAdmin();

        $settings = BackupSettings::instance();
        $settings->google_drive_refresh_token_encrypted = null;
        $settings->schedule_enabled = false;
        $settings->save();

        return redirect()->route('admin.backup')->with('success', 'Google Drive disconnected.');
    }
}
