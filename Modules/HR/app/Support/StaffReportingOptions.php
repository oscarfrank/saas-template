<?php

declare(strict_types=1);

namespace Modules\HR\Support;

use Modules\HR\Models\Staff;

/**
 * Builds "Reports to" dropdown options for any staff row (humans and worker-agent seats).
 */
final class StaffReportingOptions
{
    /**
     * @return list<array{id: int, label: string, kind: string}>
     */
    public static function forTenant(string $tenantId, ?int $exceptStaffId = null): array
    {
        $q = Staff::query()
            ->where('tenant_id', $tenantId)
            ->with(['user:id,first_name,last_name,email']);

        if ($exceptStaffId !== null) {
            $q->where('id', '!=', $exceptStaffId);
        }

        return $q->orderBy('job_title')
            ->get()
            ->map(fn (Staff $s) => [
                'id' => $s->id,
                'label' => self::label($s),
                'kind' => $s->kind,
            ])
            ->values()
            ->all();
    }

    private static function label(Staff $s): string
    {
        $kindLabel = $s->kind === 'agent' ? 'Worker agent' : 'Staff';

        if ($s->user) {
            $n = trim(($s->user->first_name ?? '').' '.($s->user->last_name ?? ''));
            $name = $n !== '' ? $n : (string) ($s->user->email ?? '');

            return $name.' · '.($s->job_title ?? $kindLabel);
        }

        return ($s->job_title ?? 'Seat').' · '.$kindLabel;
    }
}
