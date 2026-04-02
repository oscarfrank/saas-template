<?php

declare(strict_types=1);

namespace Modules\Cortex\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Modules\Cortex\Support\CortexAgentKey;
use Modules\Cortex\Support\CortexLlmModelCatalog;
use Modules\Cortex\Support\CortexLlmProvider;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;
use Stancl\Tenancy\Database\TenantScope;

class CortexAgentLlmSetting extends Model
{
    use BelongsToTenant;

    protected $table = 'cortex_agent_llm_settings';

    protected $fillable = [
        'tenant_id',
        'agent_key',
        'llm_provider',
        'chat_model',
    ];

    protected function casts(): array
    {
        return [
            'llm_provider' => CortexLlmProvider::class,
        ];
    }

    /**
     * Query by explicit tenant id without stacking Stancl's {@see TenantScope} on top.
     *
     * When tenancy is initialized, the global scope adds another tenant_id constraint; combining
     * it with an explicit where can yield zero rows if the scope key ever diverges (e.g. queue workers).
     */
    public static function queryForTenant(string $tenantId): Builder
    {
        return static::query()
            ->withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId);
    }

    public static function resolvedProviderFor(string $tenantId, CortexAgentKey|string $agentKey): CortexLlmProvider
    {
        $key = $agentKey instanceof CortexAgentKey ? $agentKey->value : $agentKey;

        $row = static::queryForTenant($tenantId)
            ->where('agent_key', $key)
            ->first();

        return $row?->llm_provider ?? CortexLlmProvider::OpenAI;
    }

    /**
     * @return array<string, mixed>
     */
    public static function inertiaPropsFor(
        string $tenantId,
        CortexAgentKey|string $agentKey,
        bool $openaiKeyConfigured,
        bool $anthropicKeyConfigured,
    ): array {
        $key = $agentKey instanceof CortexAgentKey ? $agentKey->value : $agentKey;

        $row = static::queryForTenant($tenantId)
            ->where('agent_key', $key)
            ->first();

        $provider = $row?->llm_provider ?? CortexLlmProvider::OpenAI;
        $chatModel = $row !== null ? $row->chat_model : null;
        $chatModelStr = is_string($chatModel) && $chatModel !== '' ? $chatModel : null;

        $ready = match ($provider) {
            CortexLlmProvider::OpenAI => $openaiKeyConfigured,
            CortexLlmProvider::Anthropic => $anthropicKeyConfigured,
        };

        $legacyOpenAi = $provider === CortexLlmProvider::OpenAI ? $chatModelStr : null;
        $legacyAnthropic = $provider === CortexLlmProvider::Anthropic ? $chatModelStr : null;

        return [
            'agent_key' => $key,
            'llm_provider' => $provider->value,
            'chat_model' => $chatModelStr,
            'default_openai_model' => (string) config('openai.chat_model', 'gpt-4o-mini'),
            'default_anthropic_model' => (string) config('anthropic.chat_model', 'claude-sonnet-4-20250514'),
            'openai_key_configured' => $openaiKeyConfigured,
            'anthropic_key_configured' => $anthropicKeyConfigured,
            'llm_ready' => $ready,
            'openai_model_options' => CortexLlmModelCatalog::optionsForProviderWithLegacy(
                CortexLlmProvider::OpenAI,
                $legacyOpenAi,
            ),
            'anthropic_model_options' => CortexLlmModelCatalog::optionsForProviderWithLegacy(
                CortexLlmProvider::Anthropic,
                $legacyAnthropic,
            ),
        ];
    }
}
