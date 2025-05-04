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
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('dashboard/admin', [DashboardController::class, 'adminDashboard'])->name('admin-dashboard');
    Route::get('dashboard/lender', [DashboardController::class, 'lenderDashboard'])->name('lender-dashboard');
    Route::get('dashboard/borrower', [DashboardController::class, 'borrowerDashboard'])->name('borrower-dashboard');

    // KYC routes
    Route::get('kyc', [KycVerificationController::class, 'show'])->name('kyc.show');
    Route::get('kyc/submit', [KycVerificationController::class, 'create'])->name('kyc.create');
    Route::post('kyc', [KycVerificationController::class, 'store'])->name('kyc.store');

    // Admin KYC routes
    // Route::middleware(['auth', 'admin'])->group(function () {
        Route::get('admin/kyc', [KycVerificationController::class, 'index'])->name('kyc.index');
        Route::get('admin/kyc/{kycVerification}/edit', [KycVerificationController::class, 'edit'])->name('kyc.edit');
        Route::put('admin/kyc/{kycVerification}', [KycVerificationController::class, 'update'])->name('kyc.update');
        Route::get('admin/kyc/{kycVerification}', [KycVerificationController::class, 'show'])->name('admin.kyc.show');
    // });

    // Products routes
    Route::resource('products', ProductController::class);
    Route::post('/products/all', [ProductController::class, 'getAllProducts'])->name('products.all');
    Route::post('/products/export', [ProductController::class, 'export'])->name('products.export');

    // Role and Permission Management
    Route::get('admin/roles', [RoleController::class, 'index'])->name('roles.index');
    Route::post('admin/roles', [RoleController::class, 'store'])->name('roles.store');
    Route::put('admin/roles/{role}', [RoleController::class, 'update'])->name('roles.update');
    Route::delete('admin/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');

    // User Management
    Route::get('admin/users', [UserController::class, 'index'])->name('admin.users.index');
    Route::get('admin/users/create', [UserController::class, 'create'])->name('admin.users.create');
    Route::post('admin/users', [UserController::class, 'store'])->name('admin.users.store');
    Route::get('admin/users/{user}', [UserController::class, 'show'])->name('admin.users.show');
    Route::get('admin/users/{user}/edit', [UserController::class, 'edit'])->name('admin.users.edit');
    Route::put('admin/users/{user}', [UserController::class, 'update'])->name('admin.users.update');
    Route::delete('admin/users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');
    Route::post('admin/users/export', [UserController::class, 'export'])->name('admin.users.export');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
