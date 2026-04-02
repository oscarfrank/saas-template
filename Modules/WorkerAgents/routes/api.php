<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function (): void {
    // Tenant-scoped worker agent APIs can be added here; web UI uses routes/web.php.
});
