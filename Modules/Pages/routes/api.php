<?php

use Illuminate\Support\Facades\Route;
use Modules\Pages\Http\Controllers\PagesController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('pages', PagesController::class)->names('pages');
});
