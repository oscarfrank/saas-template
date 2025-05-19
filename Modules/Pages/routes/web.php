<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


// Local Modular Dependencies
use Modules\Pages\Http\Controllers\PagesController;


use App\Traits\LevelBasedAuthorization;
use App\Helpers\AccessLevel;


    // Homepage
    Route::get('/', [PagesController::class, 'index'])->name('home');
    Route::get('/faq', [PagesController::class, 'faq'])->name('faq');
    Route::get('/contact', [PagesController::class, 'contact'])->name('contact');
    Route::get('/calculator', [PagesController::class, 'calculator'])->name('calculator');
    Route::get('/privacy', [PagesController::class, 'privacy'])->name('privacy');
    Route::get('/about', [PagesController::class, 'about'])->name('about');


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

       

    });



});