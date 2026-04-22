<?php

declare(strict_types=1);

namespace Modules\Cortex\Support;

enum MirageOpenAiImageModel: string
{
    case DallE3 = 'dall-e-3';
    case GptImage15 = 'gpt-image-1.5';
    case GptImage2 = 'gpt-image-2';

    public function label(): string
    {
        return match ($this) {
            self::DallE3 => 'DALL·E 3',
            self::GptImage15 => 'GPT Image 1.5',
            self::GptImage2 => 'GPT Image 2',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::DallE3 => 'Text-to-image with OpenAI DALL·E 3.',
            self::GptImage15 => 'OpenAI GPT Image 1.5. Supports reference-image editing in Mirage.',
            self::GptImage2 => 'OpenAI GPT Image 2. Supports reference-image editing in Mirage.',
        };
    }

    public function isGptImageFamily(): bool
    {
        return $this !== self::DallE3;
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
