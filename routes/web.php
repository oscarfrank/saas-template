<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\ProductController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\KycVerificationController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard routes
    Route::get('dashboard', function () {
        return Inertia::render('dashboard/dashboard');
    })->name('dashboard');

    Route::get('dashboard/lender', [DashboardController::class, 'lenderDashboard'])->name('lender-dashboard');
    Route::get('dashboard/borrower', [DashboardController::class, 'borrowerDashboard'])->name('borrower-dashboard');

    // KYC routes
    Route::get('kyc', [KycVerificationController::class, 'show'])->name('kyc.show');
    Route::get('kyc/submit', [KycVerificationController::class, 'create'])->name('kyc.create');
    Route::post('kyc', [KycVerificationController::class, 'store'])->name('kyc.store');

    // Products routes
    Route::resource('products', ProductController::class);
    Route::post('/products/all', [ProductController::class, 'getAllProducts'])->name('products.all');
    Route::post('/products/export', [ProductController::class, 'export'])->name('products.export');




    // ======================================================================
    // ========================== ADMIN ROUTES ==============================
    // ======================================================================
    // This section contains all routes related to administrative functions
    // including user management, role permissions, and system configuration.
    // These routes are protected by authentication and admin middleware.
    // ======================================================================

    // Admin routes group
    Route::prefix('admin')->middleware(['except.user'])->group(function () {

        Route::get('dashboard', [DashboardController::class, 'adminDashboard'])->name('admin-dashboard');

        // KYC routes
        Route::get('kyc', [KycVerificationController::class, 'index'])->name('kyc.index');
        Route::get('kyc/{kycVerification}/edit', [KycVerificationController::class, 'edit'])->name('kyc.edit');
        Route::put('kyc/{kycVerification}', [KycVerificationController::class, 'update'])->name('kyc.update');
        Route::get('kyc/{kycVerification}', [KycVerificationController::class, 'show'])->name('admin.kyc.show');

        // Role and Permission Management
        Route::get('roles', [RoleController::class, 'index'])->middleware(['role:super-admin'])->name('roles.index');
        Route::post('roles', [RoleController::class, 'store'])->middleware(['role:super-admin'])->name('roles.store');
        Route::put('roles/{role}', [RoleController::class, 'update'])->middleware(['role:super-admin'])->name('roles.update');
        Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware(['role:super-admin'])->name('roles.destroy');

        // User Management
        Route::get('users', [UserController::class, 'index'])->name('admin.users.index');
        Route::get('users/create', [UserController::class, 'create'])->name('admin.users.create');
        Route::post('users', [UserController::class, 'store'])->name('admin.users.store');
        Route::get('users/{user}', [UserController::class, 'show'])->name('admin.users.show');
        Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('admin.users.edit');
        Route::put('users/{user}', [UserController::class, 'update'])->name('admin.users.update');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');
        Route::post('users/export', [UserController::class, 'export'])->name('admin.users.export');

    });



});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
