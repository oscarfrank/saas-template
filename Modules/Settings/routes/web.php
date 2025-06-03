<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Modules\Settings\Http\Controllers\SettingsController;
use Modules\Settings\Http\Controllers\ProfileController;
use Modules\Settings\Http\Controllers\PasswordController;
use Modules\Settings\Http\Controllers\TwoFactorAuthController;
use Stancl\Tenancy\Middleware\InitializeTenancyByPath;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;



// Local Modular Dependencies
use Modules\Settings\Http\Controllers\SiteSettingsController; 
use Modules\Settings\Http\Controllers\ApiSettingsController;


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

            // Organization Settings
            Route::prefix('settings/organization')->group(function () {
                Route::get('general', [SettingsController::class, 'organizationGeneral'])->name('settings.organization.general');
                Route::patch('general', [SettingsController::class, 'updateOrganization'])->name('settings.organization.update');
                Route::get('people', [SettingsController::class, 'organizationPeople'])->name('settings.organization.people');
                Route::post('invites', [SettingsController::class, 'sendInvite'])->name('settings.organization.invites.send');
                Route::post('invites/{invite}/cancel', [SettingsController::class, 'cancelInvite'])->name('settings.organization.invites.cancel');
                Route::post('invites/{invite}/resend', [SettingsController::class, 'resendInvite'])->name('settings.organization.invites.resend');
                Route::get('teamspaces', [SettingsController::class, 'organizationTeamspaces'])->name('settings.organization.teamspaces');
                Route::post('members/{member}/update-role', [SettingsController::class, 'updateMemberRole'])->name('settings.organization.members.update-role');
                Route::post('/members/{member}/remove', [SettingsController::class, 'removeMember'])->name('settings.organization.members.remove');
            });

});

Route::middleware(['auth', 'verified', 'track.last.visited'])->group(function () {
    // Redirect /settings to profile by default
    Route::redirect('settings', 'settings/profile');

    // User Settings
    Route::prefix('settings')->group(function () {
        // Profile
        Route::get('profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

        // Password
        Route::get('password', [PasswordController::class, 'edit'])->name('password.edit');
        Route::put('password', [PasswordController::class, 'update'])->name('password.update');

        // Two Factor Auth
        Route::get('two-factor-auth', [TwoFactorAuthController::class, 'edit'])->name('two-factor-auth.edit');
        Route::post('two-factor-auth/enable', [TwoFactorAuthController::class, 'enable'])->name('two-factor-auth.enable');
        Route::post('two-factor-auth/disable', [TwoFactorAuthController::class, 'disable'])->name('two-factor-auth.disable');
        Route::post('two-factor-auth/confirm-disable', [TwoFactorAuthController::class, 'confirmDisable'])->name('two-factor-auth.confirm-disable');
        Route::post('two-factor-auth/confirm', [TwoFactorAuthController::class, 'confirm'])->name('two-factor-auth.confirm');
        Route::post('two-factor-auth/recovery-codes', [TwoFactorAuthController::class, 'generateRecoveryCodes'])->name('two-factor-auth.recovery-codes');
        Route::post('two-factor-auth/send-code', [TwoFactorAuthController::class, 'sendCode'])->name('two-factor-auth.send-code');

        // User Settings
        Route::get('preferences', [SettingsController::class, 'preferences'])->name('settings.preferences');
        Route::patch('preferences', [SettingsController::class, 'updatePreferences'])->name('preferences.update');
        Route::get('connections', [SettingsController::class, 'connections'])->name('settings.connections');


        // Other Settings
        Route::get('api-keys', [SettingsController::class, 'apiKeys'])->name('settings.api-keys');
        Route::post('api-keys', [SettingsController::class, 'createApiKey'])->name('settings.api-keys.create');
        Route::get('webhooks', [SettingsController::class, 'webhooks'])->name('settings.webhooks');
        Route::post('webhooks', [SettingsController::class, 'createWebhook'])->name('settings.webhooks.create');
        Route::get('audit-logs', [SettingsController::class, 'auditLogs'])->name('settings.audit-logs');
    });

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

// Public invite acceptance route
Route::get('organization/invite/{token}', [SettingsController::class, 'acceptInvite'])
    ->name('organization.invite.accept')
    ->middleware(['web']);