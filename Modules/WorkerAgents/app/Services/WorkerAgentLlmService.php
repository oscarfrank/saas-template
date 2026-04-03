<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Cortex\Services\CortexLlmProviderFactory;
use Modules\Cortex\Support\CortexLlmProvider;
use Modules\HR\Models\OrganizationGoal;
use Modules\HR\Models\Staff;
use Modules\HR\Models\Task;
use Modules\WorkerAgents\Models\WorkerAgent;
use Modules\WorkerAgents\Models\WorkerAgentHandoff;
use Modules\WorkerAgents\Models\WorkerAgentMemory;
use Modules\WorkerAgents\Support\WorkerAgentHandoffStatus;
use OpenAI\Laravel\Facades\OpenAI;

final class WorkerAgentLlmService
{
    public function __construct(
        private readonly CortexLlmProviderFactory $llmFactory,
    ) {}

    /**
     * @param  array{
     *   trigger: string,
     *   goals: list<array{title: string, description: string|null}>,
     *   memories?: list<array{body: string, source: string, created_at: string|null}>,
     *   incoming_handoffs?: list<array<string, mixed>>,
     *   peer_worker_agents?: list<array{id: int, name: string}>,
     *   human_staff_for_delegation?: list<array{staff_id: int, label: string, job_title: string|null}>,
     *   open_tasks_assigned_to_my_seat?: list<array<string, mixed>>,
     * }  $context
     * @return array{summary: string, actions: list<array<string, mixed>>, raw_error: string|null}
     */
    public function plan(WorkerAgent $worker, array $context): array
    {
        $provider = $worker->llm_provider instanceof CortexLlmProvider
            ? $worker->llm_provider
            : CortexLlmProvider::tryFrom((string) $worker->llm_provider) ?? CortexLlmProvider::OpenAI;

        $configured = match ($provider) {
            CortexLlmProvider::OpenAI => $this->llmFactory->isOpenAiKeyConfigured(),
            CortexLlmProvider::Anthropic => $this->llmFactory->isAnthropicKeyConfigured(),
        };

        if (! $configured) {
            return [
                'summary' => 'LLM is not configured: add the API key for the selected provider (OpenAI or Anthropic) in your environment.',
                'actions' => [],
                'raw_error' => 'missing_api_key',
            ];
        }

        [$system, $user] = $this->buildPrompts($worker, $context);

        try {
            $text = match ($provider) {
                CortexLlmProvider::OpenAI => $this->callOpenAi($worker, $system, $user),
                CortexLlmProvider::Anthropic => $this->callAnthropic($worker, $system, $user),
            };
        } catch (\Throwable $e) {
            Log::warning('WorkerAgentLlmService::plan failed', [
                'worker_agent_id' => $worker->id,
                'exception' => $e->getMessage(),
            ]);

            return [
                'summary' => 'The model call failed: '.$e->getMessage(),
                'actions' => [],
                'raw_error' => $e->getMessage(),
            ];
        }

        $decoded = $this->decodeJsonObject($text);
        if ($decoded === null) {
            return [
                'summary' => 'Could not parse model output as JSON.',
                'actions' => [],
                'raw_error' => 'invalid_json',
            ];
        }

        $summary = isset($decoded['summary']) ? trim((string) $decoded['summary']) : '';
        if ($summary === '') {
            $summary = 'Run produced no summary text.';
        }

        $actions = [];
        if (isset($decoded['actions']) && is_array($decoded['actions'])) {
            foreach ($decoded['actions'] as $row) {
                if (is_array($row) && isset($row['type'])) {
                    $actions[] = $row;
                }
            }
        }

        return [
            'summary' => $summary,
            'actions' => $actions,
            'raw_error' => null,
        ];
    }

