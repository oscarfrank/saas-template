<?php

namespace Modules\HR\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\HR\Models\Project;
use Modules\HR\Models\Staff;

class ProjectController extends Controller
{
    public function index(Request $request): Response
    {
        $tenantId = tenant('id');
        $query = Project::query()
            ->with('owner.user:id,first_name,last_name,email')
            ->withCount('tasks')
            ->where('tenant_id', $tenantId);

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%');
            });
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $projects = $query->orderBy('updated_at', 'desc')->paginate(15)->withQueryString();

        return Inertia::render('hr/projects/index', [
            'projects' => $projects,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(Request $request): Response
    {
        $tenantId = tenant('id');
        $staff = Staff::where('tenant_id', $tenantId)->active()->with('user:id,first_name,last_name,email')->get()
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->user ? trim($s->user->first_name . ' ' . $s->user->last_name) : 'Staff #' . $s->id]);
        return Inertia::render('hr/projects/create', ['staff' => $staff]);
    }

    public function store(Request $request): RedirectResponse
    {
        $tenantId = tenant('id');
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'nullable|string|in:active,on_hold,completed,cancelled',
            'owner_id' => 'nullable|exists:hr_staff,id',
        ]);
        $validated['tenant_id'] = $tenantId;
        $validated['owner_id'] = $request->filled('owner_id') ? $request->input('owner_id') : null;
        $project = Project::create($validated);
        return redirect()->route('hr.projects.show', ['tenant' => tenant('slug'), 'project' => $project->id])
            ->with('success', 'Project created.');
    }

    public function show(Request $request, Project $project): Response|RedirectResponse
    {
        if ($project->tenant_id !== tenant('id')) {
            abort(404);
        }
        $project->load(['owner.user:id,first_name,last_name,email', 'tasks.assignee.user:id,first_name,last_name,email']);
        return Inertia::render('hr/projects/show', ['project' => $project]);
    }

    public function edit(Request $request, Project $project): Response|RedirectResponse
    {
        if ($project->tenant_id !== tenant('id')) {
            abort(404);
        }
        $tenantId = tenant('id');
        $staff = Staff::where('tenant_id', $tenantId)->active()->with('user:id,first_name,last_name,email')->get()
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->user ? trim($s->user->first_name . ' ' . $s->user->last_name) : 'Staff #' . $s->id]);
        return Inertia::render('hr/projects/edit', ['project' => $project, 'staff' => $staff]);
    }

    public function update(Request $request, Project $project): RedirectResponse
    {
        if ($project->tenant_id !== tenant('id')) {
            abort(404);
        }
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'nullable|string|in:active,on_hold,completed,cancelled',
            'owner_id' => 'nullable|exists:hr_staff,id',
        ]);
        $validated['owner_id'] = $request->filled('owner_id') ? $request->input('owner_id') : null;
        $project->update($validated);
        return redirect()->route('hr.projects.show', ['tenant' => tenant('slug'), 'project' => $project->id])
            ->with('success', 'Project updated.');
    }

    public function destroy(Request $request, Project $project): RedirectResponse
    {
        if ($project->tenant_id !== tenant('id')) {
            abort(404);
        }
        $project->delete();
        return redirect()->route('hr.projects.index', ['tenant' => tenant('slug')])
            ->with('success', 'Project deleted.');
    }
}
