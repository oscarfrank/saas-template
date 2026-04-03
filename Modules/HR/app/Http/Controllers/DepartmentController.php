<?php

declare(strict_types=1);

namespace Modules\HR\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Modules\HR\Models\Department;

class DepartmentController extends Controller
{
    public function index(): Response
    {
        $departments = Department::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'uuid', 'name', 'slug', 'sort_order', 'is_active', 'updated_at']);

        return Inertia::render('hr/departments/index', [
            'departments' => $departments,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $tenantId = (string) tenant('id');
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:128',
                Rule::unique('hr_departments', 'name')->where('tenant_id', $tenantId),
            ],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ]);

        Department::query()->create([
            'name' => $validated['name'],
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', 'Department created.');
    }

    public function update(Request $request, Department $department): RedirectResponse
    {
        if ($department->tenant_id !== tenant('id')) {
            abort(404);
        }

        $tenantId = (string) tenant('id');
        $validated = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:128',
                Rule::unique('hr_departments', 'name')
                    ->where('tenant_id', $tenantId)
                    ->ignore($department->id),
            ],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        foreach (['name', 'sort_order', 'is_active'] as $key) {
            if (array_key_exists($key, $validated)) {
                $department->{$key} = $validated[$key];
            }
        }
        if (isset($validated['name'])) {
            $department->slug = Department::uniqueSlugForTenant($tenantId, (string) $department->name, $department->id);
        }
        $department->save();

        return redirect()->back()->with('success', 'Department updated.');
    }

    public function destroy(Department $department): RedirectResponse
    {
        if ($department->tenant_id !== tenant('id')) {
            abort(404);
        }

        if ($department->staff()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete a department that still has staff assigned.');
        }

        $department->delete();

        return redirect()->back()->with('success', 'Department removed.');
    }
}
