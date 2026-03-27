<?php

declare(strict_types=1);

namespace Modules\Cortex\Support;

enum MirageImageProvider: string
{
    case DallE3 = 'dall_e_3';
    case GptImage1 = 'gpt_image_1';
    case Midjourney = 'midjourney';

    public function label(): string
    {
        return match ($this) {
            self::DallE3 => 'DALL·E 3',
            self::GptImage1 => 'GPT Image 1 (OpenAI)',
            self::Midjourney => 'Midjourney (HTTP API)',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::DallE3 => 'OpenAI DALL·E 3 — uses your OPENAI_API_KEY.',
            self::GptImage1 => 'OpenAI GPT Image 1 — uses your OPENAI_API_KEY.',
            self::Midjourney => 'Your Midjourney-compatible API — set MIDJOURNEY_API_URL (and optional key) in .env.',
        };
    }

    public function isOpenAi(): bool
    {
        return $this === self::DallE3 || $this === self::GptImage1;
    }

    /**
     * @return list<array{value: string, label: string, description: string}>
     */
    public static function optionsForInertia(): array
    {
        $out = [];
        foreach (self::cases() as $case) {
            $out[] = [
                'value' => $case->value,
                'label' => $case->label(),
                'description' => $case->description(),
            ];
        }

        return $out;
    }
}
