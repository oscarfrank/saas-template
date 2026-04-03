<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Services;

use Modules\HR\Models\Staff;
use Modules\HR\Models\Task;
use Modules\WorkerAgents\Models\WorkerAgent;

final class WorkerAgentProposalApplier
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function applyTaskCreate(WorkerAgent $worker, array $payload): Task
    {
        $tenantId = (string) $worker->tenant_id;
        $title = isset($payload['title']) ? trim((string) $payload['title']) : '';
        if ($title === '') {
            throw new \InvalidArgumentException('Task title is required.');
        }

        $description = isset($payload['description']) ? (string) $payload['description'] : null;
        $priority = isset($payload['priority']) ? (string) $payload['priority'] : 'medium';
        if (! in_array($priority, ['low', 'medium', 'high'], true)) {
            $priority = 'medium';
        }

        $assigneeId = $worker->staff_id;
        if (isset($payload['assignee_staff_id']) && $payload['assignee_staff_id'] !== null) {
            $candidate = (int) $payload['assignee_staff_id'];
            $ok = Staff::query()
                ->where('tenant_id', $tenantId)
                ->whereKey($candidate)
                ->exists();
            if ($ok) {
                $assigneeId = $candidate;
            }
        }

        $workerSeatId = $worker->staff_id;
        $delegatedToAnotherSeat = $workerSeatId !== null
            && $assigneeId !== null
            && (int) $assigneeId !== (int) $workerSeatId;

        if ($delegatedToAnotherSeat) {
            $status = 'todo';
            $completedAt = null;
        } elseif ($assigneeId !== null) {
            // Work attributed to the agent’s seat (or same seat): the run produced this outcome.
            $status = 'done';
            $completedAt = now();
        } else {
            $status = 'todo';
            $completedAt = null;
        }

        return Task::query()->create([
            'tenant_id' => $tenantId,
            'title' => $title,
            'description' => $description !== '' ? $description : null,
            'status' => $status,
            'priority' => $priority,
            'assigned_to' => $assigneeId,
            'completed_at' => $completedAt,
        ]);
    }

    /**
     * Mark an HR task done when it is assigned to this worker’s seat (e.g. after a handoff).
     *
     * @param  array<string, mixed>  $payload
     */
    public function applyTaskComplete(WorkerAgent $worker, array $payload): Task
    {
        $taskId = (int) ($payload['hr_task_id'] ?? 0);
        if ($taskId <= 0) {
            throw new \InvalidArgumentException('hr_task_id is required for task_complete.');
        }

        $tenantId = (string) $worker->tenant_id;

        $task = Task::query()
            ->where('tenant_id', $tenantId)
            ->whereKey($taskId)
            ->first();
        if ($task === null) {
            throw new \InvalidArgumentException('Task not found.');
        }

        if ($worker->staff_id === null) {
            throw new \InvalidArgumentException('Worker has no staff seat; cannot complete tasks on behalf of this agent.');
        }

        if ((int) $task->assigned_to !== (int) $worker->staff_id) {
            throw new \InvalidArgumentException('Task is not assigned to this worker’s seat.');
        }

        $note = isset($payload['note']) ? trim((string) $payload['note']) : '';
        $description = $task->description;
        if ($note !== '') {
            $suffix = '[Completed by worker agent] '.$note;
            $description = ($description !== null && $description !== '') ? $description."\n\n".$suffix : $suffix;
        }

        $task->update([
            'status' => 'done',
            'completed_at' => now(),
            'description' => $description,
        ]);

        return $task->fresh();
    }
}
