<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Modules\OrgMcp\Http\Controllers\OrgMcpOrganizationSettingsController;
use Stancl\Tenancy\Middleware\InitializeTenancyByPath;

Route::middleware([
    'auth',
    'verified',
    'track.last.visited',
    InitializeTenancyByPath::class,
    'ensure.tenant.access',
])->prefix('{tenant}')->group(function (): void {
    Route::prefix('settings/organization/mcp')->group(function (): void {
        Route::get('/', [OrgMcpOrganizationSettingsController::class, 'index'])
            ->name('settings.organization.mcp');
        Route::post('/clients', [OrgMcpOrganizationSettingsController::class, 'storeClient'])
            ->name('settings.organization.mcp.clients.store');
        Route::patch('/clients/{client}', [OrgMcpOrganizationSettingsController::class, 'updateClient'])
            ->name('settings.organization.mcp.clients.update');
        Route::delete('/clients/{client}', [OrgMcpOrganizationSettingsController::class, 'destroyClient'])
            ->name('settings.organization.mcp.clients.destroy');
        Route::post('/integrations', [OrgMcpOrganizationSettingsController::class, 'storeIntegration'])
            ->name('settings.organization.mcp.integrations.store');
        Route::patch('/integrations/{integration}', [OrgMcpOrganizationSettingsController::class, 'updateIntegration'])
            ->name('settings.organization.mcp.integrations.update');
        Route::post('/integrations/{integration}/test', [OrgMcpOrganizationSettingsController::class, 'testIntegration'])
            ->name('settings.organization.mcp.integrations.test');
        Route::delete('/integrations/{integration}', [OrgMcpOrganizationSettingsController::class, 'destroyIntegration'])
            ->name('settings.organization.mcp.integrations.destroy');
    });
});
