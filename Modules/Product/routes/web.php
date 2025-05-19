<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


// Local Modular Dependencies
use Modules\Product\Http\Controllers\ProductController;


use App\Traits\LevelBasedAuthorization;
use App\Helpers\AccessLevel;


Route::middleware(['auth', 'verified'])->group(function () {



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

       

    });



});