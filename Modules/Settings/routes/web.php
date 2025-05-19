<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


// Local Modular Dependencies
use Modules\Settings\Http\Controllers\SiteSettingsController; 
use Modules\Settings\Http\Controllers\ApiSettingsController;
use Modules\Settings\Http\Controllers\ProfileController;
use Modules\Settings\Http\Controllers\PasswordController;


use App\Traits\LevelBasedAuthorization;
use App\Helpers\AccessLevel;


Route::middleware(['auth', 'verified'])->group(function () {


    Route::redirect('settings', 'settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])->name('password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance');


    // ======================================================================
    // ========================== ADMIN ROUTES ==============================
    // ======================================================================
    // This section contains all routes related to administrative functions
    // including user management, role permissions, and system configuration.
    // These routes are protected by authentication and admin middleware.
    // ======================================================================

    // Admin routes group
    Route::prefix('admin')->middleware(['except.user'])->group(function () {

       
        // Site Settings routes
        Route::get('settings', [SiteSettingsController::class, 'index'])->name('admin.settings.system');
        Route::put('settings', [SiteSettingsController::class, 'update'])->name('admin.settings.update');


        // API Settings routes
        Route::get('/settings/api', [ApiSettingsController::class, 'index'])->name('admin.settings.api');
        Route::post('/settings/api', [ApiSettingsController::class, 'update'])->name('admin.settings.api.update');
        
        


    });



});