<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


// Local Modular Dependencies

use Modules\KYC\Http\Controllers\KYCController;


use App\Traits\LevelBasedAuthorization;
use App\Helpers\AccessLevel;


Route::middleware(['auth', 'verified'])->group(function () {


        // KYC routes
        Route::get('kyc', [KYCController::class, 'show'])->name('kyc.show');
        Route::get('kyc/submit', [KYCController::class, 'create'])->name('kyc.create');
        Route::post('kyc', [KYCController::class, 'store'])->name('kyc.store');

    
    // ======================================================================
    // ========================== ADMIN ROUTES ==============================
    // ======================================================================
    // This section contains all routes related to administrative functions
    // including user management, role permissions, and system configuration.
    // These routes are protected by authentication and admin middleware.
    // ======================================================================

    // Admin routes group
    Route::prefix('admin')->middleware(['except.user'])->group(function () {

        // KYC routes
        Route::get('kyc', [KYCController::class, 'index'])->name('kyc.index');
        Route::get('kyc/{kycVerification}/edit', [KYCController::class, 'edit'])->name('kyc.edit');
        Route::put('kyc/{kycVerification}', [KYCController::class, 'update'])->name('kyc.update');
        Route::get('kyc/{kycVerification}', [KYCController::class, 'show'])->name('admin.kyc.show');


    });



});