    /**
     * Context for {@see plan()} (goals, memories, handoffs, peers, humans, open tasks).
     *
     * @return array{
     *   incoming_handoffs: list<array<string, mixed>>,
     *   peer_worker_agents: list<array{id: int, name: string}>,
     *   human_staff_for_delegation: list<array{staff_id: int, label: string, job_title: string|null}>,
     *   open_tasks_assigned_to_my_seat: list<array<string, mixed>>,
     * }
     */
    public function planningContextForWorker(WorkerAgent $worker): array
    {
        $tenantId = (string) $worker->tenant_id;

        $incomingHandoffs = WorkerAgentHandoff::query()
            ->where('tenant_id', $tenantId)
            ->where('to_worker_agent_id', $worker->id)
            ->where('status', WorkerAgentHandoffStatus::Pending)
            ->with(['fromWorkerAgent:id,name', 'task:id,title,status'])
            ->orderByDesc('id')
            ->limit(15)
            ->get()
            ->map(fn (WorkerAgentHandoff $h) => [
                'handoff_id' => $h->id,
                'from_worker_name' => $h->fromWorkerAgent?->name,
                'message' => $h->message,
                'hr_task_id' => $h->hr_task_id,
                'linked_task_title' => $h->task?->title,
                'linked_task_status' => $h->task?->status,
            ])
            ->values()
            ->all();

        $peerWorkers = WorkerAgent::query()
            ->where('tenant_id', $tenantId)
            ->whereKeyNot($worker->id)
            ->where('enabled', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (WorkerAgent $w) => ['id' => $w->id, 'name' => $w->name])
            ->values()
            ->all();

        $humanStaff = Staff::query()
            ->where('tenant_id', $tenantId)
            ->where('kind', 'human')
            ->with('user:id,first_name,last_name')
            ->orderBy('id')
            ->limit(80)
            ->get()
            ->map(function (Staff $s) {
                $label = $s->user !== null
                    ? trim(($s->user->first_name ?? '').' '.($s->user->last_name ?? ''))
                    : '';

                return [
                    'staff_id' => $s->id,
                    'label' => $label !== '' ? $label : ('Staff #'.$s->id),
                    'job_title' => $s->job_title,
                ];
            })
            ->all();

        $openTasks = [];
        if ($worker->staff_id !== null) {
            $openTasks = Task::query()
                ->where('tenant_id', $tenantId)
                ->where('assigned_to', $worker->staff_id)
                ->whereIn('status', ['todo', 'in_progress'])
                ->orderByDesc('id')
                ->limit(30)
                ->get()
                ->map(fn (Task $t) => [
                    'hr_task_id' => $t->id,
                    'title' => $t->title,
                    'status' => $t->status,
                    'priority' => $t->priority,
                    'description_excerpt' => $t->description !== null ? \mb_substr((string) $t->description, 0, 500) : null,
                ])
                ->all();
        }

        return [
            'incoming_handoffs' => $incomingHandoffs,
            'peer_worker_agents' => $peerWorkers,
            'human_staff_for_delegation' => $humanStaff,
            'open_tasks_assigned_to_my_seat' => $openTasks,
        ];
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array{0: string, 1: string}
     */
    private function buildPrompts(WorkerAgent $worker, array $context): array
    {
        $capLines = [];
        foreach ($worker->capabilities ?? [] as $c) {
            $capLines[] = '- '.(string) $c;
        }
        $capBlock = $capLines !== [] ? implode("\n", $capLines) : '- (none listed)';

        $goalLines = [];
        foreach ($context['goals'] ?? [] as $g) {
            $t = (string) ($g['title'] ?? '');
            $d = isset($g['description']) && $g['description'] !== null ? (string) $g['description'] : '';
            $goalLines[] = $d !== '' ? "- {$t}: {$d}" : "- {$t}";
        }
        $goalsBlock = $goalLines !== [] ? implode("\n", $goalLines) : '- (no goals linked)';

        $memoryLines = [];
        foreach ($context['memories'] ?? [] as $mem) {
            if (! is_array($mem)) {
                continue;
            }
            $b = trim((string) ($mem['body'] ?? ''));
            if ($b === '') {
                continue;
            }
            $src = trim((string) ($mem['source'] ?? 'note'));
            $memoryLines[] = $src !== '' ? "- [{$src}] {$b}" : "- {$b}";
        }
        $memoriesBlock = $memoryLines !== [] ? implode("\n", $memoryLines) : '- (none yet)';

        $incomingHandoffs = $context['incoming_handoffs'] ?? [];
        $incomingBlock = $incomingHandoffs !== []
            ? json_encode($incomingHandoffs, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
            : '- (none pending)';

        $peerBlock = $context['peer_worker_agents'] ?? [];
        $peerLines = $peerBlock !== []
            ? json_encode($peerBlock, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
            : '- (no other workers in tenant)';

        $humanBlock = $context['human_staff_for_delegation'] ?? [];
        $humanLines = $humanBlock !== []
            ? json_encode($humanBlock, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
            : '- (no human staff listed)';

        $openSeatBlock = $context['open_tasks_assigned_to_my_seat'] ?? [];
        $openSeatLines = $openSeatBlock !== []
            ? json_encode($openSeatBlock, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
            : '- (none)';

        $system = <<<'TXT'
You are an HR automation worker agent. Respond with a single JSON object only (no markdown fences).
Schema:
{
  "summary": "Short paragraph of what you considered and decided.",
  "actions": [
    {
      "type": "task_create",
      "title": "string",
      "description": "string or empty",
      "priority": "low|medium|high",
      "assignee_staff_id": null or integer (optional; default is the worker's own staff seat)
    },
    {
      "type": "handoff_request",
      "to_worker_agent_id": integer,
      "hr_task_id": null or integer,
      "message": "string",
      "auto_accept": true or false (optional; default false). If true, the receiving agent immediately owns the linked task (no human click) and the system may queue a follow-up run for them.
    },
    {
      "type": "task_complete",
      "hr_task_id": integer,
      "note": "string or empty (optional; appended to task description)"
    }
  ]
}
Multi-step workflow (when goals require it):
- Lead / analyst: decide work, optionally create a task for your own seat (record), then hand off to a specialist using peer_worker_agents ids (use auto_accept true to hand off immediately without waiting for a human to accept).
- If you create a task in the same response and hand off that same task, omit hr_task_id on handoff_request; the system will attach the task created earlier in this run.
- Specialist: use open_tasks_assigned_to_my_seat and task_complete when work is finished.
- Human follow-up: create a task with assignee_staff_id set to a human from human_staff_for_delegation and title like "Add to calendar" or "Review"; that task stays todo for the person.
Rules:
- Prefer at most 1–3 task_create actions unless goals clearly need more.
- Use handoff_request when another worker agent should own follow-up work.
- task_complete only for tasks assigned to this worker's seat (see open_tasks_assigned_to_my_seat hr_task_id).
- You may rely on long-term memory when it helps continuity; do not contradict explicit organization goals.
- If nothing actionable is appropriate, return an empty "actions" array.
TXT;

        $user = sprintf(
            "Worker name: %s\nTrigger: %s\nSkills / focus:\n%s\n\nLinked organization goals:\n%s\n\nCapabilities:\n%s\n\nLong-term memory (established context for this worker; may include teammate notes):\n%s\n\nPending handoffs to this worker (awaiting human accept if auto_accept was false):\n%s\n\nOther worker agents in this tenant (use id to_worker_agent_id):\n%s\n\nHuman staff for delegation (assignee_staff_id for calendar / review todos):\n%s\n\nOpen HR tasks assigned to this worker's seat (use hr_task_id for task_complete):\n%s\n",
            $worker->name,
            $context['trigger'] ?? 'scheduled',
            $worker->skills ?? '(none)',
            $goalsBlock,
            $capBlock,
            $memoriesBlock,
            $incomingBlock,
            $peerLines,
            $humanLines,
            $openSeatLines
        );

        return [$system, $user];
    }

    private function callOpenAi(WorkerAgent $worker, string $system, string $user): string
    {
        $model = is_string($worker->chat_model) && $worker->chat_model !== ''
            ? $worker->chat_model
            : (string) config('openai.chat_model', 'gpt-4o-mini');

        try {
            $response = OpenAI::chat()->create([
                'model' => $model,
                'messages' => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => $user],
                ],
                'temperature' => 0.35,
                'response_format' => ['type' => 'json_object'],
            ]);
        } catch (\Throwable) {
            $response = OpenAI::chat()->create([
                'model' => $model,
                'messages' => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => $user],
                ],
                'temperature' => 0.35,
            ]);
        }

        $text = $response->choices[0]->message->content ?? '';

        return trim((string) $text);
    }

    private function callAnthropic(WorkerAgent $worker, string $system, string $user): string
    {
        $model = is_string($worker->chat_model) && $worker->chat_model !== ''
            ? $worker->chat_model
            : (string) config('anthropic.chat_model');

        $key = config('anthropic.api_key');
        if (! is_string($key) || $key === '') {
            throw new \RuntimeException('Anthropic API key missing.');
        }

        $timeout = (int) config('anthropic.request_timeout', 120);

        $response = Http::timeout($timeout)
            ->withHeaders([
                'x-api-key' => $key,
                'anthropic-version' => '2023-06-01',
                'content-type' => 'application/json',
            ])
            ->post('https://api.anthropic.com/v1/messages', [
                'model' => $model,
                'max_tokens' => 4096,
                'system' => $system,
                'messages' => [
                    ['role' => 'user', 'content' => $user."\n\nReturn JSON only, no prose outside the object."],
                ],
            ]);

        if (! $response->successful()) {
            throw new \RuntimeException('Anthropic HTTP '.$response->status().': '.$response->body());
        }

        $text = $response->json('content.0.text');

        return trim((string) $text);
    }

    private function decodeJsonObject(string $text): ?array
    {
        $text = trim($text);
        if (preg_match('/^```(?:json)?\s*([\s\S]*?)```/m', $text, $m)) {
            $text = trim($m[1]);
        }

        $decoded = json_decode($text, true);

        return is_array($decoded) ? $decoded : null;
    }

    /**
     * @return list<array{title: string, description: string|null}>
     */
    public function goalsForWorker(WorkerAgent $worker): array
    {
        $ids = $worker->organization_goal_ids ?? [];
        if ($ids === []) {
            return [];
        }

        return OrganizationGoal::query()
            ->where('tenant_id', $worker->tenant_id)
            ->whereIn('id', $ids)
            ->orderBy('sort_order')
            ->get(['title', 'description'])
            ->map(fn (OrganizationGoal $g) => [
                'title' => (string) $g->title,
                'description' => $g->description,
            ])
            ->all();
    }

    /**
     * Recent memories visible to this worker in the tenant (and to teammates on the profile). Newest first, capped for prompt size.
     *
     * @return list<array{body: string, source: string, created_at: string|null}>
     */
    public function memoriesForWorker(WorkerAgent $worker): array
    {
        return WorkerAgentMemory::query()
            ->where('tenant_id', $worker->tenant_id)
            ->where('worker_agent_id', $worker->id)
            ->orderByDesc('id')
            ->limit(25)
            ->get(['body', 'source', 'created_at'])
            ->map(fn (WorkerAgentMemory $m) => [
                'body' => (string) $m->body,
                'source' => (string) $m->source,
                'created_at' => $m->created_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }
}
