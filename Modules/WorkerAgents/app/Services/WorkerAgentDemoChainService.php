<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Services;

use Modules\HR\Models\OrganizationGoal;
use Modules\HR\Models\Staff;
use Modules\WorkerAgents\Models\WorkerAgent;
use Modules\WorkerAgents\Support\WorkerAgentInputScope;

/**
 * Seeds the multi-agent demo: org goal, demo human staff, lead + specialist workers.
 * Used by {@see \Modules\WorkerAgents\Console\DemoChainWorkerAgentsCommand} and the web UI.
 */
final class WorkerAgentDemoChainService
{
    public const GOAL_TITLE = 'Demo: Multi-agent chain (lead → specialist → human)';

    public const LEAD_NAME = 'Demo Chain — Lead Analyst';

    public const SPECIALIST_NAME = 'Demo Chain — Specialist';

    public const DEMO_HUMAN_EMPLOYEE_ID = 'DEMO-CAL-HUMAN';

    public function __construct(
        private readonly WorkerAgentSeatService $seatService,
    ) {}

    public function prepare(string $tenantId): WorkerAgentDemoChainResult
    {
        $goal = $this->ensureGoal($tenantId);
        $human = $this->ensureHumanStaff($tenantId);

        $specialist = $this->ensureWorker(
            $tenantId,
            self::SPECIALIST_NAME,
            $goal->id,
            $this->specialistSkills($human->id),
        );

        $lead = $this->ensureWorker(
            $tenantId,
            self::LEAD_NAME,
            $goal->id,
            $this->leadSkills($specialist->id),
        );

        return new WorkerAgentDemoChainResult(
            goal: $goal,
            human: $human,
            lead: $lead,
            specialist: $specialist,
        );
    }

    private function ensureGoal(string $tenantId): OrganizationGoal
    {
        $existing = OrganizationGoal::query()
            ->where('tenant_id', $tenantId)
            ->where('title', self::GOAL_TITLE)
            ->first();

        if ($existing !== null) {
            $existing->update([
                'description' => $this->goalDescription(),
                'status' => 'active',
            ]);

            return $existing->fresh();
        }

        return OrganizationGoal::query()->create([
            'tenant_id' => $tenantId,
            'title' => self::GOAL_TITLE,
            'description' => $this->goalDescription(),
            'status' => 'active',
            'sort_order' => 900,
        ]);
    }

    private function goalDescription(): string
    {
        return <<<'TXT'
Demonstrate a three-step automation chain:
1) Lead worker: understand the ask, create a short "analysis record" task on its own seat, then hand off to the specialist with auto_accept so the linked HR task moves to the specialist immediately.
2) Specialist worker: mark that work complete (task_complete) when done, then create a simple todo for a human to put something on the calendar (task_create with assignee_staff_id for the demo human staff).
3) Human: sees an open todo in HR → Tasks.

Use only the JSON actions the system supports (task_create, handoff_request with auto_accept when appropriate, task_complete). Prefer one handoff to the specialist worker listed in peer_worker_agents.
TXT;
    }

    private function ensureHumanStaff(string $tenantId): Staff
    {
        $existing = Staff::query()
            ->where('tenant_id', $tenantId)
            ->where('employee_id', self::DEMO_HUMAN_EMPLOYEE_ID)
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        return Staff::query()->create([
            'tenant_id' => $tenantId,
            'kind' => 'human',
            'user_id' => null,
            'employee_id' => self::DEMO_HUMAN_EMPLOYEE_ID,
            'job_title' => 'Calendar owner (demo)',
            'started_at' => now()->toDateString(),
        ]);
    }

    private function ensureWorker(
        string $tenantId,
        string $name,
        int $goalId,
        string $skills,
    ): WorkerAgent {
        $existing = WorkerAgent::query()
            ->where('tenant_id', $tenantId)
            ->where('name', $name)
            ->first();

        if ($existing !== null) {
            $existing->update([
                'skills' => $skills,
                'organization_goal_ids' => [$goalId],
                'requires_approval' => false,
                'automation_enabled' => true,
                'enabled' => true,
                'paused_at' => null,
                'input_scope' => WorkerAgentInputScope::AllWorkers->value,
            ]);

            return $existing->fresh();
        }

        return $this->seatService->create($tenantId, [
            'name' => $name,
            'skills' => $skills,
            'organization_goal_ids' => [$goalId],
            'requires_approval' => false,
            'automation_enabled' => true,
            'enabled' => true,
            'input_scope' => WorkerAgentInputScope::AllWorkers->value,
        ]);
    }

    private function leadSkills(int $specialistWorkerAgentId): string
    {
        return <<<TXT
You are the LEAD analyst for this demo.

Goal: satisfy the linked organization goal using supported JSON actions only.

Steps to perform in ONE run when appropriate:
1) task_create — short title like "Analysis record (demo)" summarizing your plan; keep it on your own seat (default assignee).
2) handoff_request — set to_worker_agent_id to {$specialistWorkerAgentId} (the Demo Chain specialist). Set auto_accept to true. Omit hr_task_id so the handoff attaches to the task you just created in this same response. Add a brief message instructing the specialist to complete the work and then create a human calendar todo.

Do not assign the calendar task to the human yourself — the specialist does that after task_complete.
TXT;
    }

    private function specialistSkills(int $humanStaffId): string
    {
        return <<<TXT
You are the SPECIALIST for this demo.

When you run, you should see open_tasks_assigned_to_my_seat after a lead handoff (auto_accept). Then:
1) task_complete — use the hr_task_id from open_tasks_assigned_to_my_seat when the work is logically done; add a short note.
2) task_create — title like "Calendar: schedule review (demo)" with assignee_staff_id {$humanStaffId} (the demo human) so they get a normal todo to add to their calendar.

Use human_staff_for_delegation in the prompt to confirm the staff id if needed.
TXT;
    }
}
