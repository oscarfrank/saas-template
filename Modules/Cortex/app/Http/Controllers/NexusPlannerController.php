<?php

declare(strict_types=1);

namespace Modules\Cortex\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Traits\LevelBasedAuthorization;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Cortex\Http\Controllers\Concerns\InteractsWithCortexLlm;
use Modules\Cortex\Neuron\NexusPlannerAgent;
use Modules\Cortex\Neuron\Output\NexusAction;
use Modules\Cortex\Neuron\Output\NexusPlanOutput;
use Modules\Cortex\Support\CortexAgentKey;
use Modules\HR\Models\Staff;
use Modules\HR\Models\Task;
use Modules\Script\Models\Script;
use NeuronAI\Chat\Messages\UserMessage;

class NexusPlannerController extends Controller
{
    use InteractsWithCortexLlm;
    use LevelBasedAuthorization;

    /** Minimum role level to create HR tasks from Nexus (manager and above). */
    private const APPLY_LEVEL = 50;

    public function index(): Response
    {
        $tenantId = tenant('id');

        return Inertia::render('cortex/agents/nexus', [
            'openAiConfigured' => $this->cortexOpenAiConfiguredProp(is_string($tenantId) ? $tenantId : null, CortexAgentKey::NexusPlanner),
            'canApply' => $this->hasLevel(self::APPLY_LEVEL),
        ]);
    }

    public function chat(Request $request): JsonResponse
    {
        $this->raiseRuntimeLimitForAgent();

        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        if (! $this->cortexLlmConfigured($tenantId, CortexAgentKey::NexusPlanner)) {
            return response()->json([
                'message' => $this->cortexMissingLlmKeyMessage($tenantId, CortexAgentKey::NexusPlanner),
            ], 503);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:4000'],
            'history' => ['nullable', 'array'],
            'history.*.role' => ['nullable', 'string'],
            'history.*.content' => ['nullable', 'string'],
            'selected_keys' => ['nullable', 'array'],
            'selected_keys.*' => ['nullable', 'string'],
        ]);

        $range = $this->planningRangeFromRequest($validated, Carbon::now());

        $scripts = $this->loadScriptsForPlanning($tenantId, $range['start'], $range['end']);
        $staffRoster = $this->loadStaffRoster($tenantId);

        $scriptIds = $scripts->pluck('id')->values()->all();
        $existingKeys = $this->loadExistingNexusKeys($tenantId, $scriptIds);

        $assistantSystemContext = $this->buildAgentInstructions($scripts, $staffRoster, $existingKeys, $range, $validated);

