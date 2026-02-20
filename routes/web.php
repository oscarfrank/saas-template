<?php

use App\Http\Controllers\EditorController;
use App\Http\Controllers\InstallController;
use App\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Install wizard (when app not installed, only these and /install are allowed)
Route::middleware('web')->group(function () {
    Route::get('/install', [InstallController::class, 'welcome'])->name('install.welcome');
    Route::get('/install/requirements', [InstallController::class, 'requirements'])->name('install.requirements');
    Route::get('/install/env', [InstallController::class, 'env'])->name('install.env');
    Route::get('/install/database', [InstallController::class, 'database'])->name('install.database');
    Route::post('/install/database', [InstallController::class, 'runMigrations'])->name('install.run-migrations');
    Route::get('/install/complete', [InstallController::class, 'complete'])->name('install.complete');
    Route::post('/install/complete', [InstallController::class, 'finish'])->name('install.finish');
});

Route::get('/taiwo', function () {
    return "This is the home page";
});

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

        // Editor Demo Route
        Route::get('/editor/demo', function () {
            return Inertia::render('editor/demo');
        })->name('editor.demo');
        Route::post('/editor/generate-title-ideas', [EditorController::class, 'generateTitleIdeas'])->name('editor.generate-title-ideas');
        Route::post('/editor/generate-description-assets', [EditorController::class, 'generateDescriptionAssets'])->name('editor.generate-description-assets');

        // Tenant Management Routes
        Route::get('/organizations', [TenantController::class, 'index'])->name('tenants.index');
        Route::get('/organizations/new', [TenantController::class, 'create'])->name('tenants.create');
        Route::get('/organizations/invites', [TenantController::class, 'invites'])->name('tenants.invites');
        Route::post('/organization', [TenantController::class, 'store'])->name('tenants.store');
        Route::get('/organization/{tenant}/edit', [TenantController::class, 'edit'])->name('tenants.edit');
        Route::put('/organization/{tenant}', [TenantController::class, 'update'])->name('tenants.update');
        Route::delete('/organizations/{tenant}', [TenantController::class, 'destroy'])->name('tenants.destroy');
        Route::post('/organization/invites/{invite}/accept', [TenantController::class, 'acceptInvite'])->name('tenants.invites.accept');
        Route::post('/organization/invites/{invite}/decline', [TenantController::class, 'declineInvite'])->name('tenants.invites.decline');
    });
});
