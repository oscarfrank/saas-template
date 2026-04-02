<?php

declare(strict_types=1);

namespace Modules\HR\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\HR\Models\OrganizationGoal;

class OrganizationGoalController extends Controller
{
    public function index(): Response
    {
        $goals = OrganizationGoal::query()
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get(['id', 'uuid', 'title', 'description', 'status', 'sort_order', 'updated_at']);

        return Inertia::render('hr/goals/index', [
            'goals' => $goals,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'status' => ['nullable', 'string', 'max:32'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ]);

        OrganizationGoal::query()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? 'active',
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        return redirect()->back()->with('success', 'Goal created.');
    }

    public function update(Request $request, OrganizationGoal $goal): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'status' => ['nullable', 'string', 'max:32'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ]);

        foreach (['title', 'description', 'status', 'sort_order'] as $key) {
            if (array_key_exists($key, $validated)) {
                $goal->{$key} = $validated[$key];
            }
        }
        $goal->save();

        return redirect()->back()->with('success', 'Goal updated.');
    }

    public function destroy(OrganizationGoal $goal): RedirectResponse
    {
        $goal->delete();

        return redirect()->back()->with('success', 'Goal removed.');
    }
}
