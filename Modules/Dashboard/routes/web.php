<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use Stancl\Tenancy\Middleware\InitializeTenancyByPath;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

// Local Modular Dependencies
use Modules\Dashboard\Http\Controllers\DashboardController;
use Modules\Loan\Http\Controllers\LoanDashboardController;
use App\Http\Controllers\Admin\ExportImportController;

use App\Traits\LevelBasedAuthorization;
use App\Helpers\AccessLevel;


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
        if (!$tenant) {
            $tenant = $user->tenants()->first();
        }
        if (!$tenant) {
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
        Route::get('export-import', [ExportImportController::class, 'index'])->name('admin.export-import');
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


            // Dashboard routes
            Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

            Route::get('dashboard/lender', [DashboardController::class, 'lenderDashboard'])->name('lender-dashboard');
            Route::get('dashboard/borrower', [LoanDashboardController::class, 'index'])->name('borrower-dashboard');
            Route::get('dashboard/youtuber', [DashboardController::class, 'youtuberDashboard'])->name('youtuber-dashboard');
            Route::get('dashboard/workspace', [DashboardController::class, 'workspaceDashboard'])->name('workspace-dashboard');
});