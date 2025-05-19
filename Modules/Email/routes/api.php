<?php

use Illuminate\Support\Facades\Route;
use Modules\Email\Http\Controllers\EmailController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('emails', EmailController::class)->names('email');
});
