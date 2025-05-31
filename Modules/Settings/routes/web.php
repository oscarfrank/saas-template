<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


// Local Modular Dependencies
use Modules\Settings\Http\Controllers\SiteSettingsController; 
use Modules\Settings\Http\Controllers\ApiSettingsController;
use Modules\Settings\Http\Controllers\ProfileController;
use Modules\Settings\Http\Controllers\PasswordController;
use Modules\Settings\Http\Controllers\TwoFactorAuthController;


use App\Traits\LevelBasedAuthorization;
use App\Helpers\AccessLevel;


Route::middleware(['auth', 'verified'])->group(function () {


    Route::redirect('settings', 'settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])->name('password.update');

    Route::get('settings/two-factor-auth', [TwoFactorAuthController::class, 'edit'])->name('two-factor-auth.edit');
    Route::post('settings/two-factor-auth/enable', [TwoFactorAuthController::class, 'enable'])->name('two-factor-auth.enable');
    Route::post('settings/two-factor-auth/disable', [TwoFactorAuthController::class, 'disable'])->name('two-factor-auth.disable');
    Route::post('settings/two-factor-auth/confirm-disable', [TwoFactorAuthController::class, 'confirmDisable'])->name('two-factor-auth.confirm-disable');
    Route::post('settings/two-factor-auth/confirm', [TwoFactorAuthController::class, 'confirm'])->name('two-factor-auth.confirm');
    Route::post('settings/two-factor-auth/recovery-codes', [TwoFactorAuthController::class, 'generateRecoveryCodes'])->name('two-factor-auth.recovery-codes');
    Route::post('settings/two-factor-auth/send-code', [TwoFactorAuthController::class, 'sendCode'])->name('two-factor-auth.send-code');

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


// Two-factor authentication routes
Route::post('two-factor-challenge/send-code', [TwoFactorAuthController::class, 'sendChallengeCode'])
    ->name('two-factor-challenge.send-code');