<?php

declare(strict_types=1);

namespace Modules\WorkerAgents\Support;

use Cron\CronExpression;

/**
 * Converts friendly schedule inputs into a 5-field cron string for {@see DispatchDueWorkerAgentsCommand}.
 * Times are interpreted in {@see WorkerAgent::$schedule_timezone} by the cron isDue check.
 */
final class WorkerAgentScheduleCron
{
    public static function toCronExpression(
        WorkerAgentScheduleKind|string $kind,
        ?string $scheduleTime,
        ?int $dayOfWeek,
        ?string $customCron,
    ): ?string {
        $k = $kind instanceof WorkerAgentScheduleKind ? $kind : WorkerAgentScheduleKind::tryFrom((string) $kind) ?? WorkerAgentScheduleKind::Off;

        return match ($k) {
            WorkerAgentScheduleKind::Off => null,
            WorkerAgentScheduleKind::Hourly => '0 * * * *',
            WorkerAgentScheduleKind::Daily => self::dailyCron($scheduleTime),
            WorkerAgentScheduleKind::Weekly => self::weeklyCron($scheduleTime, $dayOfWeek),
            WorkerAgentScheduleKind::Custom => self::normalizeCustom($customCron),
        };
    }

    public static function assertValidCron(?string $cron): void
    {
        if ($cron === null || $cron === '') {
            return;
        }
        CronExpression::factory($cron);
    }

    private static function dailyCron(?string $time): string
    {
        if ($time === null || trim($time) === '') {
            $time = '09:00';
        }
        [$h, $m] = self::parseTime($time);

        return sprintf('%d %d * * *', $m, $h);
    }

    private static function weeklyCron(?string $time, ?int $dayOfWeek): string
    {
        if ($time === null || trim($time) === '') {
            $time = '09:00';
        }
        $dow = $dayOfWeek ?? 1;
        $dow = max(0, min(6, $dow));
        [$h, $m] = self::parseTime($time);

        return sprintf('%d %d * * %d', $m, $h, $dow);
    }

    /**
     * @return array{0: int, 1: int} hour, minute
     */
    private static function parseTime(string $time): array
    {
        $time = trim($time);
        $parts = explode(':', $time);
        $h = (int) ($parts[0] ?? 9);
        $m = (int) ($parts[1] ?? 0);
        $h = max(0, min(23, $h));
        $m = max(0, min(59, $m));

        return [$h, $m];
    }

    private static function normalizeCustom(?string $cron): ?string
    {
        $c = $cron !== null ? trim($cron) : '';

        return $c === '' ? null : $c;
    }

    /**
     * Short label for dashboards (timezone is the worker's {@see WorkerAgent::$schedule_timezone}).
     */
    public static function describe(
        WorkerAgentScheduleKind|string $kind,
        ?string $scheduleTime,
        ?int $dayOfWeek,
        ?string $cron,
        string $timezone,
    ): string {
        $k = $kind instanceof WorkerAgentScheduleKind ? $kind : WorkerAgentScheduleKind::tryFrom((string) $kind) ?? WorkerAgentScheduleKind::Off;

        return match ($k) {
            WorkerAgentScheduleKind::Off => 'No schedule (manual runs only)',
            WorkerAgentScheduleKind::Hourly => 'Every hour at :00',
            WorkerAgentScheduleKind::Daily => 'Daily at '.($scheduleTime !== null && $scheduleTime !== '' ? $scheduleTime : '09:00').' ('.$timezone.')',
            WorkerAgentScheduleKind::Weekly => 'Weekly on '.self::weekdayLabel($dayOfWeek).' at '.($scheduleTime !== null && $scheduleTime !== '' ? $scheduleTime : '09:00').' ('.$timezone.')',
            WorkerAgentScheduleKind::Custom => $cron !== null && $cron !== '' ? 'Custom: '.$cron : 'Custom cron',
        };
    }

    private static function weekdayLabel(?int $dow): string
    {
        $dow = $dow ?? 1;
        $labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        return $labels[$dow] ?? 'Monday';
    }
}
