<?php

namespace Modules\HR\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Traits\LevelBasedAuthorization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\HR\Models\Task;
use Modules\HR\Models\Project;
use Modules\HR\Models\Staff;
use Modules\Script\Models\Script;

class TaskController extends Controller
{
    use LevelBasedAuthorization;

    /** Minimum role level to see all tasks (manager and above). View-all users cannot edit others' tasks. */
    private const VIEW_ALL_TASKS_LEVEL = 50;

    private function currentStaffId(): ?int
    {
        $staff = Staff::where('tenant_id', tenant('id'))
            ->where('user_id', auth()->id())
            ->first();
        return $staff?->id;
    }

    private function canViewAllTasks(): bool
    {
        return $this->hasLevel(self::VIEW_ALL_TASKS_LEVEL);
    }

    /** Admin (view-all) can edit/reschedule/delete any task. */
    private function canManageTask(Task $task): bool
    {
        return $this->canViewAllTasks();
    }

    /** True if current user is the task assignee. */
    private function isAssignee(Task $task): bool
    {
        $staffId = $this->currentStaffId();
        return $staffId !== null && (int) $task->assigned_to === (int) $staffId;
    }

    /** Admin can do anything; regular user can only change status/complete on their own tasks. */
    private function canUpdateStatus(Task $task): bool
    {
        return $this->canViewAllTasks() || $this->isAssignee($task);
    }

    public function index(Request $request): Response
    {
        $tenantId = tenant('id');
        $view = $request->input('view', 'table');
        $query = Task::query()
            ->with(['project:id,name', 'assignee.user:id,first_name,last_name,email', 'script:id,title,scheduled_at', 'blockedByTask:id,uuid,title,status'])
            ->where('tenant_id', $tenantId);

        $currentStaffId = $this->currentStaffId();
        $tasksViewAll = $this->canViewAllTasks();
        if (!$tasksViewAll) {
            if ($currentStaffId === null) {
                $query->whereRaw('1 = 0');
            } else {
                $query->where('assigned_to', $currentStaffId);
            }
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where('title', 'like', '%' . $search . '%');
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            // Table/board default: active tasks only. Calendar shows all (no filter).
            if ($view !== 'calendar') {
                $showCompleted = $request->input('show_completed', '');
                if ($showCompleted === 'all') {
                    // Include all statuses including old completed
                } elseif ($showCompleted === 'last_month') {
                    $query->where(function ($q) {
                        $q->whereIn('status', ['todo', 'in_progress', 'cancelled'])
                            ->orWhere('completed_at', '>=', now()->subMonth());
                    });
                } elseif ($showCompleted === 'last_3_months') {
                    $query->where(function ($q) {
                        $q->whereIn('status', ['todo', 'in_progress', 'cancelled'])
                            ->orWhere('completed_at', '>=', now()->subMonths(3));
                    });
                } else {
                    // Default: active only (exclude done)
                    $query->whereIn('status', ['todo', 'in_progress', 'cancelled']);
                }
            }
        }
        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }
        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        $query->orderBy('due_at')->orderBy('created_at', 'desc');

        $tasks = null;
        $allTasks = null;
        if ($view === 'table') {
            $tasks = $query->paginate(20)->withQueryString();
        } else {
            $allTasks = $query->limit(500)->get();
        }

