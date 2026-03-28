<?php

use App\Http\Controllers\Admin\AiUsageAdminController;
use App\Http\Controllers\Admin\BackupController;
use App\Http\Controllers\Admin\ExportImportController;
use App\Http\Controllers\Admin\RouteCatalogController;
// Local Modular Dependencies
use Illuminate\Support\Facades\Route;
use Modules\Dashboard\Http\Controllers\DashboardController;
use Modules\Loan\Http\Controllers\LoanDashboardController;
use Stancl\Tenancy\Middleware\InitializeTenancyByPath;

Route::middleware(['auth', 'verified'])->group(function () {

    // When user hits /dashboard (no tenant in path), send to correct landing (org default or last visited)
    Route::get('/dashboard', function () {
        $user = auth()->user();
        $preferences = $user->getPreferences();
        $lastTenantId = $preferences->getLastTenantId();

        $tenant = null;
        if ($lastTenantId) {
            $tenant = \App\Models\Tenant::where('id', $lastTenantId)->first();
        }
        if (! $tenant) {
            $tenant = $user->tenants()->first();
        }
        if (! $tenant) {
            return redirect()->route('tenants.create');
        }

        $url = \App\Services\LandingUrlService::forUser($user, $tenant);

        return redirect()->to($url);
    });

    // ======================================================================
    // ========================== ADMIN ROUTES ==============================
    // ======================================================================
    // This section contains all routes related to administrative functions
    // including user management, role permissions, and system configuration.
    // These routes are protected by authentication and admin middleware.
    // ======================================================================

    // Admin routes group
    Route::prefix('admin')->middleware(['except.user'])->group(function () {

        Route::get('dashboard', [LoanDashboardController::class, 'adminDashboard'])->name('admin.dashboard');
        Route::get('ai-usage', [AiUsageAdminController::class, 'index'])->name('admin.ai-usage');
        Route::get('export-import', [ExportImportController::class, 'index'])->name('admin.export-import');
        Route::get('route-catalog', [RouteCatalogController::class, 'index'])->name('admin.route-catalog');
        Route::get('backup', [BackupController::class, 'index'])->name('admin.backup');
        Route::get('backup/database', [BackupController::class, 'downloadDatabase'])->name('admin.backup.database');
        Route::get('backup/storage', [BackupController::class, 'downloadStorage'])->name('admin.backup.storage');
        Route::post('backup/settings', [BackupController::class, 'updateSettings'])->name('admin.backup.settings');
        Route::get('backup/google-drive/connect', [BackupController::class, 'googleDriveConnect'])->name('admin.backup.google-drive.connect');
        Route::get('backup/google-drive/callback', [BackupController::class, 'googleDriveCallback'])->name('admin.backup.google-drive.callback');
        Route::post('backup/google-drive/disconnect', [BackupController::class, 'googleDriveDisconnect'])->name('admin.backup.google-drive.disconnect');
        Route::match(['get', 'post'], 'export', [ExportImportController::class, 'export'])->name('admin.export');
        Route::post('import', [ExportImportController::class, 'import'])->name('admin.import');
    });

});

// Tenant Routes - These should be tenant-aware
Route::middleware([
    'auth',
    'verified',
    'track.last.visited',
    InitializeTenancyByPath::class,
    'ensure.tenant.access',
])->prefix('{tenant}')->group(function () {

    // Dashboard routes (hub must be registered before single-segment `dashboard` is not an issue; explicit paths first)
    Route::get('dashboard/hub', [DashboardController::class, 'hub'])->name('dashboard-hub');
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('dashboard/lender', [DashboardController::class, 'lenderDashboard'])->name('lender-dashboard');
    Route::get('dashboard/borrower', [LoanDashboardController::class, 'index'])->name('borrower-dashboard');
    Route::get('dashboard/youtuber', [DashboardController::class, 'youtuberDashboard'])->name('youtuber-dashboard');
    Route::get('dashboard/workspace', [DashboardController::class, 'workspaceDashboard'])->name('workspace-dashboard');
});
