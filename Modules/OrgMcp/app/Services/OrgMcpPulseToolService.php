<?php

declare(strict_types=1);

namespace Modules\OrgMcp\Services;

use Modules\Cortex\Models\PulseDailyDigest;
use Modules\Cortex\Models\PulseSetting;

final class OrgMcpPulseToolService
{
    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function getDigest(string $tenantId, int $profileUserId, array $input): array
    {
        if ($profileUserId <= 0) {
            throw new \RuntimeException(
                'Pulse digest requires profile_user_id. Create your org-mcp session with profile_user_id set to the Laravel user id.'
            );
        }

        $tz = $this->pulseTimezone($tenantId);
        $daysAgo = $this->resolveDaysAgo($input, $tz);
        if ($daysAgo < 0 || $daysAgo > 6) {
            throw new \RuntimeException('Pulse digest date must be within the last 7 days (today to 6 days ago).');
        }

        $digestDate = now($tz)->subDays($daysAgo)->toDateString();
        $sections = $this->resolveSections($input);
        $includeIntro = ! array_key_exists('include_intro_summary', $input) || (bool) $input['include_intro_summary'];

        $digest = PulseDailyDigest::query()
            ->where('tenant_id', $tenantId)
            ->whereDate('digest_date', $digestDate)
            ->first();

        $result = [
            'tenant_id' => $tenantId,
            'profile_user_id' => $profileUserId,
            'digest_date' => $digestDate,
            'days_ago' => $daysAgo,
            'found' => $digest !== null,
            'sections' => $sections,
            'intro_summary' => null,
            'tweets' => [],
            'shorts' => [],
            'youtube' => [],
            'meta' => null,
        ];

        if ($digest === null) {
            return $result;
        }

        if ($includeIntro) {
            $result['intro_summary'] = is_string($digest->intro_summary) ? $digest->intro_summary : null;
        }

        if (in_array('tweets', $sections, true)) {
            $result['tweets'] = is_array($digest->tweets) ? $digest->tweets : [];
        }
        if (in_array('shorts', $sections, true)) {
            $result['shorts'] = is_array($digest->shorts) ? $digest->shorts : [];
        }
        if (in_array('youtube', $sections, true)) {
            $result['youtube'] = is_array($digest->youtube) ? $digest->youtube : [];
        }

        $result['meta'] = [
            'feeds_status' => $digest->feeds_status,
            'ideas_status' => $digest->ideas_status,
            'feeds_refreshed_at' => $digest->feeds_refreshed_at?->toIso8601String(),
            'ideas_generated_at' => $digest->ideas_generated_at?->toIso8601String(),
            'feeds_error' => $digest->feeds_error,
            'ideas_error' => $digest->ideas_error,
        ];

        return $result;
    }

    /**
     * @param  array<string, mixed>  $input
     */
    private function resolveDaysAgo(array $input, string $tz): int
    {
        if (isset($input['date']) && is_string($input['date']) && trim($input['date']) !== '') {
            $date = trim($input['date']);
            if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                throw new \RuntimeException('Invalid date format. Use YYYY-MM-DD.');
            }

            $target = \Carbon\Carbon::createFromFormat('Y-m-d', $date, $tz)->startOfDay();
            $today = now($tz)->startOfDay();

            return $today->diffInDays($target, false) * -1;
        }

        if (array_key_exists('days_ago', $input)) {
            return (int) $input['days_ago'];
        }

        $when = strtolower(trim((string) ($input['when'] ?? 'today')));
        if ($when === '' || $when === 'today') {
            return 0;
        }
        if ($when === 'yesterday') {
            return 1;
        }
        if (preg_match('/^(\d+)\s+days?\s+ago$/', $when, $m) === 1) {
            return (int) $m[1];
        }

        throw new \RuntimeException('Invalid "when". Use today, yesterday, or "N days ago".');
    }

    /**
     * @param  array<string, mixed>  $input
     * @return list<string>
     */
    private function resolveSections(array $input): array
    {
        $allowed = ['tweets', 'shorts', 'youtube'];
        $raw = $input['sections'] ?? null;
        if (! is_array($raw) || $raw === []) {
            return $allowed;
        }

        $sections = [];
        foreach ($raw as $section) {
            $name = strtolower(trim((string) $section));
            if ($name === '') {
                continue;
            }
            if (! in_array($name, $allowed, true)) {
                throw new \RuntimeException('Invalid section. Allowed: tweets, shorts, youtube.');
            }
            $sections[] = $name;
        }

        $sections = array_values(array_unique($sections));
        if ($sections === []) {
            throw new \RuntimeException('sections cannot be empty when provided.');
        }

        return $sections;
    }

    private function pulseTimezone(string $tenantId): string
    {
        $setting = PulseSetting::query()->where('tenant_id', $tenantId)->first();

        if ($setting !== null && is_string($setting->digest_timezone) && $setting->digest_timezone !== '') {
            return $setting->digest_timezone;
        }

        return (string) config('app.timezone');
    }
}
