<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\TenantAiPrompt;
use Illuminate\Support\Facades\Cache;

final class TenantAiPromptResolver
{
    private const CACHE_TTL_SECONDS = 60;

    /**
     * Resolve prompt text: tenant override, else config default. Replace {{var}} placeholders.
     */
    public function resolve(?string $tenantId, string $key, array $variables = []): string
    {
        $raw = $this->rawForKey($tenantId, $key);
        foreach ($variables as $name => $value) {
            $raw = str_replace('{{'.$name.'}}', (string) $value, $raw);
        }

        return $raw;
    }

    /**
     * Unsubstituted body for admin UI (override text or default).
     */
    public function rawForKey(?string $tenantId, string $key): string
    {
        $definitions = config('ai_prompts.definitions', []);
        $default = $definitions[$key]['default'] ?? '';

        if ($tenantId === null || $tenantId === '') {
            return $default;
        }

        $cacheKey = 'tenant_ai_prompt:'.$tenantId.':'.$key;
        $override = Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($tenantId, $key) {
            return TenantAiPrompt::query()
                ->where('tenant_id', $tenantId)
                ->where('key', $key)
                ->value('system_prompt');
        });

        return $override !== null && $override !== '' ? $override : $default;
    }

    public function forgetCache(string $tenantId, string $key): void
    {
        Cache::forget('tenant_ai_prompt:'.$tenantId.':'.$key);
    }

    public function isBuiltinKey(string $key): bool
    {
        return array_key_exists($key, config('ai_prompts.definitions', []));
    }

    public function isValidCustomKey(string $key): bool
    {
        $prefix = (string) config('ai_prompts.custom_key_prefix', 'custom.');
        if (! str_starts_with($key, $prefix)) {
            return false;
        }
        $slug = substr($key, strlen($prefix));

        return (bool) preg_match('/^[a-z0-9_-]{1,80}$/', $slug);
    }
}
