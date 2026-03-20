<?php

use Illuminate\Support\Facades\Route;
use Modules\Activity\Http\Controllers\ActivityController;
use Stancl\Tenancy\Middleware\InitializeTenancyByPath;
// Local Modular Dependencies

use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

Route::middleware([
    'auth',
    'verified',
    InitializeTenancyByPath::class,
    'ensure.tenant.access',
    // PreventAccessFromCentralDomains::class,
])->prefix('{tenant}')->group(function () {

    // Activity routes
    Route::get('/activity', [ActivityController::class, 'user'])->name('activity.user');
    Route::get('/activity/load-more', [ActivityController::class, 'getUserLoadMore'])->name('activity.user.get-load-more');
    Route::post('/activity/load-more', [ActivityController::class, 'userLoadMore'])->name('activity.user.load-more');
    Route::post('/activity/notifications', [ActivityController::class, 'getNotifications'])->name('activity.user-notifications');
    Route::post('/activity/reset-counter', [ActivityController::class, 'resetCounter'])->name('activity.user.reset-counter');

    // ======================================================================
    // ========================== ADMIN ROUTES ==============================
    // ======================================================================
    // This section contains all routes related to administrative functions
    // including user management, role permissions, and system configuration.
    // These routes are protected by authentication and admin middleware.
    // ======================================================================

    // Admin routes group
    Route::prefix('admin')->middleware(['except.user'])->group(function () {

        // Activity routes
        Route::get('/activity', [ActivityController::class, 'index'])->name('admin.activities');
        Route::get('/activity/load-more', [ActivityController::class, 'getLoadMore'])->name('admin.activities.get-load-more');
        Route::post('/activity/load-more', [ActivityController::class, 'loadMore'])
            ->middleware(['web'])
            ->name('admin.activities.load-more');

    });

});

Route::middleware(['auth'])->group(function () {
    Route::post('/activity/user/notifications', [ActivityController::class, 'getNotifications'])->name('activity.user.notifications');
});
