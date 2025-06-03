<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByPath;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;
use App\Http\Controllers\TenantController;
use Inertia\Inertia;

// Local Modular Dependencies
use Modules\Loan\Http\Controllers\LoanController;
use Modules\Loan\Http\Controllers\LoanSettingsController;
use Modules\Loan\Http\Controllers\LoanPackageController;
use Modules\Loan\Http\Controllers\LoanDashboardController;
use Modules\Loan\Http\Controllers\LoanPaymentController;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| Here you can register the tenant routes for your application.
| These routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

// Tenant routes will be prefixed with the tenant slug
Route::middleware([
    'web',
    // 'track.last.visited',
    InitializeTenancyByPath::class,
    PreventAccessFromCentralDomains::class,
    'ensure.tenant.access',
])->prefix('{tenant}')->group(function () {
    Route::get('/', [TenantController::class, 'dashboard'])->name('tenant.dashboard');
    
    // Add more tenant-specific routes here
});

Route::middleware(['auth', 'verified'])->group(function () {
    // User Loans routes

});
