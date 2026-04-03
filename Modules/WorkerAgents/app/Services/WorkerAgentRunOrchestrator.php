<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\HR\Models\Task;
use Modules\WorkerAgents\Jobs\RunWorkerAgentJob;
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
        $memories = $this->llm->memoriesForWorker($worker);
        $planning = $this->llm->planningContextForWorker($worker);
        $plan = $this->llm->plan($worker, array_merge([
            'trigger' => $run->trigger,
            'goals' => $goals,
            'memories' => $memories,
        ], $planning));

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
        $tasksCompleted = 0;
        $handoffFollowupsDispatched = 0;
        $lastCreatedTaskId = null;

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
                        $createdTask = $this->applier->applyTaskCreate($worker, $payload);
                        $tasksApplied++;
                        $lastCreatedTaskId = $createdTask->id;
                        $this->logEvent($run, WorkerAgentRunEventLevel::Info, 'task.created', 'Created HR task.', [
                            'title' => $payload['title'] ?? '',
                            'hr_task_id' => $createdTask->id,
                        ]);
                    }
                } elseif ($type === 'handoff_request') {
                    [$created, $dispatchedFollowup] = $this->createHandoffFromAction($worker, $run, $action, $lastCreatedTaskId);
                    if ($created !== null) {
                        $handoffsCreated++;
                        if ($dispatchedFollowup) {
                            $handoffFollowupsDispatched++;
                        }
                        $this->logEvent($run, WorkerAgentRunEventLevel::Info, 'handoff.created', 'Created handoff request.', [
                            'uuid' => $created->uuid,
                            'auto_accept' => $dispatchedFollowup,
                        ]);
                    }
                } elseif ($type === 'task_complete') {
                    $payload = $this->normalizeTaskCompletePayload($action);
                    $this->applier->applyTaskComplete($worker, $payload);
                    $tasksCompleted++;
                    $this->logEvent($run, WorkerAgentRunEventLevel::Info, 'task.completed', 'Marked HR task done.', [
                        'hr_task_id' => $payload['hr_task_id'] ?? null,
                    ]);
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
            'tasks_completed' => $tasksCompleted,
            'handoffs_created' => $handoffsCreated,
            'handoff_followups_dispatched' => $handoffFollowupsDispatched,
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
     * @return array{hr_task_id: int, note?: string}
     */
    private function normalizeTaskCompletePayload(array $action): array
    {
        $hrTaskId = isset($action['hr_task_id']) ? (int) $action['hr_task_id'] : 0;
        $note = isset($action['note']) ? trim((string) $action['note']) : '';

        $out = ['hr_task_id' => $hrTaskId];
        if ($note !== '') {
            $out['note'] = $note;
        }

        return $out;
    }

    /**
     * @return array{0: WorkerAgentHandoff|null, 1: bool}
     */
    private function createHandoffFromAction(WorkerAgent $worker, WorkerAgentRun $run, array $action, ?int $lastCreatedTaskId): array
    {
        $tenantId = (string) $worker->tenant_id;

        $toId = isset($action['to_worker_agent_id']) ? (int) $action['to_worker_agent_id'] : 0;
        if ($toId <= 0 || $toId === $worker->id) {
            return [null, false];
        }

        $target = WorkerAgent::query()
            ->where('tenant_id', $worker->tenant_id)
            ->whereKey($toId)
            ->first();
        if ($target === null) {
            return [null, false];
        }

        $autoAccept = isset($action['auto_accept']) && filter_var($action['auto_accept'], FILTER_VALIDATE_BOOLEAN);

        $taskId = null;
        if (isset($action['hr_task_id']) && $action['hr_task_id'] !== null && $action['hr_task_id'] !== '') {
            $tid = (int) $action['hr_task_id'];
            $ok = Task::query()
                ->where('tenant_id', $worker->tenant_id)
                ->whereKey($tid)
                ->exists();
            if ($ok) {
                $taskId = $tid;
            }
        } elseif ($lastCreatedTaskId !== null) {
            $taskId = $lastCreatedTaskId;
        }

        $message = isset($action['message']) ? trim((string) $action['message']) : '';

        $handoff = DB::transaction(function () use ($worker, $run, $target, $taskId, $message, $tenantId, $autoAccept) {
            $handoff = WorkerAgentHandoff::query()->create([
                'tenant_id' => $tenantId,
                'from_worker_agent_id' => $worker->id,
                'to_worker_agent_id' => $target->id,
                'hr_task_id' => $taskId,
                'message' => $message !== '' ? $message : null,
                'status' => WorkerAgentHandoffStatus::Pending,
                'worker_agent_run_id' => $run->id,
            ]);

            if ($autoAccept) {
                $handoff->update([
                    'status' => WorkerAgentHandoffStatus::Accepted,
                    'resolved_at' => now(),
                    'resolved_by_user_id' => null,
                ]);
                if ($taskId !== null && $target->staff_id !== null) {
                    Task::query()
                        ->where('tenant_id', $tenantId)
                        ->whereKey($taskId)
                        ->update(['assigned_to' => $target->staff_id]);
                }
            }

            $body = 'Handoff from '.$worker->name.' to '.$target->name.'.'
                .($message !== '' ? "\n\n".$message : '')
                .($autoAccept ? "\n\n(Auto-accepted for agent-to-agent flow.)" : '');

            WorkerAgentMessage::query()->create([
                'tenant_id' => $tenantId,
                'worker_agent_id' => $target->id,
                'worker_agent_run_id' => $run->id,
                'role' => WorkerAgentMessageRole::Handoff,
                'body' => $body,
                'metadata' => [
                    'handoff_uuid' => $handoff->uuid,
                    'from_worker_agent_uuid' => $worker->uuid,
                    'auto_accept' => $autoAccept,
                ],
            ]);

            return $handoff;
        });

        if ($autoAccept) {
            RunWorkerAgentJob::dispatch($tenantId, $target->id, 'handoff_followup');
        }

        return [$handoff, $autoAccept];
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
