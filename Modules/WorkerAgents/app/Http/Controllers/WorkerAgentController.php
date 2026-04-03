<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Cortex\Services\CortexLlmProviderFactory;
use Modules\Cortex\Support\CortexLlmModelCatalog;
use Modules\Cortex\Support\CortexLlmProvider;
use Modules\HR\Models\OrganizationGoal;
use Modules\HR\Models\Project;
use Modules\HR\Models\Staff;
use Modules\HR\Support\StaffReportingOptions;
use Modules\WorkerAgents\Jobs\RunWorkerAgentJob;
use Modules\WorkerAgents\Models\WorkerAgent;
use Modules\WorkerAgents\Models\WorkerAgentHandoff;
use Modules\WorkerAgents\Models\WorkerAgentMemory;
use Modules\WorkerAgents\Models\WorkerAgentMessage;
use Modules\WorkerAgents\Models\WorkerAgentProposal;
use Modules\WorkerAgents\Models\WorkerAgentRunEvent;
use Modules\WorkerAgents\Services\WorkerAgentSeatService;
use Modules\WorkerAgents\Support\WorkerAgentCapability;
use Modules\WorkerAgents\Support\WorkerAgentHandoffStatus;
use Modules\WorkerAgents\Support\WorkerAgentInputScope;
use Modules\WorkerAgents\Support\WorkerAgentMessageRole;
use Modules\WorkerAgents\Support\WorkerAgentProposalStatus;
use Modules\WorkerAgents\Support\WorkerAgentScheduleCron;
use Modules\WorkerAgents\Support\WorkerAgentScheduleKind;

class WorkerAgentController extends Controller
{
    public function __construct(
        private readonly WorkerAgentSeatService $seatService,
        private readonly CortexLlmProviderFactory $llmFactory,
    ) {}

    public function index(): Response
    {
        $workers = WorkerAgent::query()
            ->with(['staff:id,uuid,job_title,kind,reports_to_staff_id'])
            ->withCount('runs')
            ->orderBy('name')
            ->get()
            ->map(fn (WorkerAgent $w) => [
                'id' => $w->id,
                'uuid' => $w->uuid,
                'name' => $w->name,
                'enabled' => $w->enabled,
                'paused_at' => $w->paused_at?->toIso8601String(),
                'automation_enabled' => $w->automation_enabled,
                'schedule_cron' => $w->schedule_cron,
                'schedule_label' => WorkerAgentScheduleCron::describe(
                    $w->schedule_kind ?? 'off',
                    $w->schedule_time,
                    $w->schedule_day_of_week !== null ? (int) $w->schedule_day_of_week : null,
                    $w->schedule_cron,
                    $w->schedule_timezone ?? 'UTC',
                ),
                'staff' => $w->staff,
                'runs_count' => $w->runs_count,
            ]);

        $pendingProposals = WorkerAgentProposal::query()
            ->where('status', WorkerAgentProposalStatus::Pending)
            ->count();

        return Inertia::render('worker-agents/index', [
            'workers' => $workers,
            'pending_proposals_count' => $pendingProposals,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('worker-agents/create', $this->formSharedProps());
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $this->seatService->create((string) tenant('id'), $data);

        return redirect()->route('worker-agents.index', ['tenant' => tenant('slug')])->with('success', 'Worker agent created.');
    }

    public function show(WorkerAgent $worker_agent): Response
    {
        $this->ensureWorkerAgentUuid($worker_agent);

        $worker_agent->load([
            'staff:id,uuid,employee_id,job_title,department,kind,reports_to_staff_id',
            'staff.reportsTo:id,uuid,job_title,kind,user_id',
            'staff.reportsTo.user:id,first_name,last_name,email',
        ]);
        $runs = $worker_agent->runs()->orderByDesc('id')->limit(30)->get();

        $latestRun = $runs->first();

        $runEvents = collect();
        if ($latestRun !== null) {
            $runEvents = $latestRun->events()
                ->orderBy('id')
                ->get()
                ->map(fn (WorkerAgentRunEvent $e) => [
                    'id' => $e->id,
                    'level' => $e->level->value,
                    'event_type' => $e->event_type,
                    'message' => $e->message,
                    'created_at' => $e->created_at?->toIso8601String(),
                ]);
        }

        $messages = WorkerAgentMessage::query()
            ->where('worker_agent_id', $worker_agent->id)
            ->orderByDesc('id')
            ->limit(40)
            ->get()
            ->sortBy('id')
            ->values()
            ->map(fn (WorkerAgentMessage $m) => [
                'id' => $m->id,
                'role' => $m->role instanceof WorkerAgentMessageRole ? $m->role->value : (string) $m->role,
                'body' => $m->body,
                'created_at' => $m->created_at?->toIso8601String(),
            ]);

        $incomingHandoffs = WorkerAgentHandoff::query()
            ->where('to_worker_agent_id', $worker_agent->id)
            ->where('status', WorkerAgentHandoffStatus::Pending)
            ->with(['fromWorkerAgent:id,uuid,name'])
            ->orderByDesc('id')
            ->get()
            ->map(fn (WorkerAgentHandoff $h) => [
                'uuid' => $h->uuid,
                'message' => $h->message,
                'hr_task_id' => $h->hr_task_id,
                'from_worker' => $h->fromWorkerAgent !== null
                    ? ['uuid' => $h->fromWorkerAgent->uuid, 'name' => $h->fromWorkerAgent->name]
                    : null,
                'created_at' => $h->created_at?->toIso8601String(),
            ]);

        $memories = WorkerAgentMemory::query()
            ->where('worker_agent_id', $worker_agent->id)
            ->with(['author:id,first_name,last_name,email'])
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(fn (WorkerAgentMemory $m) => [
                'uuid' => $m->uuid,
                'body' => $m->body,
                'source' => $m->source,
                'created_at' => $m->created_at?->toIso8601String(),
                'author' => $m->author !== null
                    ? [
                        'id' => $m->author->id,
                        'label' => trim(($m->author->first_name ?? '').' '.($m->author->last_name ?? '')) !== ''
                            ? trim(($m->author->first_name ?? '').' '.($m->author->last_name ?? ''))
                            : (string) $m->author->email,
                    ]
                    : null,
            ]);

        return Inertia::render('worker-agents/show', [
            'worker' => $this->serializeWorker($worker_agent),
            'runs' => $runs,
            'messages' => $messages,
            'incoming_handoffs' => $incomingHandoffs,
            'latest_run_events' => $runEvents,
            'latest_run_id' => $latestRun?->id,
            'memories' => $memories,
        ]);
    }

    public function storeMemory(Request $request, WorkerAgent $worker_agent): RedirectResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:20000'],
        ]);

