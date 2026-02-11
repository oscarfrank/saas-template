<?php

use Illuminate\Support\Facades\Route;
use Modules\Script\Http\Controllers\ScriptController;
use Stancl\Tenancy\Middleware\InitializeTenancyByPath;

// Public published script view: no auth, no tenant in URL. Anyone with the link can view.
Route::get('script/shared/{token}', [ScriptController::class, 'sharedShow'])->name('script.shared');
// Public read-only production calendar: no auth, no tenant in URL.
Route::get('production-calendar', [ScriptController::class, 'publicCalendar'])->name('script.public-calendar');

Route::middleware([
    'auth',
    'verified',
    InitializeTenancyByPath::class,
    'ensure.tenant.access',
])->prefix('{tenant}')->group(function () {
    Route::get('script', [ScriptController::class, 'index'])->name('script.index');
    Route::get('script/export-all', [ScriptController::class, 'exportAll'])->name('script.export-all');
    Route::get('script/calendar', [ScriptController::class, 'calendar'])->name('script.calendar');
    Route::get('script/create', [ScriptController::class, 'create'])->name('script.create');
    Route::post('script', [ScriptController::class, 'store'])->name('script.store');
    Route::post('script/import-csv', [ScriptController::class, 'importCsv'])->name('script.import-csv');
    Route::get('script/{script}', [ScriptController::class, 'edit'])->name('script.edit');
    Route::match(['GET', 'POST'], 'script/{script}/export', [ScriptController::class, 'export'])->name('script.export');
    Route::put('script/{script}', [ScriptController::class, 'update'])->name('script.update');
    Route::delete('script/{script}', [ScriptController::class, 'destroy'])->name('script.destroy');
    Route::post('script/delete-all', [ScriptController::class, 'deleteAll'])->name('script.delete-all');
    Route::post('script/empty-trash', [ScriptController::class, 'emptyTrash'])->name('script.empty-trash');
    Route::post('script/{script}/restore', [ScriptController::class, 'restore'])->name('script.restore')->where('script', '[0-9a-fA-F-]{36}');
    Route::delete('script/{script}/permanent', [ScriptController::class, 'forceDestroy'])->name('script.force-destroy')->where('script', '[0-9a-fA-F-]{36}');
    Route::get('script/{script}/share', [ScriptController::class, 'shareData'])->name('script.share');
    Route::post('script/{script}/publish', [ScriptController::class, 'publish'])->name('script.publish');
    Route::post('script/{script}/unpublish', [ScriptController::class, 'unpublish'])->name('script.unpublish');
    Route::post('script/{script}/collaborators', [ScriptController::class, 'addCollaborator'])->name('script.collaborators.store');
    Route::delete('script/{script}/collaborators/{user}', [ScriptController::class, 'removeCollaborator'])->name('script.collaborators.destroy');
    Route::put('script/{script}/collaborators/{user}', [ScriptController::class, 'updateCollaboratorRole'])->name('script.collaborators.update');
    Route::post('script/generate-title-ideas', [ScriptController::class, 'generateTitleIdeas'])->name('script.generate-title-ideas');
    Route::post('script/generate-description-assets', [ScriptController::class, 'generateDescriptionAssets'])->name('script.generate-description-assets');
    Route::post('script/ai-edit-selection', [ScriptController::class, 'aiEditSelection'])->name('script.ai-edit-selection');
    Route::patch('script/{script}/reschedule', [ScriptController::class, 'reschedule'])->name('script.reschedule');
    Route::post('script/{script}/thumbnails', [ScriptController::class, 'storeThumbnail'])->name('script.thumbnails.store');
    Route::delete('script/{script}/thumbnails/{thumbnail}', [ScriptController::class, 'destroyThumbnail'])->name('script.thumbnails.destroy');
});