        try {
            $agent = NexusPlannerAgent::make()
                ->setAiProvider($this->cortexLlmFactory()->makeForTenantAgent($tenantId, CortexAgentKey::NexusPlanner))
                ->setInstructions($assistantSystemContext)
                ->toolMaxRuns(0);

            /** @var NexusPlanOutput $output */
            $output = $agent->structured(
                messages: new UserMessage($validated['message']),
                class: NexusPlanOutput::class,
                maxRetries: 2,
            );

            $candidates = $this->normalizeCandidates(
                $scripts,
                $staffRoster,
                $existingKeys,
                $output->candidates ?? [],
            );

            return response()->json([
                'assistant_message' => $output->assistant_message ?? 'Plan updated.',
                'candidates' => array_values($candidates),
                'planning_range' => $range,
            ]);
        } catch (\Throwable $e) {
            Log::error('NexusPlannerController::chat failed', [
                'error' => $e->getMessage(),
                'exception' => $e::class,
            ]);

            return response()->json([
                'message' => 'Nexus planning failed. Check logs or try again.',
            ], 500);
        }
    }

    public function apply(Request $request): JsonResponse
    {
        $tenantId = tenant('id');

        if (! $this->hasLevel(self::APPLY_LEVEL)) {
            return response()->json(['message' => 'Insufficient access level.'], 403);
        }

        $validated = $request->validate([
            'selected' => ['required', 'array', 'min:1'],
            'selected.*.key' => ['required', 'string'],
            'selected.*.script_id' => ['required', 'integer'],
            'selected.*.action' => ['required', 'string'],
            'selected.*.assigned_to' => ['required', 'integer'],
            'selected.*.title' => ['required', 'string', 'max:255'],
            'selected.*.description' => ['required', 'string', 'max:5000'],
            'selected.*.priority' => ['nullable', 'string'],
        ]);

        $staffIds = Staff::where('tenant_id', $tenantId)->pluck('id')->values()->all();
        $staffIdSet = array_flip($staffIds);

        $selectedByScript = [];
        foreach ($validated['selected'] as $item) {
            $selectedByScript[(int) $item['script_id']][] = $item;
        }

        $scriptIds = array_keys($selectedByScript);
        $scripts = Script::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('id', $scriptIds)
            ->get()
            ->keyBy('id');

        $existingKeys = $this->loadExistingNexusKeys($tenantId, $scriptIds);

        $created = [];
        $skipped = [];

        foreach ($validated['selected'] as $item) {
            $scriptId = (int) $item['script_id'];
            $action = NexusAction::tryFrom((string) $item['action']);
            if (! $action) {
                $skipped[] = ['key' => $item['key'], 'reason' => 'Invalid action'];

                continue;
            }

            $script = $scripts->get($scriptId);
            if (! $script) {
                $skipped[] = ['key' => $item['key'], 'reason' => 'Script not found'];

                continue;
            }

            $expectedAction = $this->expectedActionForScript($script->status, $script->production_status, $script->published_at);
            if ($expectedAction === null || $expectedAction !== $action) {
                $skipped[] = ['key' => $item['key'], 'reason' => 'Action not allowed for script state'];

                continue;
            }

            $key = $this->nexusKey($scriptId, $action);
            if (isset($existingKeys[$key])) {
                $skipped[] = ['key' => $key, 'reason' => 'Already exists'];

                continue;
            }

            $assignedTo = (int) $item['assigned_to'];
            if (! isset($staffIdSet[$assignedTo])) {
                $skipped[] = ['key' => $key, 'reason' => 'Assignee is not in tenant staff roster'];

                continue;
            }

            $dueAt = $script->scheduled_at;
            if (! $dueAt) {
                $skipped[] = ['key' => $key, 'reason' => 'Script has no scheduled_at date'];

                continue;
            }

            $description = trim((string) $item['description']);

            if ($action === NexusAction::Publish) {
                $description = rtrim($description)."\n\nPublish at: ".$dueAt->toIso8601String();
            }

            $description = rtrim($description)."\n\nNEXUS_KEY:v1:{$scriptId}:{$action->value}";

            $priority = is_string($item['priority'] ?? null) ? (string) $item['priority'] : null;
            $priority = $priority ?: 'medium';

            $task = Task::create([
                'tenant_id' => $tenantId,
                'script_id' => $scriptId,
                'assigned_to' => $assignedTo,
                'title' => trim((string) $item['title']),
                'description' => $description,
                'status' => 'todo',
                'priority' => $priority,
                'project_id' => null,
                'blocked_by_task_id' => null,
                'due_at' => $dueAt,
            ]);

            $created[] = [
                'key' => $key,
                'task_uuid' => $task->uuid,
                'title' => $task->title,
            ];
        }

        return response()->json([
            'message' => 'Nexus tasks processed.',
            'created' => $created,
            'skipped' => $skipped,
        ]);
    }

    private function raiseRuntimeLimitForAgent(): void
    {
        $seconds = (int) config('cortex.agent_max_execution_time', 300);
        set_time_limit($seconds > 0 ? $seconds : 0);
    }

    /**
     * @return array{start: string, end: string}
     */
    private function planningRangeFromRequest(array $validated, Carbon $now): array
    {
        // MVP: default next 7 days; allow override via request in the future.
        $start = $now->copy()->startOfDay();
        $end = $now->copy()->addDays(7)->endOfDay();

        // Optional override in request payload (not exposed in UI yet).
        if (is_array($validated['range'] ?? null)) {
            $rawStart = $validated['range']['start'] ?? null;
            $rawEnd = $validated['range']['end'] ?? null;
            if (is_string($rawStart) && is_string($rawEnd)) {
                try {
                    $start = Carbon::parse($rawStart)->startOfDay();
                    $end = Carbon::parse($rawEnd)->endOfDay();
                } catch (\Throwable) {
                    // Keep defaults.
                }
            }
        }

        return [
            'start' => $start->toIso8601String(),
            'end' => $end->toIso8601String(),
        ];
    }

    private function loadScriptsForPlanning(string $tenantId, string $rangeStartIso, string $rangeEndIso)
    {
        $productionStatuses = ['not_shot', 'shot', 'editing', 'edited'];

        return Script::query()
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->whereNotNull('scheduled_at')
            ->whereBetween('scheduled_at', [Carbon::parse($rangeStartIso), Carbon::parse($rangeEndIso)])
            ->whereIn('production_status', $productionStatuses)
            ->where('status', '!=', 'archived')
            ->orderBy('scheduled_at')
            ->get(['id', 'title', 'scheduled_at', 'status', 'production_status', 'published_at']);
    }

    private function loadStaffRoster(string $tenantId): array
    {
        $staff = Staff::query()
            ->where('tenant_id', $tenantId)
            ->with([
                'user:id,first_name,last_name',
                'user.roles:id,name,level',
                'department:id,name',
            ])
            ->get(['id', 'department_id', 'job_title', 'user_id']);

        return $staff->map(function (Staff $s) {
            $name = $s->user ? trim(($s->user->first_name ?? '').' '.($s->user->last_name ?? '')) : ('Staff #'.$s->id);
            $roles = [];
            foreach ($s->user?->roles ?? [] as $r) {
                $roles[] = ['name' => $r->name, 'level' => $r->level];
            }

            return [
                'id' => $s->id,
                'name' => $name,
                'department' => $s->department?->name,
                'job_title' => $s->job_title,
                'roles' => $roles,
            ];
        })->values()->all();
    }

    /**
     * @param  array<int>  $scriptIds
     * @return array<string, true>
     */
    private function loadExistingNexusKeys(string $tenantId, array $scriptIds): array
    {
        if ($scriptIds === []) {
            return [];
        }

        $tasks = Task::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('script_id', $scriptIds)
            ->whereNotNull('description')
            ->where('description', 'like', 'NEXUS_KEY:v1:%')
            ->get(['script_id', 'description']);

        $keys = [];
        foreach ($tasks as $t) {
            $desc = (string) $t->description;
            if (preg_match_all('/NEXUS_KEY:v1:(\\d+):([a-z_]+)/i', $desc, $m, PREG_SET_ORDER)) {
                foreach ($m as $match) {
                    $keys['NEXUS_KEY:v1:'.$match[1].':'.strtolower((string) $match[2])] = true;
                }
            }
        }

        return $keys;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Script>  $scripts
     * @param list<array{id:int,name:string,department:?string,job_title:?string,roles:list<array{name:string,level:int|null|null}>>> $staffRoster
     * @param  list<NexusTaskCandidateOutput>  $candidates
     * @return array<string, array>
     */
    private function normalizeCandidates($scripts, array $staffRoster, array $existingKeys, array $candidates): array
    {
        $scriptById = $scripts->keyBy('id');
        $staffIdToName = [];
        $staffIdSet = [];
        foreach ($staffRoster as $s) {
            $staffIdToName[(int) $s['id']] = (string) $s['name'];
            $staffIdSet[(int) $s['id']] = true;
        }

        $result = [];

        foreach ($candidates as $candidate) {
            try {
                $scriptId = (int) $candidate->script_id;
                $action = $candidate->action;
                $assignedTo = (int) $candidate->assigned_to;

                /** @var Script|null $script */
                $script = $scriptById->get($scriptId);
                if (! $script) {
                    continue;
                }

                $expectedAction = $this->expectedActionForScript($script->status, $script->production_status, $script->published_at);
                if ($expectedAction === null || $expectedAction !== $action) {
                    continue;
                }

                if (! isset($staffIdSet[$assignedTo])) {
                    continue;
                }

                $dueAt = $script->scheduled_at;
                if (! $dueAt) {
                    continue;
                }

                $key = $this->nexusKey($scriptId, $action);
                if (isset($existingKeys[$key])) {
                    continue;
                }

                $title = trim((string) $candidate->title);
                $description = trim((string) $candidate->description);
                $priority = is_string($candidate->priority ?? null) ? (string) $candidate->priority : null;
                $priority = $priority ?: 'medium';

                if ($action === NexusAction::Publish) {
                    $description = rtrim($description)."\n\nPublish at: ".$dueAt->toIso8601String();
                }

                $result[$key] = [
                    'key' => $key,
                    'script_id' => $scriptId,
                    'script_title' => (string) $script->title,
                    'action' => $action->value,
                    'assigned_to' => $assignedTo,
                    'assigned_to_name' => $staffIdToName[$assignedTo] ?? '—',
                    'due_at' => $dueAt->toIso8601String(),
                    'recommended_due_at' => $dueAt->toIso8601String(),
                    'priority' => $priority,
                    'title' => $title,
                    'description' => $description,
                ];
            } catch (\Throwable $e) {
                // Ignore candidate normalization errors and continue.
                continue;
            }
        }

        return $result;
    }

    /**
     * Derive the single allowed Nexus action from workflow status and production_status.
     * When production is not_shot, editorial status determines write_script vs shoot.
     */
    private function expectedActionForScript(?string $workflowStatus, ?string $productionStatus, $publishedAt): ?NexusAction
    {
        if (! is_string($productionStatus)) {
            return null;
        }

        if ($productionStatus === 'not_shot') {
            $s = is_string($workflowStatus) ? $workflowStatus : '';

            if (in_array($s, ['draft', 'writing', 'in_review'], true)) {
                return NexusAction::WriteScript;
            }

            if (in_array($s, ['completed', 'published'], true)) {
                return NexusAction::Shoot;
            }

            // Unknown workflow status: prefer a writing task until status is explicit.
            return NexusAction::WriteScript;
        }

        if ($productionStatus === 'shot') {
            return NexusAction::Edit;
        }

        if ($productionStatus === 'editing') {
            return NexusAction::FinalizeEdit;
        }

        if ($productionStatus === 'edited') {
            if ($publishedAt !== null) {
                return null;
            }

            return NexusAction::Publish;
        }

        return null;
    }

    private function buildAgentInstructions($scripts, array $staffRoster, array $existingKeys, array $range, array $validated): string
    {
        $start = Carbon::parse($range['start'])->toDateString();
        $end = Carbon::parse($range['end'])->toDateString();

        $conversation = '';
        if (is_array($validated['history'] ?? null)) {
            foreach (($validated['history'] ?? []) as $h) {
                $role = (string) ($h['role'] ?? '');
                $content = (string) ($h['content'] ?? '');
                if ($content === '') {
                    continue;
                }
                $conversation .= ($role === 'assistant' ? 'Assistant: ' : 'User: ').$content."\n";
            }
        }

        $selectedKeys = is_array($validated['selected_keys'] ?? null) ? $validated['selected_keys'] : [];

        $selectedKeysJson = json_encode(array_values($selectedKeys));
        $existingKeysJson = json_encode(array_keys($existingKeys));
        $scriptsJson = json_encode($scripts->map(fn ($s) => [
            'id' => $s->id,
            'title' => $s->title,
            'scheduled_at' => $s->scheduled_at?->toIso8601String(),
            'status' => $s->status,
            'production_status' => $s->production_status,
            'published_at' => $s->published_at?->toIso8601String(),
        ])->values()->all());

        $staffRosterJson = json_encode($staffRoster);

        return <<<TXT
You are Nexus. Create HR task candidates for the next planning range ($start to $end).

Rules:
- Always propose at most one task candidate per script.
- Create only candidates whose action matches BOTH workflow status and production_status:
  * When production_status is not_shot, use workflow status (field "status"):
    - draft, writing, or in_review -> write_script (script not ready for production yet)
    - completed or published -> shoot (script is ready to film)
  * shot -> edit
  * editing -> finalize_edit
  * edited -> publish (only if the video is not published yet; use published_at)
- Do not propose candidates that already exist: existing Nexus keys are provided.
- due_at must equal the script scheduled_at (if scheduled_at exists). If it exists, never invent a different date.
- For publish: the task description must explicitly say "Publish at: <due_at>".
- Staff assignment: choose the best matching staff using department + job_title and the staff's roles/levels (LLM chooses).

Current user selected candidate keys (preferences to preserve):
$selectedKeysJson

Existing Nexus keys (already created):
$existingKeysJson

Scripts (JSON):
$scriptsJson

Staff roster (JSON):
$staffRosterJson

Conversation so far (user preferences):
$conversation
TXT;
    }

    private function nexusKey(int $scriptId, NexusAction $action): string
    {
        return "NEXUS_KEY:v1:{$scriptId}:{$action->value}";
    }
}
