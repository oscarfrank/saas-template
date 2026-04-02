<?php

declare(strict_types=1);

namespace Modules\Cortex\Support;

/**
 * Curated model IDs for Cortex LLM settings (OpenAI / Anthropic Messages API).
 *
 * @see https://developers.openai.com/api/docs/pricing
 * @see https://platform.claude.com/docs/en/about-claude/pricing
 */
final class CortexLlmModelCatalog
{
    /**
     * @return list<array{id: string, label: string}>
     */
    public static function optionsFor(CortexLlmProvider $provider): array
    {
        $key = $provider === CortexLlmProvider::OpenAI ? 'openai' : 'anthropic';

        /** @var array<int, array{id: string, label: string}> $opts */
        $opts = config('cortex.llm_model_options.'.$key, []);

        return $opts;
    }

    /**
     * @return list<string>
     */
    public static function allowedIdsFor(CortexLlmProvider $provider): array
    {
        return array_column(self::optionsFor($provider), 'id');
    }

    /**
     * Catalog entries plus one extra row when the stored model is not in the catalog (legacy / custom).
     *
     * @return list<array{id: string, label: string}>
     */
    public static function optionsForProviderWithLegacy(CortexLlmProvider $provider, ?string $currentModel): array
    {
        $base = self::optionsFor($provider);
        if ($currentModel === null || $currentModel === '') {
            return $base;
        }
        foreach ($base as $opt) {
            if ($opt['id'] === $currentModel) {
                return $base;
            }
        }

        return array_merge($base, [['id' => $currentModel, 'label' => $currentModel.' (legacy)']]);
    }
}
