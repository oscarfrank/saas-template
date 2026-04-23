<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Modules\OrgMcp\Http\Controllers\OrgMcpSessionController;
use Modules\OrgMcp\Http\Controllers\OrgMcpToolController;

Route::prefix('v1/org-mcp')->group(function (): void {
    Route::post('/session', [OrgMcpSessionController::class, 'store'])
        ->middleware(['throttle:30,1'])
        ->name('org-mcp.session.store');

    Route::middleware(['org-mcp.session', 'throttle:120,1'])->group(function (): void {
        Route::get('/tools', [OrgMcpToolController::class, 'index'])
            ->name('org-mcp.tools.index');
        Route::post('/tools/invoke', [OrgMcpToolController::class, 'invoke'])
            ->name('org-mcp.tools.invoke');
    });
});
