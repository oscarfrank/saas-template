<?php

namespace Modules\Dashboard\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\Controller;

class DashboardController extends Controller
{
    /**
     * Display the dashboard hub (choice of Workspace, YouTuber, Borrower, Lender).
     * Do not redirect by role here so that org default and user "last visited" landing preferences are respected.
     */
    public function index(Request $request)
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
                ->get(['id', 'uuid', 'title', 'scheduled_at', 'status', 'production_status'])
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'uuid' => $s->uuid,
                    'title' => $s->title,
                    'scheduled_at' => $s->scheduled_at?->toIso8601String(),
                    'status' => $s->status,
                    'production_status' => $s->production_status,
                ])
                ->values()
                ->all();
        }

        if (class_exists(\Modules\HR\Models\Staff::class) && class_exists(\Modules\HR\Models\Task::class)) {
            $staff = \Modules\HR\Models\Staff::where('tenant_id', $tenantId)
                ->where('user_id', $user->id)
                ->first();
            if ($staff) {
                $upcomingTasks = \Modules\HR\Models\Task::query()
                    ->where('tenant_id', $tenantId)
                    ->where('assigned_to', $staff->id)
                    ->whereIn('status', ['todo', 'in_progress'])
                    ->whereNotNull('due_at')
                    ->where('due_at', '>=', now()->startOfDay())
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
        }

        return Inertia::render('dashboard/user/workspace-dashboard', [
            'upcomingScripts' => $upcomingScripts,
            'upcomingTasks' => $upcomingTasks,
        ]);
    }
}
