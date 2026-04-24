<?php

use Illuminate\Support\Facades\Route;
use Modules\Cortex\Http\Controllers\BaitController;
use Modules\Cortex\Http\Controllers\CortexAgentSettingsController;
use Modules\Cortex\Http\Controllers\CortexController;
use Modules\Cortex\Http\Controllers\CortexLlmSettingsController;
use Modules\Cortex\Http\Controllers\MirageController;
use Modules\Cortex\Http\Controllers\MirageReferenceAssetController;
use Modules\Cortex\Http\Controllers\MirageSessionController;
use Modules\Cortex\Http\Controllers\MirageSettingsController;
use Modules\Cortex\Http\Controllers\MirageUserPreferenceController;
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
    Route::patch('cortex/agents/llm-settings', [CortexLlmSettingsController::class, 'update'])->name('cortex.agents.llm_settings.update');
    Route::post('cortex/agents/llm-settings/bulk', [CortexLlmSettingsController::class, 'bulkReset'])->name('cortex.agents.llm_settings.bulk');
    Route::get('cortex/agents/{agent}/agent-settings', [CortexAgentSettingsController::class, 'show'])
        ->name('cortex.agents.agent_settings.show')
        ->where('agent', 'youtube-video|youtube-doc|nexus-planner|pulse|quill|bait|mirage');
    Route::get('cortex/agents/youtube', [CortexController::class, 'youtubeAgent'])->name('cortex.agents.youtube');
    Route::post('cortex/agents/youtube/run', [CortexController::class, 'youtubeAgentRun'])->name('cortex.agents.youtube.run');

    Route::get('cortex/agents/nexus', [NexusPlannerController::class, 'index'])->name('cortex.agents.nexus');
    Route::post('cortex/agents/nexus/chat', [NexusPlannerController::class, 'chat'])->name('cortex.agents.nexus.chat');
    Route::post('cortex/agents/nexus/apply', [NexusPlannerController::class, 'apply'])->name('cortex.agents.nexus.apply');

    Route::get('cortex/agents/pulse', [PulseController::class, 'index'])->name('cortex.agents.pulse');
    Route::get('cortex/agents/pulse/digest/today', [PulseController::class, 'digestToday'])->name('cortex.agents.pulse.digest.today');
    Route::post('cortex/agents/pulse/digest/run', [PulseController::class, 'digestRun'])->name('cortex.agents.pulse.digest.run');
    Route::post('cortex/agents/pulse/shorts/script', [PulseController::class, 'shortScript'])->name('cortex.agents.pulse.shorts.script');
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

    Route::get('cortex/agents/bait', [BaitController::class, 'index'])->name('cortex.agents.bait');
    Route::post('cortex/agents/bait/analyze', [BaitController::class, 'analyze'])->name('cortex.agents.bait.analyze');
    Route::post('cortex/agents/bait/generate', [BaitController::class, 'generate'])->name('cortex.agents.bait.generate');

    Route::get('cortex/agents/mirage', [MirageController::class, 'index'])->name('cortex.agents.mirage');
    Route::get('cortex/agents/mirage/history', [MirageSessionController::class, 'historyIndex'])->name('cortex.agents.mirage.history');
    Route::get('cortex/agents/mirage/sessions/{mirageSession}', [MirageSessionController::class, 'show'])->name('cortex.agents.mirage.sessions.show');
    Route::post('cortex/agents/mirage/sessions', [MirageSessionController::class, 'store'])->name('cortex.agents.mirage.sessions.store');
    Route::post('cortex/agents/mirage/sessions/{mirageSession}/turns', [MirageSessionController::class, 'storeTurn'])->name('cortex.agents.mirage.sessions.turns.store');
    Route::delete('cortex/agents/mirage/sessions/{mirageSession}', [MirageSessionController::class, 'destroySession'])->name('cortex.agents.mirage.sessions.destroy');
    Route::delete('cortex/agents/mirage/outputs/{mirageSessionOutput}', [MirageSessionController::class, 'destroyOutput'])->name('cortex.agents.mirage.outputs.destroy');
    Route::get('cortex/agents/mirage/outputs/{mirageSessionOutput}/file', [MirageSessionController::class, 'file'])->name('cortex.agents.mirage.outputs.file');
    Route::get('cortex/agents/mirage/settings', [MirageSettingsController::class, 'index'])->name('cortex.agents.mirage.settings');
    Route::patch('cortex/agents/mirage/settings', [MirageSettingsController::class, 'update'])->name('cortex.agents.mirage.settings.update');
    Route::post('cortex/agents/mirage/chat', [MirageController::class, 'chat'])->name('cortex.agents.mirage.chat');
    Route::post('cortex/agents/mirage/ideas', [MirageController::class, 'ideas'])->name('cortex.agents.mirage.ideas');
    Route::post('cortex/agents/mirage/images', [MirageController::class, 'images'])->name('cortex.agents.mirage.images');

    Route::get('cortex/agents/mirage/reference-assets', [MirageReferenceAssetController::class, 'index'])->name('cortex.agents.mirage.reference_assets.index');
    Route::post('cortex/agents/mirage/reference-assets', [MirageReferenceAssetController::class, 'store'])->name('cortex.agents.mirage.reference_assets.store');
    Route::get('cortex/agents/mirage/reference-assets/{mirageReferenceAsset}/file', [MirageReferenceAssetController::class, 'file'])->name('cortex.agents.mirage.reference_assets.file');
    Route::patch('cortex/agents/mirage/reference-assets/{mirageReferenceAsset}/default', [MirageReferenceAssetController::class, 'setDefault'])->name('cortex.agents.mirage.reference_assets.default');
    Route::delete('cortex/agents/mirage/reference-assets/{mirageReferenceAsset}', [MirageReferenceAssetController::class, 'destroy'])->name('cortex.agents.mirage.reference_assets.destroy');

    Route::patch('cortex/agents/mirage/reference-preferences', [MirageUserPreferenceController::class, 'update'])->name('cortex.agents.mirage.reference_preferences.update');

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
