<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


// Local Modular Dependencies

use Modules\Activity\Http\Controllers\ActivityController;

use App\Traits\LevelBasedAuthorization;
use App\Helpers\AccessLevel;


Route::middleware(['auth', 'verified'])->group(function () {


    // Activity routes
    Route::get('/activity', [ActivityController::class, 'user'])->name('activity.user');
    Route::get('/activity/load-more', [ActivityController::class, 'getUserLoadMore'])->name('activity.user.get-load-more');
    Route::post('/activity/load-more', [ActivityController::class, 'userLoadMore'])->name('activity.user.load-more');
    

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