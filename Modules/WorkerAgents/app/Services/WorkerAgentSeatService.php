<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Services;

use Illuminate\Support\Facades\DB;
use Modules\HR\Models\Staff;
use Modules\WorkerAgents\Models\WorkerAgent;
use Modules\WorkerAgents\Support\WorkerAgentCapability;
use Modules\WorkerAgents\Support\WorkerAgentInputScope;

final class WorkerAgentSeatService
{
    /**
     * Create an HR staff seat (kind=agent) and the worker agent configuration.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(string $tenantId, array $attributes): WorkerAgent
    {
        return DB::transaction(function () use ($tenantId, $attributes): WorkerAgent {
            $employeeId = 'WA-'.substr((string) \Illuminate\Support\Str::uuid(), 0, 8);

            $staff = Staff::query()->create([
                'tenant_id' => $tenantId,
                'kind' => 'agent',
                'user_id' => null,
                'reports_to_staff_id' => $attributes['reports_to_staff_id'] ?? null,
                'employee_id' => $employeeId,
                'department' => $attributes['department'] ?? 'Automation',
                'job_title' => $attributes['name'],
                'started_at' => now()->toDateString(),
            ]);

            return WorkerAgent::query()->create([
                'tenant_id' => $tenantId,
                'staff_id' => $staff->id,
                'name' => $attributes['name'],
                'skills' => $attributes['skills'] ?? null,
                'capabilities' => $this->normalizeCapabilities($attributes['capabilities'] ?? []),
                'organization_goal_ids' => $this->normalizeGoalIds($attributes['organization_goal_ids'] ?? []),
                'schedule_kind' => $attributes['schedule_kind'] ?? 'off',
                'schedule_time' => $attributes['schedule_time'] ?? null,
                'schedule_day_of_week' => $attributes['schedule_day_of_week'] ?? null,
                'schedule_cron' => $attributes['schedule_cron'] ?? null,
                'schedule_timezone' => $attributes['schedule_timezone'] ?? 'UTC',
                'input_scope' => $attributes['input_scope'] ?? WorkerAgentInputScope::AllWorkers->value,
                'input_worker_agent_ids' => $attributes['input_worker_agent_ids'] ?? null,
                'input_project_ids' => $attributes['input_project_ids'] ?? null,
                'automation_enabled' => (bool) ($attributes['automation_enabled'] ?? true),
                'requires_approval' => (bool) ($attributes['requires_approval'] ?? false),
                'max_runs_per_hour' => $attributes['max_runs_per_hour'] ?? null,
                'daily_llm_budget_cents' => $attributes['daily_llm_budget_cents'] ?? null,
                'enabled' => (bool) ($attributes['enabled'] ?? true),
                'llm_provider' => $attributes['llm_provider'] ?? 'openai',
                'chat_model' => $attributes['chat_model'] ?? null,
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(WorkerAgent $worker, array $attributes): WorkerAgent
    {
        return DB::transaction(function () use ($worker, $attributes): WorkerAgent {
            if (isset($attributes['name'])) {
                $worker->name = $attributes['name'];
                $worker->staff?->update(['job_title' => $attributes['name']]);
            }

            if (array_key_exists('reports_to_staff_id', $attributes)) {
                $worker->staff?->update(['reports_to_staff_id' => $attributes['reports_to_staff_id']]);
            }

            $fields = [
                'skills', 'capabilities', 'organization_goal_ids',
                'schedule_kind', 'schedule_time', 'schedule_day_of_week', 'schedule_cron', 'schedule_timezone',
                'input_scope', 'input_worker_agent_ids', 'input_project_ids', 'automation_enabled',
                'requires_approval', 'max_runs_per_hour', 'daily_llm_budget_cents', 'enabled',
                'llm_provider', 'chat_model',
            ];

            foreach ($fields as $field) {
                if (! array_key_exists($field, $attributes)) {
                    continue;
                }
                $value = $attributes[$field];
                if ($field === 'capabilities') {
                    $worker->capabilities = $this->normalizeCapabilities(is_array($value) ? $value : []);
                } elseif ($field === 'organization_goal_ids') {
                    $worker->organization_goal_ids = $this->normalizeGoalIds(is_array($value) ? $value : []);
                } else {
                    $worker->{$field} = $value;
                }
            }

            $worker->config_version = (int) $worker->config_version + 1;
            $worker->save();

            return $worker->fresh(['staff']);
        });
    }

    public function delete(WorkerAgent $worker): void
    {
        DB::transaction(function () use ($worker): void {
            $staff = $worker->staff;
            $worker->delete();
            $staff?->delete();
        });
    }

    /**
     * @param  list<string|int>  $ids
     * @return list<int>
     */
    private function normalizeGoalIds(array $ids): array
    {
        $out = [];
        foreach ($ids as $id) {
            $i = (int) $id;
            if ($i > 0) {
                $out[] = $i;
            }
        }

        return array_values(array_unique($out));
    }

    /**
     * @param  list<string>  $caps
     * @return list<string>
     */
    private function normalizeCapabilities(array $caps): array
    {
        $allowed = WorkerAgentCapability::values();
        $out = [];
        foreach ($caps as $c) {
            $s = is_string($c) ? $c : '';
            if (in_array($s, $allowed, true)) {
                $out[] = $s;
            }
        }

        return array_values(array_unique($out));
    }
}
