<?php

declare(strict_types=1);

namespace Modules\Cortex\Support;

enum MirageImageProvider: string
{
    // Active provider values
    case OpenAi = 'openai';
    case Midjourney = 'midjourney';
    // Legacy values kept for backward compatibility with pre-migration rows
    case DallE3 = 'dall_e_3';
    case GptImage1 = 'gpt_image_1';

    public function label(): string
    {
        return match ($this) {
            self::OpenAi => 'OpenAI',
            self::Midjourney => 'Midjourney (HTTP API)',
            self::DallE3 => 'DALL·E 3 (legacy)',
            self::GptImage1 => 'GPT Image 1 (legacy)',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::OpenAi => 'OpenAI Images API — choose DALL·E 3 or GPT Image model.',
            self::Midjourney => 'Your Midjourney-compatible API — set MIDJOURNEY_API_URL (and optional key) in .env.',
            self::DallE3 => 'Legacy provider value. Migrate to OpenAI + DALL·E 3 model.',
            self::GptImage1 => 'Legacy provider value. Migrate to OpenAI + GPT Image model.',
        };
    }

    public function isOpenAi(): bool
    {
        return $this === self::OpenAi || $this === self::DallE3 || $this === self::GptImage1;
    }

    /**
     * @return list<array{value: string, label: string, description: string}>
     */
    public static function optionsForInertia(): array
    {
        $activeCases = [self::OpenAi, self::Midjourney];
        $out = [];
        foreach ($activeCases as $case) {
            $out[] = [
                'value' => $case->value,
                'label' => $case->label(),
                'description' => $case->description(),
            ];
        }

        return $out;
    }
}
