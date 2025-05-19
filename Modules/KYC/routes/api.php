<?php

use Illuminate\Support\Facades\Route;
use Modules\KYC\Http\Controllers\KYCController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('kycs', KYCController::class)->names('kyc');
});
