<?php

namespace Modules\Creator\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Cortex\Services\YoutubeDocAnalyticsSnapshotService;

class CreatorController extends Controller
{
    /**
     * Creator module index (dashboard). Entry point for the Creator module UI.
     */
    public function index(Request $request, YoutubeDocAnalyticsSnapshotService $youtubeAnalytics)
    {
        return Inertia::render('creator/index', [
            'youtubeCreator' => $youtubeAnalytics->creatorDashboardSummary(),
        ]);
    }

    /**
     * Thumbnail Tester: enter title, channel, select image; preview among mock thumbnails (client-side only, no upload).
     */
    public function thumbnailTester(Request $request)
    {
        return Inertia::render('creator/thumbnail-tester');
    }
}
