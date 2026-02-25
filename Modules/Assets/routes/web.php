<?php

use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByPath;
use Modules\Assets\Http\Controllers\AssetController;
use Modules\Assets\Http\Controllers\AssetCategoryController;
use Modules\Assets\Http\Controllers\AssetSettingsController;

Route::middleware([
    'auth',
    'verified',
    InitializeTenancyByPath::class,
    'ensure.tenant.access',
])->prefix('{tenant}')->group(function () {
    // Assets
    Route::get('assets', [AssetController::class, 'index'])->name('assets.index');
    Route::get('assets/export', [AssetController::class, 'export'])->name('assets.export');
    Route::get('assets/accountant', [AssetController::class, 'accountant'])->name('assets.accountant');
    Route::get('assets/accountant/export', [AssetController::class, 'accountantExport'])->name('assets.accountant.export');
    Route::post('assets/bulk-destroy', [AssetController::class, 'bulkDestroy'])->name('assets.bulk-destroy');
    Route::post('assets/bulk-update-category', [AssetController::class, 'bulkUpdateCategory'])->name('assets.bulk-update-category');
    Route::post('assets/bulk-update-status', [AssetController::class, 'bulkUpdateStatus'])->name('assets.bulk-update-status');
    Route::post('assets/bulk-update-assigned-to', [AssetController::class, 'bulkUpdateAssignedTo'])->name('assets.bulk-update-assigned-to');
    Route::post('assets/clear-all', [AssetController::class, 'clearAll'])->name('assets.clear-all');
    Route::get('assets/import', [AssetController::class, 'import'])->name('assets.import');
    Route::get('assets/import/template', [AssetController::class, 'importTemplate'])->name('assets.import.template');
    Route::post('assets/import', [AssetController::class, 'importProcess'])->name('assets.import.process');
    Route::get('assets/settings', [AssetSettingsController::class, 'index'])->name('assets.settings.index');
    Route::put('assets/settings', [AssetSettingsController::class, 'update'])->name('assets.settings.update');
    Route::get('assets/create', [AssetController::class, 'create'])->name('assets.create');
    Route::post('assets', [AssetController::class, 'store'])->name('assets.store');
    Route::get('assets/categories', [AssetCategoryController::class, 'index'])->name('assets.categories.index');
    Route::get('assets/categories/create', [AssetCategoryController::class, 'create'])->name('assets.categories.create');
    Route::post('assets/categories', [AssetCategoryController::class, 'store'])->name('assets.categories.store');
    Route::get('assets/categories/{category}', [AssetCategoryController::class, 'show'])->name('assets.categories.show');
    Route::get('assets/categories/{category}/edit', [AssetCategoryController::class, 'edit'])->name('assets.categories.edit');
    Route::put('assets/categories/{category}', [AssetCategoryController::class, 'update'])->name('assets.categories.update');
    Route::delete('assets/categories/{category}', [AssetCategoryController::class, 'destroy'])->name('assets.categories.destroy');
    Route::get('assets/{asset}/receipt', [AssetController::class, 'receipt'])->name('assets.receipt');
    Route::get('assets/{asset}/photo', [AssetController::class, 'photo'])->name('assets.photo');
    Route::get('assets/{asset}', [AssetController::class, 'show'])->name('assets.show');
    Route::get('assets/{asset}/edit', [AssetController::class, 'edit'])->name('assets.edit');
    Route::match(['put', 'post'], 'assets/{asset}', [AssetController::class, 'update'])->name('assets.update');
    Route::delete('assets/{asset}', [AssetController::class, 'destroy'])->name('assets.destroy');
});
