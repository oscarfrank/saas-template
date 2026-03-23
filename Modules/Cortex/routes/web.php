<?php

use Illuminate\Support\Facades\Route;
use Modules\Cortex\Http\Controllers\CortexController;
use Modules\Cortex\Http\Controllers\NexusPlannerController;
use Modules\Cortex\Http\Controllers\PulseController;
use Modules\Cortex\Http\Controllers\QuillController;
use Modules\Cortex\Http\Controllers\MirageController;
use Stancl\Tenancy\Middleware\InitializeTenancyByPath;

Route::middleware([
    'auth',
    'verified',
    'track.last.visited',
    InitializeTenancyByPath::class,
    'ensure.tenant.access',
])->prefix('{tenant}')->group(function () {
    Route::get('cortex', [CortexController::class, 'index'])->name('cortex.index');
    Route::get('cortex/agents/youtube', [CortexController::class, 'youtubeAgent'])->name('cortex.agents.youtube');
    Route::post('cortex/agents/youtube/run', [CortexController::class, 'youtubeAgentRun'])->name('cortex.agents.youtube.run');

    Route::get('cortex/agents/nexus', [NexusPlannerController::class, 'index'])->name('cortex.agents.nexus');
    Route::post('cortex/agents/nexus/chat', [NexusPlannerController::class, 'chat'])->name('cortex.agents.nexus.chat');
    Route::post('cortex/agents/nexus/apply', [NexusPlannerController::class, 'apply'])->name('cortex.agents.nexus.apply');

    Route::get('cortex/agents/pulse', [PulseController::class, 'index'])->name('cortex.agents.pulse');
    Route::post('cortex/agents/pulse/chat', [PulseController::class, 'chat'])->name('cortex.agents.pulse.chat');

    Route::get('cortex/agents/quill', [QuillController::class, 'index'])->name('cortex.agents.quill');
    Route::post('cortex/agents/quill/chat', [QuillController::class, 'chat'])->name('cortex.agents.quill.chat');

    Route::get('cortex/agents/mirage', [MirageController::class, 'index'])->name('cortex.agents.mirage');
    Route::post('cortex/agents/mirage/chat', [MirageController::class, 'chat'])->name('cortex.agents.mirage.chat');
});
