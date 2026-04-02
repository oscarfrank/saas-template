<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\HR\Models\Task;
use Modules\WorkerAgents\Models\WorkerAgent;
use Modules\WorkerAgents\Models\WorkerAgentHandoff;
use Modules\WorkerAgents\Models\WorkerAgentMessage;
use Modules\WorkerAgents\Models\WorkerAgentProposal;
use Modules\WorkerAgents\Models\WorkerAgentRun;
use Modules\WorkerAgents\Models\WorkerAgentRunEvent;
use Modules\WorkerAgents\Support\WorkerAgentHandoffStatus;
use Modules\WorkerAgents\Support\WorkerAgentMessageRole;
use Modules\WorkerAgents\Support\WorkerAgentProposalStatus;
use Modules\WorkerAgents\Support\WorkerAgentProposalType;
use Modules\WorkerAgents\Support\WorkerAgentRunEventLevel;

final class WorkerAgentRunOrchestrator
{
    public function __construct(
        private readonly WorkerAgentLlmService $llm,
        private readonly WorkerAgentProposalApplier $applier,
    ) {}

    public function execute(WorkerAgent $worker, WorkerAgentRun $run): void
    {
        $tenantId = (string) $worker->tenant_id;

        $this->logEvent($run, WorkerAgentRunEventLevel::Info, 'run.started', 'Run started.', [
            'trigger' => $run->trigger,
        ]);

        $this->appendMessage($worker, $run, WorkerAgentMessageRole::Agent, 'Starting run…');

        $goals = $this->llm->goalsForWorker($worker);
        $plan = $this->llm->plan($worker, [
            'trigger' => $run->trigger,
            'goals' => $goals,
        ]);

        $summary = $plan['summary'];
        $actions = $plan['actions'];
        $rawError = $plan['raw_error'] ?? null;

        if ($rawError !== null) {
            $this->logEvent($run, WorkerAgentRunEventLevel::Warning, 'llm.note', 'LLM stage: '.$rawError, [
                'code' => $rawError,
            ]);
        } else {
            $this->logEvent($run, WorkerAgentRunEventLevel::Info, 'llm.completed', 'Model returned a plan.', [
                'action_count' => count($actions),
            ]);
        }

        $this->appendMessage($worker, $run, WorkerAgentMessageRole::Agent, $summary);

        $proposalsCreated = 0;
        $tasksApplied = 0;
        $handoffsCreated = 0;

        foreach ($actions as $action) {
            $type = isset($action['type']) ? (string) $action['type'] : '';

            try {
                if ($type === 'task_create') {
                    $payload = $this->normalizeTaskPayload($action);
                    if ($worker->requires_approval) {
                        WorkerAgentProposal::query()->create([
                            'tenant_id' => $tenantId,
                            'worker_agent_id' => $worker->id,
                            'worker_agent_run_id' => $run->id,
                            'type' => WorkerAgentProposalType::TaskCreate,
                            'payload' => $payload,
                            'status' => WorkerAgentProposalStatus::Pending,
                        ]);
                        $proposalsCreated++;
                        $this->logEvent($run, WorkerAgentRunEventLevel::Info, 'proposal.created', 'Queued task proposal for approval.', [
                            'title' => $payload['title'] ?? '',
                        ]);
                    } else {
                        $this->applier->applyTaskCreate($worker, $payload);
                        $tasksApplied++;
                        $this->logEvent($run, WorkerAgentRunEventLevel::Info, 'task.created', 'Created HR task.', [
                            'title' => $payload['title'] ?? '',
                        ]);
                    }
                } elseif ($type === 'handoff_request') {
                    $created = $this->createHandoffFromAction($worker, $run, $action);
                    if ($created !== null) {
                        $handoffsCreated++;
                        $this->logEvent($run, WorkerAgentRunEventLevel::Info, 'handoff.created', 'Created handoff request.', [
                            'uuid' => $created->uuid,
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('WorkerAgentRunOrchestrator action failed', [
                    'worker_agent_id' => $worker->id,
                    'run_id' => $run->id,
                    'type' => $type,
                    'exception' => $e->getMessage(),
                ]);
                $this->logEvent($run, WorkerAgentRunEventLevel::Error, 'action.failed', $e->getMessage(), [
                    'type' => $type,
                ]);
            }
        }

        $meta = [
            'config_version' => $worker->config_version,
            'capabilities' => $worker->capabilities ?? [],
            'goal_ids' => $worker->organization_goal_ids ?? [],
            'proposals_created' => $proposalsCreated,
            'tasks_applied' => $tasksApplied,
            'handoffs_created' => $handoffsCreated,
            'llm_error' => $rawError,
        ];

        $run->update([
            'status' => 'completed',
            'finished_at' => now(),
            'summary' => $summary,
            'metadata' => $meta,
        ]);
    }

    /**
     * @param  array<string, mixed>  $action
     * @return array<string, mixed>
     */
    private function normalizeTaskPayload(array $action): array
    {
        $title = isset($action['title']) ? trim((string) $action['title']) : '';
        $description = isset($action['description']) ? (string) $action['description'] : '';
        $priority = isset($action['priority']) ? (string) $action['priority'] : 'medium';
        $assignee = $action['assignee_staff_id'] ?? null;

        return [
            'title' => $title !== '' ? $title : 'Follow-up',
            'description' => $description,
            'priority' => $priority,
            'assignee_staff_id' => $assignee !== null ? (int) $assignee : null,
        ];
    }

    /**
     * @param  array<string, mixed>  $action
     */
    private function createHandoffFromAction(WorkerAgent $worker, WorkerAgentRun $run, array $action): ?WorkerAgentHandoff
    {
        $tenantId = (string) $worker->tenant_id;

        $toId = isset($action['to_worker_agent_id']) ? (int) $action['to_worker_agent_id'] : 0;
        if ($toId <= 0 || $toId === $worker->id) {
            return null;
        }

        $target = WorkerAgent::query()
            ->where('tenant_id', $worker->tenant_id)
            ->whereKey($toId)
            ->first();
        if ($target === null) {
            return null;
        }

        $taskId = null;
        if (isset($action['hr_task_id']) && $action['hr_task_id'] !== null) {
            $tid = (int) $action['hr_task_id'];
            $ok = Task::query()
                ->where('tenant_id', $worker->tenant_id)
                ->whereKey($tid)
                ->exists();
            if ($ok) {
                $taskId = $tid;
            }
        }

        $message = isset($action['message']) ? trim((string) $action['message']) : '';

        return DB::transaction(function () use ($worker, $run, $target, $taskId, $message, $tenantId) {
            $handoff = WorkerAgentHandoff::query()->create([
                'tenant_id' => $tenantId,
                'from_worker_agent_id' => $worker->id,
                'to_worker_agent_id' => $target->id,
                'hr_task_id' => $taskId,
                'message' => $message !== '' ? $message : null,
                'status' => WorkerAgentHandoffStatus::Pending,
                'worker_agent_run_id' => $run->id,
            ]);

            $body = 'Handoff from '.$worker->name.' to '.$target->name.'.'
                .($message !== '' ? "\n\n".$message : '');

            WorkerAgentMessage::query()->create([
                'tenant_id' => $tenantId,
                'worker_agent_id' => $target->id,
                'worker_agent_run_id' => $run->id,
                'role' => WorkerAgentMessageRole::Handoff,
                'body' => $body,
                'metadata' => [
                    'handoff_uuid' => $handoff->uuid,
                    'from_worker_agent_uuid' => $worker->uuid,
                ],
            ]);

            return $handoff;
        });
    }

    private function logEvent(
        WorkerAgentRun $run,
        WorkerAgentRunEventLevel $level,
        string $eventType,
        string $message,
        ?array $context = null,
    ): void {
        WorkerAgentRunEvent::query()->create([
            'tenant_id' => $run->tenant_id,
            'worker_agent_run_id' => $run->id,
            'level' => $level,
            'event_type' => $eventType,
            'message' => $message,
            'context' => $context,
        ]);
    }

    private function appendMessage(
        WorkerAgent $worker,
        WorkerAgentRun $run,
        WorkerAgentMessageRole $role,
        string $body,
    ): void {
        WorkerAgentMessage::query()->create([
            'tenant_id' => $worker->tenant_id,
            'worker_agent_id' => $worker->id,
            'worker_agent_run_id' => $run->id,
            'role' => $role,
            'body' => $body,
        ]);
    }
}
