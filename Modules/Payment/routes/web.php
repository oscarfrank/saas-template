<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


// Local Modular Dependencies
use Modules\Payment\Http\Controllers\PaymentController;
use Modules\Payment\Http\Controllers\CurrencyController;

use App\Traits\LevelBasedAuthorization;
use App\Helpers\AccessLevel;


Route::middleware(['auth', 'verified'])->group(function () {




    
    // ======================================================================
    // ========================== ADMIN ROUTES ==============================
    // ======================================================================
    // This section contains all routes related to administrative functions
    // including user management, role permissions, and system configuration.
    // These routes are protected by authentication and admin middleware.
    // ======================================================================

    // Admin routes group
    Route::prefix('admin')->middleware(['except.user'])->group(function () {


                // Currency Management
                Route::resource('currencies', CurrencyController::class);
                Route::post('/currencies/{currency}/set-default', [CurrencyController::class, 'setDefault'])->name('currencies.set-default');
                Route::post('/currencies/{currency}/toggle-active', [CurrencyController::class, 'toggleActive'])->name('currencies.toggle-active');
        

 

    });



});