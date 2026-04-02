/** Matches {@see Modules\WorkerAgents\Support\WorkerAgentScheduleKind} */
export const SCHEDULE_KIND_OPTIONS: { value: string; label: string }[] = [
    { value: 'off', label: 'No automatic schedule (manual “Run now” only)' },
    { value: 'hourly', label: 'Every hour (at minute :00)' },
    { value: 'daily', label: 'Once per day' },
    { value: 'weekly', label: 'Once per week' },
    { value: 'custom', label: 'Advanced — custom cron' },
];

/** 0 = Sunday … 6 = Saturday (matches server cron day-of-week). */
export const WEEKDAY_OPTIONS: { value: string; label: string }[] = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
];
