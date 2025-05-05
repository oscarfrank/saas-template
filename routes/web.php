<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\ProductController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\KycVerificationController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\OuterPagesController;
use App\Http\Controllers\Admin\SiteSettingsController;

// Homepage
Route::get('/', [OuterPagesController::class, 'index'])->name('home');
Route::get('/faq', [OuterPagesController::class, 'faq'])->name('faq');
Route::get('/contact', [OuterPagesController::class, 'contact'])->name('contact');
Route::get('/calculator', [OuterPagesController::class, 'calculator'])->name('calculator');
Route::get('/privacy', [OuterPagesController::class, 'privacy'])->name('privacy');
Route::get('/about', [OuterPagesController::class, 'about'])->name('about');


Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard routes
    Route::get('dashboard', function () {
        return Inertia::render('dashboard/dashboard');
    })->name('dashboard');

    Route::get('dashboard/lender', [DashboardController::class, 'lenderDashboard'])->name('lender-dashboard');
    Route::get('dashboard/borrower', [DashboardController::class, 'borrowerDashboard'])->name('borrower-dashboard');
    Route::get('dashboard/youtuber', [DashboardController::class, 'youtuberDashboard'])->name('youtuber-dashboard');

    // KYC routes
    Route::get('kyc', [KycVerificationController::class, 'show'])->name('kyc.show');
    Route::get('kyc/submit', [KycVerificationController::class, 'create'])->name('kyc.create');
    Route::post('kyc', [KycVerificationController::class, 'store'])->name('kyc.store');

    // Products routes
    Route::resource('products', ProductController::class);
    Route::post('/products/all', [ProductController::class, 'getAllProducts'])->name('products.all');
    Route::post('/products/export', [ProductController::class, 'export'])->name('products.export');

    // Transaction routes
    Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions.index');
    Route::get('/transactions/create', [TransactionController::class, 'create'])->name('transactions.create');
    Route::post('/transactions', [TransactionController::class, 'store'])->name('transactions.store');
    Route::get('/transactions/{transaction}', [TransactionController::class, 'show'])->name('transactions.show');
    Route::get('/transactions/{transaction}/edit', [TransactionController::class, 'edit'])->name('transactions.edit');
    Route::put('/transactions/{transaction}', [TransactionController::class, 'update'])->name('transactions.update');
    Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy'])->name('transactions.destroy');
    Route::post('/transactions/bulk-delete', [TransactionController::class, 'bulkDelete'])->name('transactions.bulk-delete');
    Route::post('/transactions/bulk-archive', [TransactionController::class, 'bulkArchive'])->name('transactions.bulk-archive');
    Route::get('/transactions/export', [TransactionController::class, 'export'])->name('transactions.export');
    Route::get('/transactions/all', [TransactionController::class, 'getAllTransactions'])->name('transactions.all');

    // Ticket routes
    Route::get('/tickets', [TicketController::class, 'userTickets'])->name('tickets.user');
    Route::get('/tickets/create', [TicketController::class, 'create'])->name('tickets.create');
    Route::post('/tickets', [TicketController::class, 'store'])->name('tickets.store');
    Route::get('/tickets/{ticket}', [TicketController::class, 'userShow'])->name('tickets.user.show');
    Route::get('/tickets/{ticket}/edit', [TicketController::class, 'edit'])->name('tickets.edit');
    Route::put('/tickets/{ticket}', [TicketController::class, 'update'])->name('tickets.update');
    Route::delete('/tickets/{ticket}', [TicketController::class, 'destroy'])->name('tickets.destroy');
    Route::post('/tickets/{ticket}/reply', [TicketController::class, 'reply'])->name('tickets.reply');
    Route::post('/tickets/bulk-delete', [TicketController::class, 'bulkDelete'])->name('tickets.bulk-delete');
    Route::get('/tickets/export', [TicketController::class, 'export'])->name('tickets.export');

    // ======================================================================
    // ========================== ADMIN ROUTES ==============================
    // ======================================================================
    // This section contains all routes related to administrative functions
    // including user management, role permissions, and system configuration.
    // These routes are protected by authentication and admin middleware.
    // ======================================================================

    // Admin routes group
    Route::prefix('admin')->middleware(['except.user'])->group(function () {

        Route::get('dashboard', [DashboardController::class, 'adminDashboard'])->name('admin.dashboard');

        // Site Settings routes
        Route::get('settings', [SiteSettingsController::class, 'index'])->name('admin.settings.system');
        Route::put('settings', [SiteSettingsController::class, 'update'])->name('admin.settings.update');

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

        // Ticket routes;
        Route::get('tickets', [TicketController::class, 'index'])->name('admin.tickets.index');
        Route::get('tickets/{ticket}', [TicketController::class, 'show'])->name('admin.tickets.show');

    });



});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