        $staffOptions = Staff::where('tenant_id', $tenantId)->with('user:id,first_name,last_name')->orderBy('id')->get()
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->user ? trim($s->user->first_name . ' ' . $s->user->last_name) : 'Staff #' . $s->id]);
        $projectOptions = Project::where('tenant_id', $tenantId)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('hr/tasks/index', [
            'tasks' => $tasks,
            'allTasks' => $allTasks,
            'staffOptions' => $staffOptions,
            'projectOptions' => $projectOptions,
            'filters' => $request->only(['search', 'status', 'assigned_to', 'project_id', 'view', 'show_completed']),
            'tasksView' => $tasksViewAll ? 'all' : 'mine',
            'currentStaffId' => $currentStaffId,
            'canManageAnyTask' => $tasksViewAll,
        ]);
    }

    public function create(Request $request): Response
    {
        $tenantId = tenant('id');
        $staff = Staff::where('tenant_id', $tenantId)->with('user:id,first_name,last_name,email')->orderBy('id')->get()
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->user ? trim($s->user->first_name . ' ' . $s->user->last_name) : 'Staff #' . $s->id]);
        $projects = Project::where('tenant_id', $tenantId)->orderBy('name')->get(['id', 'name']);
        $scripts = Script::where('tenant_id', $tenantId)->orderBy('title')->get(['id', 'title', 'scheduled_at'])->map(fn ($s) => [
            'id' => $s->id, 'title' => $s->title, 'scheduled_at' => $s->scheduled_at?->toIso8601String(),
        ]);
        $taskOptions = Task::where('tenant_id', $tenantId)->orderBy('title')->get(['id', 'uuid', 'title'])
            ->map(fn ($t) => ['id' => $t->id, 'uuid' => $t->uuid, 'title' => $t->title]);
        return Inertia::render('hr/tasks/create', [
            'staff' => $staff,
            'projects' => $projects,
            'scripts' => $scripts,
            'taskOptions' => $taskOptions,
            'tasksView' => $this->canViewAllTasks() ? 'all' : 'mine',
            'currentStaffId' => $this->currentStaffId(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $tenantId = tenant('id');
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'project_id' => 'nullable|exists:hr_projects,id',
            'assigned_to' => 'nullable|exists:hr_staff,id',
            'script_id' => 'nullable|exists:scripts,id',
            'blocked_by_task_id' => 'nullable|exists:hr_tasks,id',
            'status' => 'nullable|string|in:todo,in_progress,done,cancelled',
            'priority' => 'nullable|string|in:low,medium,high',
            'due_at' => 'nullable|date',
        ]);
        $validated['tenant_id'] = $tenantId;
        $validated['status'] = $validated['status'] ?? 'todo';
        $validated['project_id'] = $request->filled('project_id') ? $request->input('project_id') : null;
        $validated['assigned_to'] = $request->filled('assigned_to') ? $request->input('assigned_to') : null;
        $validated['script_id'] = $request->filled('script_id') ? $request->input('script_id') : null;
        $validated['blocked_by_task_id'] = $request->filled('blocked_by_task_id') ? $request->input('blocked_by_task_id') : null;
        if (!$this->canViewAllTasks()) {
            $staffId = $this->currentStaffId();
            if ($staffId === null) {
                abort(403, 'You must be a staff member to create tasks.');
            }
            $validated['assigned_to'] = $staffId;
        }
        $task = Task::create($validated);
        return redirect()->route('hr.tasks.show', ['tenant' => tenant('slug'), 'task' => $task->uuid])
            ->with('success', 'Task created.');
    }

    public function show(Request $request, Task $task): Response|RedirectResponse
    {
        if ($task->tenant_id !== tenant('id')) {
            abort(404);
        }
        if (!$this->canViewAllTasks() && !$this->isAssignee($task)) {
            abort(403, 'You can only view tasks assigned to you.');
        }
        $task->load([
            'project',
            'assignee.user:id,first_name,last_name,email',
            'script:id,uuid,title,scheduled_at',
            'blockedByTask:id,uuid,title,status,assigned_to',
            'blockedByTask.assignee.user:id,first_name,last_name',
            'blockingTasks:id,uuid,title,status',
        ]);
        return Inertia::render('hr/tasks/show', [
            'task' => $task,
            'canManageTask' => $this->canManageTask($task),
            'canUpdateStatusOnly' => !$this->canViewAllTasks() && $this->isAssignee($task),
        ]);
    }

    public function edit(Request $request, Task $task): Response|RedirectResponse
    {
        if ($task->tenant_id !== tenant('id')) {
            abort(404);
        }
        if (!$this->canManageTask($task)) {
            abort(403, 'Only admins can edit and reschedule tasks.');
        }
        $tenantId = tenant('id');
        $staff = Staff::where('tenant_id', $tenantId)->with('user:id,first_name,last_name')->orderBy('id')->get()
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->user ? trim($s->user->first_name . ' ' . $s->user->last_name) : 'Staff #' . $s->id]);
        $projects = Project::where('tenant_id', $tenantId)->orderBy('name')->get(['id', 'name']);
        $scripts = Script::where('tenant_id', $tenantId)->orderBy('title')->get(['id', 'title', 'scheduled_at'])->map(fn ($s) => [
            'id' => $s->id, 'title' => $s->title, 'scheduled_at' => $s->scheduled_at?->toIso8601String(),
        ]);
        $taskOptions = Task::where('tenant_id', $tenantId)->where('id', '!=', $task->id)->orderBy('title')->get(['id', 'uuid', 'title'])
            ->map(fn ($t) => ['id' => $t->id, 'uuid' => $t->uuid, 'title' => $t->title]);
        return Inertia::render('hr/tasks/edit', [
            'task' => $task,
            'staff' => $staff,
            'projects' => $projects,
            'scripts' => $scripts,
            'taskOptions' => $taskOptions,
        ]);
    }

    public function update(Request $request, Task $task): RedirectResponse
    {
        if ($task->tenant_id !== tenant('id')) {
            abort(404);
        }
        if (!$this->canManageTask($task)) {
            abort(403, 'Only admins can edit tasks.');
        }
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'project_id' => 'nullable|exists:hr_projects,id',
            'assigned_to' => 'nullable|exists:hr_staff,id',
            'script_id' => 'nullable|exists:scripts,id',
            'blocked_by_task_id' => 'nullable|exists:hr_tasks,id',
            'status' => 'nullable|string|in:todo,in_progress,done,cancelled',
            'priority' => 'nullable|string|in:low,medium,high',
            'due_at' => 'nullable|date',
            'completed_at' => 'nullable|date',
        ]);
        $blockedBy = $request->filled('blocked_by_task_id') ? (int) $request->input('blocked_by_task_id') : null;
        if ($blockedBy === (int) $task->id) {
            return back()->withErrors(['blocked_by_task_id' => 'A task cannot block itself.']);
        }
        if ($blockedBy !== null && Task::wouldCreateCycle((int) $task->id, $blockedBy)) {
            return back()->withErrors(['blocked_by_task_id' => 'This would create a circular dependency between tasks.']);
        }
        if (isset($validated['completed_at']) && $task->script_id) {
            $script = Script::find($task->script_id);
            if ($script && $script->scheduled_at && $validated['completed_at'] > $script->scheduled_at->format('Y-m-d H:i:s')) {
                return back()->withErrors(['completed_at' => 'Task completion time cannot be after the script schedule time.']);
            }
        }
        $validated['project_id'] = $request->filled('project_id') ? $request->input('project_id') : null;
        $validated['assigned_to'] = $request->filled('assigned_to') ? $request->input('assigned_to') : null;
        $validated['script_id'] = $request->filled('script_id') ? $request->input('script_id') : null;
        $validated['blocked_by_task_id'] = $blockedBy;
        $task->update($validated);
        return redirect()->route('hr.tasks.show', ['tenant' => tenant('slug'), 'task' => $task->uuid])
            ->with('success', 'Task updated.');
    }

    public function destroy(Request $request, Task $task): RedirectResponse
    {
        if ($task->tenant_id !== tenant('id')) {
            abort(404);
        }
        if (!$this->canManageTask($task)) {
            abort(403, 'Only admins can delete tasks.');
        }
        $task->delete();
        return redirect()->route('hr.tasks.index', ['tenant' => tenant('slug')])
            ->with('success', 'Task deleted.');
    }

    public function updateDue(Request $request, Task $task): JsonResponse
    {
        if ($task->tenant_id !== tenant('id')) {
            abort(404);
        }
        if (!$this->canManageTask($task)) {
            return response()->json(['message' => 'Only admins can reschedule tasks.'], 403);
        }
        $validated = $request->validate(['due_at' => 'required|date']);
        $dueAt = \Carbon\Carbon::parse($validated['due_at']);
        if ($task->script_id) {
            $script = Script::find($task->script_id);
            if ($script && $script->scheduled_at && $dueAt->gt($script->scheduled_at)) {
                return response()->json(['message' => 'Task due date cannot be after the script schedule time.'], 422);
            }
        }
        $task->update(['due_at' => $dueAt]);
        return response()->json(['success' => true, 'task' => $task->fresh()]);
    }

    public function updateStatus(Request $request, Task $task): JsonResponse
    {
        if ($task->tenant_id !== tenant('id')) {
            abort(404);
        }
        if (!$this->canUpdateStatus($task)) {
            return response()->json(['message' => 'You can only update status for your own tasks.'], 403);
        }
        $validated = $request->validate(['status' => 'required|string|in:todo,in_progress,done,cancelled']);
        $update = ['status' => $validated['status']];
        if ($validated['status'] === 'done') {
            $update['completed_at'] = now();
        } elseif ($validated['status'] !== 'done') {
            $update['completed_at'] = null;
        }
        $task->update($update);
        return response()->json(['success' => true, 'task' => $task->fresh(['project:id,name', 'assignee.user:id,first_name,last_name,email'])]);
    }

    public function complete(Request $request, Task $task): RedirectResponse
    {
        if ($task->tenant_id !== tenant('id')) {
            abort(404);
        }
        if (!$this->canUpdateStatus($task)) {
            return back()->withErrors(['task' => 'You can only complete your own tasks.']);
        }
        $completedAt = now();
        if ($task->script_id) {
            $script = Script::find($task->script_id);
            if ($script && $script->scheduled_at && $completedAt->gt($script->scheduled_at)) {
                return back()->withErrors(['completed_at' => 'Task completion time cannot be after the script schedule time.']);
            }
        }
        $task->update(['status' => 'done', 'completed_at' => $completedAt]);
        return back()->with('success', 'Task marked complete.');
    }
}
