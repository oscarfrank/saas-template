<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Support;

/**
 * Machine-readable gates for tools and prompts (extend as features ship).
 */
enum WorkerAgentCapability: string
{
    case CalendarRead = 'calendar.read';
    case CalendarWrite = 'calendar.write';
    case HrStaffRead = 'hr.staff.read';
    case HrTasksRead = 'hr.tasks.read';
    case HrTasksCreate = 'hr.tasks.create';
    case HrTasksAssign = 'hr.tasks.assign';
    case WorkersRead = 'workers.read';
    case WorkersTrigger = 'workers.trigger';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
