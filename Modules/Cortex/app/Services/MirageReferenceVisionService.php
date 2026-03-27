<?php

declare(strict_types=1);

namespace Modules\Cortex\Services;

use Illuminate\Support\Facades\Log;
use Modules\Cortex\Support\MirageDataImageDecoder;
use OpenAI\Laravel\Facades\OpenAI;

final class MirageReferenceVisionService
{
    /**
     * Short FACE / PRODUCT notes for Mirage JSON ideation (OpenAI vision).
     */
    public function summarizeForIdeas(?string $faceDataUrl, ?string $productDataUrl): string
    {
        $face = MirageDataImageDecoder::fromDataUrl($faceDataUrl);
        $product = MirageDataImageDecoder::fromDataUrl($productDataUrl);

        if ($face === null && $product === null) {
            return '';
        }

        $key = config('openai.api_key');
        if (! is_string($key) || $key === '') {
            return '';
        }

        $bits = [];
        if ($face !== null) {
            $bits[] = 'first attached image = face / person reference';
        }
        if ($product !== null) {
            $bits[] = 'last attached image = product or object reference';
        }
        $attachmentNote = implode('; ', $bits);

        $parts = [
            [
                'type' => 'text',
                'text' => <<<TXT
You help design YouTube thumbnails. The user attached reference photo(s): {$attachmentNote}.

Write short notes for a thumbnail designer (max ~100 words total).

Rules:
- Describe only what is visible. Do not infer real identity or full name.
- FACE: hair, skin tone, glasses, facial hair, approximate age range, expression style. If no face image, write "N/A".
- PRODUCT: object type, colors, shape, visible text or logo. If no product image, write "N/A".

Use exactly this format (plain text, no markdown):

FACE: ...
PRODUCT: ...
TXT,
            ],
        ];

        if ($face !== null) {
            $parts[] = ['type' => 'image_url', 'image_url' => ['url' => $face['data_url']]];
        }
        if ($product !== null) {
            $parts[] = ['type' => 'image_url', 'image_url' => ['url' => $product['data_url']]];
        }

        $model = (string) config('openai.mirage_reference_vision_model', 'gpt-4o-mini');

        try {
            $response = OpenAI::chat()->create([
                'model' => $model,
                'messages' => [
                    ['role' => 'user', 'content' => $parts],
                ],
                'max_tokens' => 400,
                'temperature' => 0.2,
            ]);

            $content = $response->choices[0]->message->content ?? '';
            $text = trim(is_string($content) ? $content : '');

            return $text;
        } catch (\Throwable $e) {
            Log::warning('MirageReferenceVisionService::summarizeForIdeas failed', [
                'error' => $e->getMessage(),
            ]);

            return '';
        }
    }
}
