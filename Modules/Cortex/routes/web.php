<?php

use Illuminate\Support\Facades\Route;
use Modules\Cortex\Http\Controllers\CortexController;
use Modules\Cortex\Http\Controllers\MirageController;
use Modules\Cortex\Http\Controllers\MirageSettingsController;
use Modules\Cortex\Http\Controllers\NexusPlannerController;
use Modules\Cortex\Http\Controllers\PulseController;
use Modules\Cortex\Http\Controllers\QuillController;
use Modules\Cortex\Http\Controllers\YoutubeDocController;
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
    Route::get('cortex/agents/pulse/digest/today', [PulseController::class, 'digestToday'])->name('cortex.agents.pulse.digest.today');
    Route::post('cortex/agents/pulse/digest/run', [PulseController::class, 'digestRun'])->name('cortex.agents.pulse.digest.run');
    Route::get('cortex/agents/pulse/feeds', [PulseController::class, 'feedsIndex'])->name('cortex.agents.pulse.feeds');
    Route::get('cortex/agents/pulse/settings', [PulseController::class, 'settingsIndex'])->name('cortex.agents.pulse.settings');
    Route::patch('cortex/agents/pulse/settings', [PulseController::class, 'settingsUpdate'])->name('cortex.agents.pulse.settings.update');
    Route::post('cortex/agents/pulse/chat', [PulseController::class, 'chat'])->name('cortex.agents.pulse.chat');
    Route::post('cortex/agents/pulse/feeds', [PulseController::class, 'storeFeed'])->name('cortex.agents.pulse.feeds.store');
    Route::get('cortex/agents/pulse/feeds/export', [PulseController::class, 'exportFeeds'])->name('cortex.agents.pulse.feeds.export');
    Route::post('cortex/agents/pulse/feeds/import', [PulseController::class, 'importFeeds'])->name('cortex.agents.pulse.feeds.import');
    Route::post('cortex/agents/pulse/feeds/refresh-all', [PulseController::class, 'refreshAllFeeds'])->name('cortex.agents.pulse.feeds.refresh_all');
    Route::patch('cortex/agents/pulse/feeds/{pulseFeed}', [PulseController::class, 'updateFeed'])->name('cortex.agents.pulse.feeds.update');
    Route::delete('cortex/agents/pulse/feeds/{pulseFeed}', [PulseController::class, 'destroyFeed'])->name('cortex.agents.pulse.feeds.destroy');
    Route::post('cortex/agents/pulse/feeds/{pulseFeed}/refresh', [PulseController::class, 'refreshFeed'])->name('cortex.agents.pulse.feeds.refresh');

    Route::get('cortex/agents/quill', [QuillController::class, 'index'])->name('cortex.agents.quill');
    Route::post('cortex/agents/quill/chat', [QuillController::class, 'chat'])->name('cortex.agents.quill.chat');

    Route::get('cortex/agents/mirage', [MirageController::class, 'index'])->name('cortex.agents.mirage');
    Route::get('cortex/agents/mirage/settings', [MirageSettingsController::class, 'index'])->name('cortex.agents.mirage.settings');
    Route::patch('cortex/agents/mirage/settings', [MirageSettingsController::class, 'update'])->name('cortex.agents.mirage.settings.update');
    Route::post('cortex/agents/mirage/chat', [MirageController::class, 'chat'])->name('cortex.agents.mirage.chat');
    Route::post('cortex/agents/mirage/ideas', [MirageController::class, 'ideas'])->name('cortex.agents.mirage.ideas');
    Route::post('cortex/agents/mirage/images', [MirageController::class, 'images'])->name('cortex.agents.mirage.images');

    Route::get('cortex/agents/youtube-doc', [YoutubeDocController::class, 'index'])->name('cortex.agents.youtube_doc');
    Route::get('cortex/agents/youtube-doc/connect', [YoutubeDocController::class, 'connect'])->name('cortex.agents.youtube_doc.connect');
    Route::get('cortex/agents/youtube-doc/channels', [YoutubeDocController::class, 'channels'])->name('cortex.agents.youtube_doc.channels');
    Route::post('cortex/agents/youtube-doc/channel', [YoutubeDocController::class, 'setChannel'])->name('cortex.agents.youtube_doc.channel');
    Route::post('cortex/agents/youtube-doc/chat', [YoutubeDocController::class, 'chat'])->name('cortex.agents.youtube_doc.chat');
});

// Fixed OAuth callback (not tenant-prefixed) — state maps back to a tenant.
Route::middleware(['auth', 'verified'])->get('cortex/agents/youtube-doc/oauth/callback', [
    YoutubeDocController::class,
    'oauthCallback',
])->name('cortex.agents.youtube_doc.oauth.callback');
