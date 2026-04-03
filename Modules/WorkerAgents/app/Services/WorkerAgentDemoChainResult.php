<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Services;

use Modules\HR\Models\OrganizationGoal;
use Modules\HR\Models\Staff;
use Modules\WorkerAgents\Models\WorkerAgent;

final class WorkerAgentDemoChainResult
{
    public function __construct(
        public readonly OrganizationGoal $goal,
        public readonly Staff $human,
        public readonly WorkerAgent $lead,
        public readonly WorkerAgent $specialist,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toSessionPayload(bool $runQueued): array
    {
        return [
            'goal_id' => $this->goal->id,
            'goal_title' => $this->goal->title,
            'human_staff_id' => $this->human->id,
            'human_employee_id' => $this->human->employee_id,
            'lead' => [
                'id' => $this->lead->id,
                'uuid' => $this->lead->uuid,
                'name' => $this->lead->name,
            ],
            'specialist' => [
                'id' => $this->specialist->id,
                'uuid' => $this->specialist->uuid,
                'name' => $this->specialist->name,
            ],
            'run_queued' => $runQueued,
        ];
    }
}
