<?php

namespace Modules\HR\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\HR\Models\Evaluation;
use Modules\HR\Models\Staff;

class EvaluationController extends Controller
{
    public function index(Request $request): Response
    {
        $tenantId = tenant('id');
        $evaluations = Evaluation::query()
            ->with(['staff.user:id,first_name,last_name,email', 'reviewer.user:id,first_name,last_name,email'])
            ->where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->paginate(15)->withQueryString();

        return Inertia::render('hr/evaluations/index', ['evaluations' => $evaluations]);
    }

    public function create(Request $request): Response
    {
        $tenantId = tenant('id');
        $staff = Staff::where('tenant_id', $tenantId)->active()->with('user:id,first_name,last_name,email')->get()
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->user ? trim($s->user->first_name . ' ' . $s->user->last_name) : 'Staff #' . $s->id]);
        return Inertia::render('hr/evaluations/create', ['staff' => $staff]);
    }

    public function store(Request $request): RedirectResponse
    {
        $tenantId = tenant('id');
        $validated = $request->validate([
            'staff_id' => 'required|exists:hr_staff,id',
            'period' => 'nullable|string|max:64',
            'reviewer_id' => 'nullable|exists:hr_staff,id',
            'ratings' => 'nullable|array',
            'goals' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);
        $validated['tenant_id'] = $tenantId;
        $validated['status'] = 'draft';
        $evaluation = Evaluation::create($validated);
        return redirect()->route('hr.evaluations.show', ['tenant' => tenant('slug'), 'evaluation' => $evaluation->id])
            ->with('success', 'Evaluation created.');
    }

    public function show(Request $request, Evaluation $evaluation): Response|RedirectResponse
    {
        if ($evaluation->tenant_id !== tenant('id')) {
            abort(404);
        }
        $evaluation->load(['staff.user:id,first_name,last_name,email', 'reviewer.user:id,first_name,last_name,email']);
        return Inertia::render('hr/evaluations/show', ['evaluation' => $evaluation]);
    }

    public function edit(Request $request, Evaluation $evaluation): Response|RedirectResponse
    {
        if ($evaluation->tenant_id !== tenant('id')) {
            abort(404);
        }
        $evaluation->load(['staff.user:id,first_name,last_name,email']);
        $tenantId = tenant('id');
        $staff = Staff::where('tenant_id', $tenantId)->active()->with('user:id,first_name,last_name')->get()
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->user ? trim($s->user->first_name . ' ' . $s->user->last_name) : 'Staff #' . $s->id]);
        return Inertia::render('hr/evaluations/edit', ['evaluation' => $evaluation, 'staff' => $staff]);
    }

    public function update(Request $request, Evaluation $evaluation): RedirectResponse
    {
        if ($evaluation->tenant_id !== tenant('id')) {
            abort(404);
        }
        if ($evaluation->status === 'submitted') {
            return back()->withErrors(['status' => 'Submitted evaluations cannot be edited.']);
        }
        $validated = $request->validate([
            'period' => 'nullable|string|max:64',
            'reviewer_id' => 'nullable|exists:hr_staff,id',
            'ratings' => 'nullable|array',
            'goals' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);
        $evaluation->update($validated);
        return redirect()->route('hr.evaluations.show', ['tenant' => tenant('slug'), 'evaluation' => $evaluation->id])
            ->with('success', 'Evaluation updated.');
    }

    public function submit(Request $request, Evaluation $evaluation): RedirectResponse
    {
        if ($evaluation->tenant_id !== tenant('id')) {
            abort(404);
        }
        if ($evaluation->status === 'submitted') {
            return back()->with('info', 'Already submitted.');
        }
        $evaluation->update(['status' => 'submitted', 'submitted_at' => now()]);
        return back()->with('success', 'Evaluation submitted.');
    }
}
