<?php

namespace Modules\HR\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Traits\LevelBasedAuthorization;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Modules\HR\Models\Staff;
use Modules\HR\Models\StaffDocument;
use Modules\HR\Models\StaffEvent;
use Modules\HR\Models\StaffPositionHistory;
use Modules\User\Models\User;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StaffController extends Controller
{
    use LevelBasedAuthorization;

    /** Minimum level to delete staff event log entries (same as task management). */
    private const LEVEL_CAN_DELETE_EVENTS = 50;

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
        $request->merge(self::normalizeStaffRequest($request->all()));
        $validated = $request->validate(array_merge(self::staffValidationRules(), [
            'user_id' => 'required|exists:users,id',
        ]));

        if (Staff::where('tenant_id', $tenantId)->where('user_id', $validated['user_id'])->exists()) {
            return back()->withErrors(['user_id' => 'This user is already a staff member in this organization.']);
        }

        $passportPath = null;
        if ($request->hasFile('passport_photo')) {
            $passportPath = $request->file('passport_photo')->store(
                'hr/staff-passports/' . $tenantId,
                'local'
            );
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
            'salary_pay_day' => $validated['salary_pay_day'] ?? null,
            'allowances' => $validated['allowances'] ?? null,
            'deductions' => $validated['deductions'] ?? null,
            'passport_photo_path' => $passportPath,
            'tax_id' => $validated['tax_id'] ?? null,
            'national_id' => $validated['national_id'] ?? null,
            'bank_name' => $validated['bank_name'] ?? null,
            'bank_account_number' => $validated['bank_account_number'] ?? null,
            'bank_account_name' => $validated['bank_account_name'] ?? null,
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
        $staff->load([
            'user:id,first_name,last_name,email',
            'documents',
            'assignedTasks' => fn ($q) => $q->orderBy('due_at')->limit(10),
            'ownedProjects',
            'events' => fn ($q) => $q->with('changedBy:id,first_name,last_name')->orderByDesc('created_at')->limit(50),
            'positionHistory' => fn ($q) => $q->orderByDesc('started_at')->limit(20),
        ]);
        return Inertia::render('hr/staff/show', [
            'staff' => $staff,
            'eventTypeLabels' => StaffEvent::eventTypeLabels(),
            'canDeleteEvents' => $this->hasLevel(self::LEVEL_CAN_DELETE_EVENTS),
        ]);
    }

    public function edit(Request $request, Staff $staff): Response|RedirectResponse
    {
        if ($staff->tenant_id !== tenant('id')) {
            abort(404);
        }
        $staff->load(['user:id,first_name,last_name,email', 'documents']);
        return Inertia::render('hr/staff/edit', ['staff' => $staff]);
    }

    public function update(Request $request, Staff $staff): RedirectResponse
    {
        if ($staff->tenant_id !== tenant('id')) {
            abort(404);
        }

        // Merge JSON body into request (PHP often does not populate $request->all() from body for PUT; POST with JSON may also need explicit merge in some setups)
        $input = $request->all();
        $contentType = $request->header('Content-Type', '');
        $rawBody = $request->getContent();
        if ($rawBody !== '' && is_string($rawBody) && (str_contains($contentType, 'application/json') || (isset($rawBody[0]) && $rawBody[0] === '{'))) {
            $decoded = json_decode($rawBody, true);
            if (is_array($decoded)) {
                $request->merge($decoded);
                $input = array_merge($input, $decoded);
            }
        } elseif (str_contains($contentType, 'application/json')) {
            $decoded = $request->json()->all();
            if (is_array($decoded) && $decoded !== []) {
                $request->merge($decoded);
                $input = array_merge($input, $decoded);
            }
        }
        $request->merge(self::normalizeStaffRequest($input));
        $validated = $request->validate(self::staffValidationRules());

        $startedAt = $validated['started_at'] ?? $request->input('started_at');
        $endedAt = $validated['ended_at'] ?? $request->input('ended_at');
        if ($startedAt === '') {
            $startedAt = null;
        }
        if ($endedAt === '') {
            $endedAt = null;
        }

        $oldAttributes = $staff->only([
            'job_title', 'department', 'started_at', 'ended_at',
            'salary', 'salary_currency', 'pay_frequency',
        ]);

        $staff->update([
            'employee_id' => $validated['employee_id'] ?? null,
            'department' => $validated['department'] ?? null,
            'job_title' => $validated['job_title'] ?? null,
            'salary' => $validated['salary'] ?? null,
            'salary_currency' => $validated['salary_currency'] ?? 'USD',
            'pay_frequency' => $validated['pay_frequency'] ?? null,
            'salary_pay_day' => $validated['salary_pay_day'] ?? null,
            'allowances' => $validated['allowances'] ?? null,
            'deductions' => $validated['deductions'] ?? null,
            'tax_id' => $validated['tax_id'] ?? null,
            'national_id' => $validated['national_id'] ?? null,
            'bank_name' => $validated['bank_name'] ?? null,
            'bank_account_number' => $validated['bank_account_number'] ?? null,
            'bank_account_name' => $validated['bank_account_name'] ?? null,
            'started_at' => $startedAt,
            'ended_at' => $endedAt,
        ]);

        self::recordPositionHistoryAndEventIfChanged($staff, $oldAttributes);

        return redirect()->route('hr.staff.edit', ['tenant' => tenant('slug'), 'staff' => $staff])
            ->with('success', 'Staff updated.');
    }

    public function uploadDocument(Request $request, Staff $staff): RedirectResponse
    {
        if ($staff->tenant_id !== tenant('id')) {
            abort(404);
        }
        $validated = $request->validate([
            'file' => 'required|file|max:10240',
            'type' => 'required|string|in:contract,id,certificate,other',
            'description' => 'nullable|string|max:500',
        ]);
        $file = $request->file('file');
        $path = $file->store('hr/staff-documents/' . tenant('id') . '/' . $staff->id, 'local');
        $staff->documents()->create([
            'name' => $file->getClientOriginalName(),
            'type' => $validated['type'],
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'description' => $validated['description'] ?? null,
            'uploaded_by' => auth()->id(),
        ]);
        return back()->with('success', 'Document uploaded.');
    }

    public function deleteDocument(Request $request, Staff $staff, StaffDocument $document): RedirectResponse
    {
        if ($staff->tenant_id !== tenant('id') || $document->staff_id !== $staff->id) {
            abort(404);
        }
        if ($document->file_path && Storage::disk('local')->exists($document->file_path)) {
            Storage::disk('local')->delete($document->file_path);
        }
        $document->delete();
        return back()->with('success', 'Document deleted.');
    }

    public function downloadDocument(Request $request, Staff $staff, StaffDocument $document): StreamedResponse
    {
        if ($staff->tenant_id !== tenant('id') || $document->staff_id !== $staff->id) {
            abort(404);
        }
        return Storage::disk('local')->download($document->file_path, $document->name);
    }

    /**
     * Upload or replace passport photo (separate from main staff update so we never mix FormData with JSON).
     */
    public function updatePassportPhoto(Request $request, Staff $staff): RedirectResponse
    {
        if ($staff->tenant_id !== tenant('id')) {
            abort(404);
        }
        $request->validate([
            'passport_photo' => 'required|image|max:2048',
        ]);

        if ($staff->passport_photo_path && Storage::disk('local')->exists($staff->passport_photo_path)) {
            Storage::disk('local')->delete($staff->passport_photo_path);
        }

        $path = $request->file('passport_photo')->store(
            'hr/staff-passports/' . tenant('id'),
            'local'
        );

        $staff->update(['passport_photo_path' => $path]);

        return back()->with('success', 'Passport photo updated.');
    }

    public function passportPhoto(Request $request, Staff $staff): StreamedResponse
    {
        if ($staff->tenant_id !== tenant('id') || ! $staff->passport_photo_path) {
            abort(404);
        }
        if (! Storage::disk('local')->exists($staff->passport_photo_path)) {
            abort(404);
        }
        return Storage::disk('local')->response($staff->passport_photo_path);
    }

    /**
     * Normalize request input so empty strings become null for optional numeric/date fields.
     * This prevents validation from failing when the frontend sends "" for cleared fields.
     */
    private static function normalizeStaffRequest(array $input): array
    {
        $optionalNumericOrDate = [
            'salary', 'salary_pay_day', 'started_at', 'ended_at',
        ];
        foreach ($optionalNumericOrDate as $key) {
            if (isset($input[$key]) && $input[$key] === '') {
                $input[$key] = null;
            }
        }
        return $input;
    }

    private static function staffValidationRules(): array
    {
        return [
            'employee_id' => 'nullable|string|max:64',
            'department' => 'nullable|string|max:128',
            'job_title' => 'nullable|string|max:128',
            'salary' => 'nullable|numeric|min:0',
            'salary_currency' => 'nullable|string|in:USD,EUR,GBP,NGN',
            'pay_frequency' => 'nullable|string|in:weekly,bi_weekly,monthly',
            'salary_pay_day' => 'nullable|integer|min:1|max:31',
            'allowances' => 'nullable|array',
            'allowances.*.name' => 'required_with:allowances|string|max:128',
            'allowances.*.amount' => 'required_with:allowances|numeric|min:0',
            'deductions' => 'nullable|array',
            'deductions.*.name' => 'required_with:deductions|string|max:128',
            'deductions.*.amount' => 'required_with:deductions|numeric|min:0',
            'passport_photo' => 'nullable|image|max:2048',
            'tax_id' => 'nullable|string|max:64',
            'national_id' => 'nullable|string|max:64',
            'bank_name' => 'nullable|string|max:128',
            'bank_account_number' => 'nullable|string|max:64',
            'bank_account_name' => 'nullable|string|max:128',
            'started_at' => 'nullable|date',
            'ended_at' => 'nullable|date|after_or_equal:started_at',
        ];
    }

    /**
     * Record position history and an event when job/salary/position fields change.
     */
    private static function recordPositionHistoryAndEventIfChanged(Staff $staff, array $oldAttributes): void
    {
        $keys = ['job_title', 'department', 'started_at', 'ended_at', 'salary', 'salary_currency', 'pay_frequency'];
        $newAttributes = $staff->only($keys);
        $changed = [];
        foreach ($keys as $key) {
            $old = $oldAttributes[$key] ?? null;
            $new = $newAttributes[$key] ?? null;
            if ($old instanceof \Carbon\Carbon) {
                $old = $old->format('Y-m-d');
            }
            if ($new instanceof \Carbon\Carbon) {
                $new = $new->format('Y-m-d');
            }
            if ($old != $new) {
                $changed[$key] = ['old' => $old, 'new' => $new];
            }
        }
        if (empty($changed)) {
            return;
        }

        $positionKeys = ['job_title', 'department', 'started_at', 'ended_at'];
        $positionChanged = ! empty(array_intersect_key($changed, array_flip($positionKeys)));
        $salaryChanged = isset($changed['salary']) || isset($changed['salary_currency']) || isset($changed['pay_frequency']);

        if ($positionChanged) {
            $staff->positionHistory()->whereNull('ended_at')->update(['ended_at' => now()->toDateString()]);
            $staff->positionHistory()->create([
                'tenant_id' => $staff->tenant_id,
                'job_title' => $staff->job_title,
                'department' => $staff->department,
                'started_at' => $staff->started_at,
                'ended_at' => $staff->ended_at,
                'salary' => $staff->salary,
                'salary_currency' => $staff->salary_currency,
                'pay_frequency' => $staff->pay_frequency,
            ]);
        }

        $eventType = $positionChanged && $salaryChanged ? StaffEvent::TYPE_POSITION_CHANGE
            : ($salaryChanged ? StaffEvent::TYPE_SALARY_CHANGE : StaffEvent::TYPE_POSITION_CHANGE);
        $staff->events()->create([
            'tenant_id' => tenant('id'),
            'event_type' => $eventType,
            'title' => $positionChanged && $salaryChanged ? 'Position and salary updated'
                : ($salaryChanged ? 'Salary updated' : 'Position updated'),
            'description' => null,
            'old_values' => $oldAttributes,
            'new_values' => $newAttributes,
            'changed_by_user_id' => auth()->id(),
        ]);
    }

    public function storeEvent(Request $request, Staff $staff): RedirectResponse
    {
        if ($staff->tenant_id !== tenant('id')) {
            abort(404);
        }
        $validated = $request->validate([
            'event_type' => 'required|string|in:'.implode(',', array_keys(StaffEvent::eventTypeLabels())),
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:5000',
        ]);
        $staff->events()->create([
            'tenant_id' => tenant('id'),
            'event_type' => $validated['event_type'],
            'title' => $validated['title'] ?? null,
            'description' => $validated['description'] ?? null,
            'changed_by_user_id' => auth()->id(),
        ]);
        return back()->with('success', 'Event added.');
    }

    public function destroyEvent(Request $request, Staff $staff, StaffEvent $event): RedirectResponse
    {
        if ($staff->tenant_id !== tenant('id')) {
            abort(404);
        }
        if ($event->staff_id !== $staff->id) {
            abort(404);
        }
        if (! $this->hasLevel(self::LEVEL_CAN_DELETE_EVENTS)) {
            abort(403, 'Only admins can delete event log entries.');
        }
        $event->delete();
        return back()->with('success', 'Event deleted.');
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
