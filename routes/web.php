<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\TenantController;

Route::middleware('web')->group(function () {
    Route::middleware([
        'auth', 
        'verified',
    ])->group(function () {
        // ======================================================================
        // ========================== ADMIN ROUTES ==============================
        // ======================================================================
        // This section contains all routes related to administrative functions
        // including user management, role permissions, and system configuration.
        // These routes are protected by authentication and admin middleware.
        // ======================================================================


        // Admin routes group
        Route::prefix('admin')->middleware(['except.user'])->group(function () {


        });

        // Tenant Management Routes
        Route::get('/organizations', [TenantController::class, 'index'])->name('tenants.index');
        Route::get('/organizations/new', [TenantController::class, 'create'])->name('tenants.create');
        Route::post('/organization', [TenantController::class, 'store'])->name('tenants.store');
        Route::get('/organization/{tenant}/edit', [TenantController::class, 'edit'])->name('tenants.edit');
        Route::put('/organization/{tenant}', [TenantController::class, 'update'])->name('tenants.update');
        Route::delete('/organizations/{tenant}', [TenantController::class, 'destroy'])->name('tenants.destroy');
    });
});
