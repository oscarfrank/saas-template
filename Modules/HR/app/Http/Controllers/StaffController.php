<?php

namespace Modules\HR\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\HR\Models\Staff;
use Modules\User\Models\User;

class StaffController extends Controller
{
    /**
     * List all organization members (tenant users). Each may have an optional HR (staff) record.
     * Nobody is "added" here—invited org members show up automatically; you only add HR details.
     */
    public function index(Request $request): Response
    {
        $tenantId = tenant('id');
        $tenantUserIds = DB::table('tenant_user')->where('tenant_id', $tenantId)->pluck('user_id');

        $userQuery = User::query()
            ->whereIn('id', $tenantUserIds)
            ->select(['id', 'first_name', 'last_name', 'email']);

        if ($request->filled('search')) {
            $search = trim($request->search);
            $userQuery->where(function ($q) use ($search) {
                $q->where('first_name', 'like', '%' . $search . '%')
                    ->orWhere('last_name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%');
            });
        }

        $users = $userQuery->orderBy('first_name')->orderBy('last_name')->paginate(15)->withQueryString();
        $staffByUserId = Staff::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('user_id', $users->pluck('id'))
            ->with('user:id,first_name,last_name,email')
            ->get()
            ->keyBy('user_id');

        $members = $users->map(fn ($user) => [
            'user' => $user,
            'staff' => $staffByUserId->get($user->id)?->toArray(),
        ])->all();

        return Inertia::render('hr/staff/index', [
            'members' => $members,
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Add HR details for an organization member. Optional user_id to pre-select a member (e.g. from "Add HR details" on index).
     */
    public function create(Request $request): Response
    {
        $tenantId = tenant('id');
        $existingStaffUserIds = Staff::where('tenant_id', $tenantId)->pluck('user_id');
        $tenantUserIds = DB::table('tenant_user')->where('tenant_id', $tenantId)->pluck('user_id');
        $users = User::query()
            ->whereIn('id', $tenantUserIds)
            ->whereNotIn('id', $existingStaffUserIds)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'email'])
            ->map(fn ($u) => ['id' => $u->id, 'name' => trim($u->first_name . ' ' . $u->last_name) ?: $u->email, 'email' => $u->email]);

        $preSelectUser = null;
        if ($request->filled('user_id')) {
            $userId = (int) $request->user_id;
            if (in_array($userId, $tenantUserIds->all(), true)) {
                $u = User::find($userId);
                if ($u && !$existingStaffUserIds->contains($userId)) {
                    $preSelectUser = ['id' => $u->id, 'name' => trim($u->first_name . ' ' . $u->last_name) ?: $u->email, 'email' => $u->email];
                }
            }
        }

        return Inertia::render('hr/staff/create', [
            'users' => $users,
            'preSelectUser' => $preSelectUser,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $tenantId = tenant('id');
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'employee_id' => 'nullable|string|max:64',
            'department' => 'nullable|string|max:128',
            'job_title' => 'nullable|string|max:128',
            'salary' => 'nullable|numeric|min:0',
            'salary_currency' => 'nullable|string|size:3',
            'pay_frequency' => 'nullable|string|in:weekly,bi_weekly,monthly',
            'started_at' => 'nullable|date',
            'ended_at' => 'nullable|date|after_or_equal:started_at',
        ]);

        if (Staff::where('tenant_id', $tenantId)->where('user_id', $validated['user_id'])->exists()) {
            return back()->withErrors(['user_id' => 'This user is already a staff member in this organization.']);
        }

        Staff::create([
            'tenant_id' => $tenantId,
            'user_id' => $validated['user_id'],
            'employee_id' => $validated['employee_id'] ?? null,
            'department' => $validated['department'] ?? null,
            'job_title' => $validated['job_title'] ?? null,
            'salary' => $validated['salary'] ?? null,
            'salary_currency' => $validated['salary_currency'] ?? 'USD',
            'pay_frequency' => $validated['pay_frequency'] ?? null,
            'started_at' => $validated['started_at'] ?? null,
            'ended_at' => $validated['ended_at'] ?? null,
        ]);

        return redirect()->route('hr.staff.index', ['tenant' => tenant('slug')])
            ->with('success', 'HR details added.');
    }

    public function show(Request $request, Staff $staff): Response|RedirectResponse
    {
        if ($staff->tenant_id !== tenant('id')) {
            abort(404);
        }
        $staff->load(['user:id,first_name,last_name,email', 'assignedTasks' => fn ($q) => $q->orderBy('due_at')->limit(10), 'ownedProjects']);
        return Inertia::render('hr/staff/show', ['staff' => $staff]);
    }

    public function edit(Request $request, Staff $staff): Response|RedirectResponse
    {
        if ($staff->tenant_id !== tenant('id')) {
            abort(404);
        }
        $staff->load('user:id,first_name,last_name,email');
        return Inertia::render('hr/staff/edit', ['staff' => $staff]);
    }

    public function update(Request $request, Staff $staff): RedirectResponse
    {
        if ($staff->tenant_id !== tenant('id')) {
            abort(404);
        }
        $validated = $request->validate([
            'employee_id' => 'nullable|string|max:64',
            'department' => 'nullable|string|max:128',
            'job_title' => 'nullable|string|max:128',
            'salary' => 'nullable|numeric|min:0',
            'salary_currency' => 'nullable|string|size:3',
            'pay_frequency' => 'nullable|string|in:weekly,bi_weekly,monthly',
            'started_at' => 'nullable|date',
            'ended_at' => 'nullable|date|after_or_equal:started_at',
        ]);

        $staff->update([
            'employee_id' => $validated['employee_id'] ?? null,
            'department' => $validated['department'] ?? null,
            'job_title' => $validated['job_title'] ?? null,
            'salary' => $validated['salary'] ?? null,
            'salary_currency' => $validated['salary_currency'] ?? 'USD',
            'pay_frequency' => $validated['pay_frequency'] ?? null,
            'started_at' => $validated['started_at'] ?? null,
            'ended_at' => $validated['ended_at'] ?? null,
        ]);

        return redirect()->route('hr.staff.show', ['tenant' => tenant('slug'), 'staff' => $staff->id])
            ->with('success', 'Staff updated.');
    }

    public function destroy(Request $request, Staff $staff): RedirectResponse
    {
        if ($staff->tenant_id !== tenant('id')) {
            abort(404);
        }
        $staff->delete();
        return redirect()->route('hr.staff.index', ['tenant' => tenant('slug')])
            ->with('success', 'Staff member removed.');
    }
}
