<?php

declare(strict_types=1);

namespace Modules\Cortex\Support;

final class MirageDataImageDecoder
{
    public const MAX_BYTES = 5_242_880;

    /**
     * Decode a browser data URL (data:image/...;base64,...).
     *
     * @return array{data_url: string, binary: string, mime: string}|null
     */
    public static function fromDataUrl(?string $value): ?array
    {
        if ($value === null) {
            return null;
        }
        $value = trim($value);
        if ($value === '') {
            return null;
        }

        if (! preg_match('#^data:image/(png|jpeg|jpg|gif|webp);base64,(.+)$#i', $value, $m)) {
            return null;
        }

        $mime = match (strtolower($m[1])) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            default => 'image/png',
        };

        $raw = base64_decode($m[2], true);
        if ($raw === false || strlen($raw) > self::MAX_BYTES) {
            return null;
        }

        return [
            'data_url' => $value,
            'binary' => $raw,
            'mime' => $mime,
        ];
    }

    /**
     * Face first, then product — matches GPT Image “first image” fidelity guidance.
     *
     * @return list<array{binary: string, mime: string}>
     */
    public static function referenceLayers(?string $faceDataUrl, ?string $productDataUrl): array
    {
        $out = [];
        $face = self::fromDataUrl($faceDataUrl);
        if ($face !== null) {
            $out[] = ['binary' => $face['binary'], 'mime' => $face['mime']];
        }
        $product = self::fromDataUrl($productDataUrl);
        if ($product !== null) {
            $out[] = ['binary' => $product['binary'], 'mime' => $product['mime']];
        }

        return $out;
    }
}
