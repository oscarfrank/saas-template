<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


// Local Modular Dependencies
use Modules\Email\Http\Controllers\EmailTemplateController;


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

               // Email Templates routes
               Route::resource('email-templates', EmailTemplateController::class);
               Route::put('email-templates/{emailTemplate}/toggle-status', [EmailTemplateController::class, 'toggleStatus'])->name('email-templates.toggle-status');
       

    });



});