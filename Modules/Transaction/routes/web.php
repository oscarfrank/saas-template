<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use Stancl\Tenancy\Middleware\InitializeTenancyByPath;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;


// Local Modular Dependencies
use Modules\Transaction\Http\Controllers\TransactionController;



use App\Traits\LevelBasedAuthorization;
use App\Helpers\AccessLevel;


// Tenant Routes - These should be tenant-aware
Route::middleware([
    'auth',
    'verified',
    InitializeTenancyByPath::class,
    // PreventAccessFromCentralDomains::class,
])->prefix('{tenant}')->group(function () {

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



});