        WorkerAgentMemory::query()->create([
            'tenant_id' => $worker_agent->tenant_id,
            'worker_agent_id' => $worker_agent->id,
            'body' => $validated['body'],
            'source' => 'manual',
            'user_id' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Memory saved.');
    }

    public function destroyMemory(WorkerAgent $worker_agent, string $memory_uuid): RedirectResponse
    {
        $row = WorkerAgentMemory::query()
            ->where('tenant_id', (string) tenant('id'))
            ->where('worker_agent_id', $worker_agent->id)
            ->where('uuid', $memory_uuid)
            ->firstOrFail();
        $row->delete();

        return redirect()->back()->with('success', 'Memory removed.');
    }

    public function edit(WorkerAgent $worker_agent): Response
    {
        $worker_agent->load('staff');
        $this->ensureWorkerAgentUuid($worker_agent);

        $props = $this->formSharedProps($worker_agent->staff_id);
        $props['otherWorkers'] = WorkerAgent::query()
            ->where('id', '!=', $worker_agent->id)
            ->orderBy('name')
            ->get(['id', 'uuid', 'name']);

        $formState = $this->workerToFormState($worker_agent);

        return Inertia::render('worker-agents/edit', array_merge($props, [
            'worker' => [
                'id' => $worker_agent->id,
                'uuid' => $worker_agent->uuid,
                'name' => $worker_agent->name,
            ],
            'workerForm' => $formState,
            // Some stacks / serializers expect snake_case page props; keep both in sync.
            'worker_form' => $formState,
        ]));
    }

    public function update(Request $request, WorkerAgent $worker_agent): RedirectResponse
    {
        $data = $this->validated($request, $worker_agent->id);
        $this->seatService->update($worker_agent, $data);

        return redirect()->route('worker-agents.show', ['tenant' => tenant('slug'), 'worker_agent' => $worker_agent])->with('success', 'Worker agent updated.');
    }

    public function destroy(WorkerAgent $worker_agent): RedirectResponse
    {
        $this->seatService->delete($worker_agent);

        return redirect()->route('worker-agents.index', ['tenant' => tenant('slug')])->with('success', 'Worker agent removed.');
    }

    public function pause(WorkerAgent $worker_agent): RedirectResponse
    {
        $worker_agent->update(['paused_at' => now()]);

        return redirect()->back()->with('success', 'Worker paused.');
    }

    public function resume(WorkerAgent $worker_agent): RedirectResponse
    {
        $worker_agent->update(['paused_at' => null]);

        return redirect()->back()->with('success', 'Worker resumed.');
    }

    public function runNow(WorkerAgent $worker_agent): RedirectResponse
    {
        if (! $worker_agent->enabled) {
            return redirect()->back()->with('error', 'Worker is disabled.');
        }

        RunWorkerAgentJob::dispatch((string) $worker_agent->tenant_id, $worker_agent->id, 'manual');

        return redirect()->back()->with('success', 'Run queued.');
    }

    /**
     * @return array<string, mixed>
     */
    private function formSharedProps(?int $exceptStaffId = null): array
    {
        $goals = OrganizationGoal::query()
            ->where('status', 'active')
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get(['id', 'uuid', 'title']);

        $otherWorkers = WorkerAgent::query()
            ->orderBy('name')
            ->get(['id', 'uuid', 'name']);

        $projects = Project::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return [
            'goals' => $goals,
            'projects' => $projects,
            'reportingOptions' => StaffReportingOptions::forTenant((string) tenant('id'), $exceptStaffId),
            'otherWorkers' => $otherWorkers,
            'capabilityOptions' => array_map(
                fn (WorkerAgentCapability $c) => ['value' => $c->value, 'label' => str_replace(['.', '_'], [' · ', ' '], $c->value)],
                WorkerAgentCapability::cases()
            ),
            'inputScopeOptions' => [
                ['value' => WorkerAgentInputScope::AllWorkers->value, 'label' => 'All workers (tasks & handoffs context)'],
                ['value' => WorkerAgentInputScope::SelectedWorkers->value, 'label' => 'Only selected worker agents'],
            ],
            'llm' => [
                'openai_key_configured' => $this->llmFactory->isOpenAiKeyConfigured(),
                'anthropic_key_configured' => $this->llmFactory->isAnthropicKeyConfigured(),
                'default_openai_model' => (string) config('openai.chat_model', 'gpt-4o-mini'),
                'default_anthropic_model' => (string) config('anthropic.chat_model', 'claude-sonnet-4-20250514'),
                'openai_model_options' => CortexLlmModelCatalog::optionsFor(CortexLlmProvider::OpenAI),
                'anthropic_model_options' => CortexLlmModelCatalog::optionsFor(CortexLlmProvider::Anthropic),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function workerToFormState(WorkerAgent $worker): array
    {
        $provider = $worker->llm_provider instanceof CortexLlmProvider ? $worker->llm_provider->value : (string) $worker->llm_provider;

        $kind = $worker->schedule_kind ?? WorkerAgentScheduleKind::Off->value;
        $customCron = '';
        if ($kind === WorkerAgentScheduleKind::Custom->value || $kind === 'custom') {
            $customCron = (string) ($worker->schedule_cron ?? '');
        }

        return [
            'name' => $worker->name,
            'department' => $worker->staff?->department ?? 'Automation',
            'reports_to_staff_id' => $worker->staff?->reports_to_staff_id,
            'skills' => $worker->skills ?? '',
            'capabilities' => $worker->capabilities ?? [],
            'organization_goal_ids' => $worker->organization_goal_ids ?? [],
            'schedule_kind' => $kind,
            'schedule_time' => $worker->schedule_time ?? '09:00',
            'schedule_day_of_week' => $worker->schedule_day_of_week !== null ? (int) $worker->schedule_day_of_week : 1,
            'schedule_cron_custom' => $customCron,
            'schedule_timezone' => $worker->schedule_timezone ?? 'UTC',
            'input_scope' => $worker->input_scope ?? WorkerAgentInputScope::AllWorkers->value,
            'input_worker_agent_ids' => $worker->input_worker_agent_ids ?? [],
            'input_project_ids' => $worker->input_project_ids ?? [],
            'automation_enabled' => $worker->automation_enabled,
            'requires_approval' => $worker->requires_approval,
            'max_runs_per_hour' => $worker->max_runs_per_hour !== null ? (string) $worker->max_runs_per_hour : '',
            'daily_llm_budget_cents' => $worker->daily_llm_budget_cents !== null ? (string) $worker->daily_llm_budget_cents : '',
            'enabled' => $worker->enabled,
            'llm_provider' => $provider,
            'chat_model' => $worker->chat_model ?? '',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeWorker(WorkerAgent $worker): array
    {
        $manager = null;
        if ($worker->staff?->relationLoaded('reportsTo') && $worker->staff->reportsTo) {
            $m = $worker->staff->reportsTo;
            $label = $m->user
                ? trim(($m->user->first_name ?? '').' '.($m->user->last_name ?? '')) ?: (string) ($m->user->email ?? '')
                : (string) ($m->job_title ?? 'Manager');
            $manager = [
                'id' => $m->id,
                'uuid' => $m->uuid,
                'job_title' => $m->job_title,
                'kind' => $m->kind,
                'label' => $label,
            ];
        }

        return [
            'id' => $worker->id,
            'uuid' => $worker->uuid,
            'name' => $worker->name,
            'skills' => $worker->skills,
            'capabilities' => $worker->capabilities ?? [],
            'organization_goal_ids' => $worker->organization_goal_ids ?? [],
            'schedule_kind' => $worker->schedule_kind ?? WorkerAgentScheduleKind::Off->value,
            'schedule_label' => WorkerAgentScheduleCron::describe(
                $worker->schedule_kind ?? 'off',
                $worker->schedule_time,
                $worker->schedule_day_of_week !== null ? (int) $worker->schedule_day_of_week : null,
                $worker->schedule_cron,
                $worker->schedule_timezone ?? 'UTC',
            ),
            'schedule_cron' => $worker->schedule_cron,
            'schedule_timezone' => $worker->schedule_timezone,
            'manager' => $manager,
            'input_scope' => $worker->input_scope,
            'input_worker_agent_ids' => $worker->input_worker_agent_ids ?? [],
            'input_project_ids' => $worker->input_project_ids ?? [],
            'automation_enabled' => $worker->automation_enabled,
            'requires_approval' => $worker->requires_approval,
            'max_runs_per_hour' => $worker->max_runs_per_hour,
            'daily_llm_budget_cents' => $worker->daily_llm_budget_cents,
            'paused_at' => $worker->paused_at?->toIso8601String(),
            'enabled' => $worker->enabled,
            'llm_provider' => $worker->llm_provider instanceof CortexLlmProvider ? $worker->llm_provider->value : (string) $worker->llm_provider,
            'chat_model' => $worker->chat_model,
            'config_version' => $worker->config_version,
            'staff' => $worker->staff,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?int $ignoreWorkerId = null): array
    {
        $tenantId = (string) tenant('id');
        $goalRule = Rule::exists('hr_organization_goals', 'id')->where('tenant_id', $tenantId);
        $workerRule = Rule::exists('worker_agents', 'id')->where('tenant_id', $tenantId);
        $projectRule = Rule::exists('hr_projects', 'id')->where('tenant_id', $tenantId);
        $staffRule = Rule::exists('hr_staff', 'id')->where('tenant_id', $tenantId);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'skills' => ['nullable', 'string', 'max:20000'],
            'capabilities' => ['nullable', 'array'],
            'capabilities.*' => ['string', Rule::in(WorkerAgentCapability::values())],
            'organization_goal_ids' => ['nullable', 'array'],
            'organization_goal_ids.*' => ['integer', $goalRule],
            'reports_to_staff_id' => ['nullable', 'integer', $staffRule],
            'schedule_kind' => ['required', 'string', Rule::in(WorkerAgentScheduleKind::values())],
            'schedule_time' => ['nullable', 'string', 'max:8', 'regex:/^$|^([01]?\d|2[0-3]):[0-5]\d$/'],
            'schedule_day_of_week' => ['nullable', 'integer', 'min:0', 'max:6'],
            'schedule_cron_custom' => ['nullable', 'string', 'max:128'],
            'schedule_timezone' => ['nullable', 'string', 'max:64'],
            'input_scope' => ['nullable', 'string', Rule::in(array_column(WorkerAgentInputScope::cases(), 'value'))],
            'input_worker_agent_ids' => ['nullable', 'array'],
            'input_worker_agent_ids.*' => ['integer', $workerRule],
            'input_project_ids' => ['nullable', 'array'],
            'input_project_ids.*' => ['integer', $projectRule],
            'automation_enabled' => ['nullable', 'boolean'],
            'requires_approval' => ['nullable', 'boolean'],
            'max_runs_per_hour' => ['nullable', 'integer', 'min:1', 'max:120'],
            'daily_llm_budget_cents' => ['nullable', 'integer', 'min:0'],
            'enabled' => ['nullable', 'boolean'],
            'llm_provider' => ['nullable', 'string', Rule::in(['openai', 'anthropic'])],
            'chat_model' => ['nullable', 'string', 'max:128'],
            'department' => ['nullable', 'string', 'max:128'],
        ]);

        $validated['reports_to_staff_id'] = isset($validated['reports_to_staff_id'])
            ? (int) $validated['reports_to_staff_id']
            : null;

        if ($ignoreWorkerId !== null) {
            $worker = WorkerAgent::query()->find($ignoreWorkerId);
            if ($worker !== null) {
                if ($validated['reports_to_staff_id'] === $worker->staff_id) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'reports_to_staff_id' => ['A person cannot report to themselves.'],
                    ]);
                }
                if ($validated['reports_to_staff_id'] !== null
                    && Staff::wouldCreateReportingCycle($worker->staff_id, $validated['reports_to_staff_id'])) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'reports_to_staff_id' => ['That reporting line would create a cycle.'],
                    ]);
                }
            }
        }

