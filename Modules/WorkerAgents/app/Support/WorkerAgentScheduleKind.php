<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Support;

enum WorkerAgentScheduleKind: string
{
    case Off = 'off';
    case Hourly = 'hourly';
    case Daily = 'daily';
    case Weekly = 'weekly';
    case Custom = 'custom';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
