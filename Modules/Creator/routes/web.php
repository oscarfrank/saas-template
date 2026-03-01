<?php

use Illuminate\Support\Facades\Route;
use Modules\Creator\Http\Controllers\CreatorController;
use Stancl\Tenancy\Middleware\InitializeTenancyByPath;

Route::middleware([
    'auth',
    'verified',
    'track.last.visited',
    InitializeTenancyByPath::class,
    'ensure.tenant.access',
])->prefix('{tenant}')->group(function () {
    Route::get('creator', [CreatorController::class, 'index'])->name('creator.index');
    Route::get('creator/thumbnail-tester', [CreatorController::class, 'thumbnailTester'])->name('creator.thumbnail-tester');
});
