<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Cortex\Services\CortexLlmProviderFactory;
use Modules\Cortex\Support\CortexLlmProvider;
use Modules\HR\Models\OrganizationGoal;
use Modules\WorkerAgents\Models\WorkerAgent;
use OpenAI\Laravel\Facades\OpenAI;

final class WorkerAgentLlmService
{
    public function __construct(
        private readonly CortexLlmProviderFactory $llmFactory,
    ) {}

    /**
     * @param  array{trigger: string, goals: list<array{title: string, description: string|null}>}  $context
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
     * @param  array{trigger: string, goals: list<array{title: string, description: string|null}>}  $context
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
      "message": "string"
    }
  ]
}
Rules:
- Prefer at most 1–3 task_create actions unless the user goals clearly need more.
- Use handoff_request when another worker agent should own follow-up work or a specific task reassignment is implied.
- If nothing actionable is appropriate, return an empty "actions" array.
TXT;

        $user = sprintf(
            "Worker name: %s\nTrigger: %s\nSkills / focus:\n%s\n\nLinked organization goals:\n%s\n\nCapabilities:\n%s\n",
            $worker->name,
            $context['trigger'] ?? 'scheduled',
            $worker->skills ?? '(none)',
            $goalsBlock,
            $capBlock
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
}
