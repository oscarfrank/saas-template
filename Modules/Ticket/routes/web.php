<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Stancl\Tenancy\Middleware\InitializeTenancyByPath;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

// Local Modular Dependencies
use Modules\Ticket\Http\Controllers\TicketController;


use App\Traits\LevelBasedAuthorization;
use App\Helpers\AccessLevel;


// Tenant Routes - These should be tenant-aware
Route::middleware([
    'auth',
    'verified',
    InitializeTenancyByPath::class,
    'ensure.tenant.access',
    // PreventAccessFromCentralDomains::class,
])->prefix('{tenant}')->group(function () {

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

         // Ticket routes;
         Route::get('tickets', [TicketController::class, 'index'])->name('admin.tickets.index');
         Route::get('tickets/{ticket}', [TicketController::class, 'show'])->name('admin.tickets.show');
 

       

    });



});