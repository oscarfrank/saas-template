<?php

namespace Modules\Dashboard\Http\Controllers;

use App\Attributes\RouteCatalogEntry;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Primary "dashboard" URL: always send users to the org's functional dashboard
     * (effective default landing path), not the hub picker.
     */
    public function index(Request $request)
    {
        $t = tenant();
        $path = $t->getEffectiveDefaultLandingPath();

        return redirect()->to('/'.$t->getAttribute('slug').'/'.$path);
    }

    /**
     * Optional hub where users pick Workspace / YouTuber / Borrower / Lender (not linked from sidebar).
     */
    #[RouteCatalogEntry(
        title: 'Dashboard hub',
        description: 'Chooser for workspace, YouTuber, borrower, and lender surfaces (direct URL only).'
    )]
    public function hub(Request $request)
    {
        return Inertia::render('dashboard/user/dashboard');
    }

    public function lenderDashboard(Request $request)
    {
        return Inertia::render('dashboard/user/lender-dashboard');
    }

    public function youtuberDashboard(Request $request)
    {
        return Inertia::render('dashboard/user/youtuber-dashboard');
    }

    /**
     * Notion-like workspace: upcoming events (scripts), tasks, and YouTube helpers.
     */
    #[RouteCatalogEntry(
        title: 'Workspace dashboard',
        description: 'Org workspace home: upcoming scripts, tasks, and quick links.'
    )]
    public function workspaceDashboard(Request $request)
    {
        $tenantId = tenant('id');
        $user = $request->user();

        $upcomingScripts = [];
        $upcomingTasks = [];

        if (class_exists(\Modules\Script\Models\Script::class)) {
            $upcomingScripts = \Modules\Script\Models\Script::query()
                ->where('tenant_id', $tenantId)
                ->whereNotNull('scheduled_at')
                ->where('scheduled_at', '>=', now())
                ->orderBy('scheduled_at')
                ->limit(10)
                ->with('scriptType:id,name,slug')
                ->get(['id', 'uuid', 'title', 'scheduled_at', 'status', 'production_status', 'script_type_id'])
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'uuid' => $s->uuid,
                    'title' => $s->title,
                    'scheduled_at' => $s->scheduled_at?->toIso8601String(),
                    'status' => $s->status,
                    'production_status' => $s->production_status,
                    'script_type_name' => $s->scriptType?->name,
                    'script_type_slug' => $s->scriptType?->slug,
                ])
                ->values()
                ->all();
        }

        // My tasks: tasks assigned to the current user (via HR Staff assignee), due now or in the future
        if (class_exists(\Modules\HR\Models\Task::class)) {
            $upcomingTasks = \Modules\HR\Models\Task::query()
                ->where('tenant_id', $tenantId)
                ->whereHas('assignee', fn ($q) => $q->where('user_id', $user->id))
                ->whereIn('status', ['todo', 'in_progress'])
                ->whereNotNull('due_at')
                ->where('due_at', '>=', now())
                ->orderBy('due_at')
                ->limit(10)
                ->get(['id', 'uuid', 'title', 'due_at', 'status'])
                ->map(fn ($t) => [
                    'id' => $t->id,
                    'uuid' => $t->uuid,
                    'title' => $t->title,
                    'due_at' => $t->due_at?->toIso8601String(),
                    'status' => $t->status,
                ])
                ->values()
                ->all();
        }

        return Inertia::render('dashboard/user/workspace-dashboard', [
            'upcomingScripts' => $upcomingScripts,
            'upcomingTasks' => $upcomingTasks,
        ]);
    }
}
