<?php

declare(strict_types=1);

namespace Modules\Cortex\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

class PulseDailyDigest extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'digest_date',
        'feeds_status',
        'ideas_status',
        'feeds_refreshed_at',
        'ideas_generated_at',
        'feeds_error',
        'ideas_error',
        'tweets',
        'shorts',
        'youtube',
        'intro_summary',
    ];

    protected function casts(): array
    {
        return [
            'digest_date' => 'date',
            'feeds_refreshed_at' => 'datetime',
            'ideas_generated_at' => 'datetime',
            'tweets' => 'array',
            'shorts' => 'array',
            'youtube' => 'array',
        ];
    }

    public static function todayForTenant(string $tenantId, ?string $timezone = null): ?self
    {
        $tz = $timezone ?: (string) config('app.timezone');
        $date = now($tz)->toDateString();

        /** @var self|null */
        return static::query()
            ->where('tenant_id', $tenantId)
            ->whereDate('digest_date', $date)
            ->first();
    }

    public static function getOrCreateForTenantDate(string $tenantId, string $dateYmd): self
    {
        $existing = static::query()
            ->where('tenant_id', $tenantId)
            ->whereDate('digest_date', $dateYmd)
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        try {
            /** @var self */
            return static::query()->create([
                'tenant_id' => $tenantId,
                'digest_date' => $dateYmd,
                'feeds_status' => 'pending',
                'ideas_status' => 'pending',
            ]);
        } catch (QueryException $e) {
            if (! static::isUniqueConstraintViolation($e)) {
                throw $e;
            }

            $retry = static::query()
                ->where('tenant_id', $tenantId)
                ->whereDate('digest_date', $dateYmd)
                ->first();

            if ($retry !== null) {
                return $retry;
            }

            throw $e;
        }
    }

    private static function isUniqueConstraintViolation(QueryException $e): bool
    {
        if ($e->getCode() === '23000') {
            return true;
        }

        $msg = $e->getMessage();

        return str_contains($msg, 'UNIQUE constraint')
            || str_contains($msg, 'Duplicate entry')
            || str_contains($msg, 'unique constraint');
    }
}
