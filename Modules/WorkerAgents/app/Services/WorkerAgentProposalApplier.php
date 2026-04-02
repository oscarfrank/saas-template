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

        return Task::query()->create([
            'tenant_id' => $tenantId,
            'title' => $title,
            'description' => $description !== '' ? $description : null,
            'status' => 'todo',
            'priority' => $priority,
            'assigned_to' => $assigneeId,
        ]);
    }
}
