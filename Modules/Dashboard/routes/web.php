<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use Stancl\Tenancy\Middleware\InitializeTenancyByPath;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

// Local Modular Dependencies
use Modules\Dashboard\Http\Controllers\DashboardController;
use Modules\Loan\Http\Controllers\LoanDashboardController;

use App\Traits\LevelBasedAuthorization;
use App\Helpers\AccessLevel;


Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/dashboard', function () {

        $user = auth()->user();

        $tenant = $user->preferences->preferences['last_tenant_id'] ?? 'home';

        return redirect()->route('dashboard', $tenant);

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
       

    });



});




// Tenant Routes - These should be tenant-aware
Route::middleware([
    'auth',
    'verified',
    // 'track.last.visited',
    // 'track.tenancy',
    InitializeTenancyByPath::class,
    'ensure.tenant.access',
    // PreventAccessFromCentralDomains::class,
])->prefix('{tenant}')->group(function () {


            // Dashboard routes
            Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

            Route::get('dashboard/lender', [DashboardController::class, 'lenderDashboard'])->name('lender-dashboard');
            Route::get('dashboard/borrower', [LoanDashboardController::class, 'index'])->name('borrower-dashboard');    


    
});