        $kind = WorkerAgentScheduleKind::tryFrom((string) $validated['schedule_kind']) ?? WorkerAgentScheduleKind::Off;

        $dow = array_key_exists('schedule_day_of_week', $validated) && $validated['schedule_day_of_week'] !== null
            ? (int) $validated['schedule_day_of_week']
            : null;

        $time = isset($validated['schedule_time']) && $validated['schedule_time'] !== ''
            ? (string) $validated['schedule_time']
            : null;

        if ($kind === WorkerAgentScheduleKind::Daily && ($time === null || trim($time) === '')) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'schedule_time' => ['Choose a time for the daily schedule.'],
            ]);
        }

        if ($kind === WorkerAgentScheduleKind::Weekly) {
            if ($time === null || trim($time) === '') {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'schedule_time' => ['Choose a time for the weekly schedule.'],
                ]);
            }
            if ($dow === null) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'schedule_day_of_week' => ['Choose a day of the week.'],
                ]);
            }
        }

        $custom = isset($validated['schedule_cron_custom']) ? trim((string) $validated['schedule_cron_custom']) : '';

        if ($kind === WorkerAgentScheduleKind::Custom && $custom === '') {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'schedule_cron_custom' => ['Enter a cron expression or pick another schedule type.'],
            ]);
        }

        $cron = WorkerAgentScheduleCron::toCronExpression($kind, $time, $dow, $custom !== '' ? $custom : null);

        try {
            WorkerAgentScheduleCron::assertValidCron($cron);
        } catch (\Throwable) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'schedule_cron_custom' => ['Invalid cron expression.'],
            ]);
        }

        $validated['schedule_cron'] = $cron;
        if ($kind !== WorkerAgentScheduleKind::Custom) {
            $validated['schedule_cron_custom'] = null;
        }

        if ($kind !== WorkerAgentScheduleKind::Weekly) {
            $validated['schedule_day_of_week'] = null;
        }
        if ($kind !== WorkerAgentScheduleKind::Daily && $kind !== WorkerAgentScheduleKind::Weekly) {
            $validated['schedule_time'] = null;
        }

        if (($validated['input_scope'] ?? WorkerAgentInputScope::AllWorkers->value) === WorkerAgentInputScope::SelectedWorkers->value) {
            $ids = $validated['input_worker_agent_ids'] ?? [];
            if ($ignoreWorkerId !== null) {
                $ids = array_values(array_filter($ids, fn (int $id): bool => $id !== $ignoreWorkerId));
            }
            if ($ids === []) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'input_worker_agent_ids' => ['Select at least one worker when using “selected workers”.'],
                ]);
            }
        }

        $validated['automation_enabled'] = (bool) ($validated['automation_enabled'] ?? true);
        $validated['requires_approval'] = (bool) ($validated['requires_approval'] ?? false);
        $validated['enabled'] = (bool) ($validated['enabled'] ?? true);
        $validated['llm_provider'] = $validated['llm_provider'] ?? 'openai';

        unset($validated['schedule_cron_custom']);

        return $validated;
    }

    private function ensureWorkerAgentUuid(WorkerAgent $worker): void
    {
        if (is_string($worker->uuid) && $worker->uuid !== '') {
            return;
        }

        $id = $worker->getKey();
        if ($id === null) {
            return;
        }

        // Use a plain UPDATE so Eloquent never runs an INSERT (missing staff_id would fail).
        $newUuid = (string) \Illuminate\Support\Str::uuid();
        WorkerAgent::query()->whereKey($id)->update(['uuid' => $newUuid]);
        $worker->uuid = $newUuid;
    }
}
