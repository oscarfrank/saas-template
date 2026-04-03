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

    /**
     * Short STYLE notes from optional sample thumbnails (layout, palette, typography vibe).
     *
     * @param  list<string>  $styleDataUrls  Valid data:image/...;base64,... strings
     */
    public function summarizeStyleSamplesForIdeas(array $styleDataUrls): string
    {
        $decoded = [];
        foreach ($styleDataUrls as $raw) {
            if (count($decoded) >= MirageDataImageDecoder::MAX_STYLE_SAMPLES) {
                break;
            }
            if (! is_string($raw)) {
                continue;
            }
            $one = MirageDataImageDecoder::fromDataUrl(trim($raw));
            if ($one !== null) {
                $decoded[] = $one;
            }
        }

        if ($decoded === []) {
            return '';
        }

        $key = config('openai.api_key');
        if (! is_string($key) || $key === '') {
            return '';
        }

        $parts = [
            [
                'type' => 'text',
                'text' => <<<'TXT'
You help design YouTube thumbnails. The user attached one or more **sample thumbnails** (examples of the look they want — not necessarily the same topic).

Write short notes for a thumbnail designer (max ~120 words total).

Rules:
- Describe composition (rule of thirds, split layout, face placement, arrows, borders).
- Color palette and contrast (background vs text).
- Typography feel (bold sans, handwritten, outline stroke) without quoting trademark fonts.
- Energy level (calm vs high-energy) and overall vibe.
- Do not describe unrelated topics; focus on reusable **style** only.

Use exactly this format (plain text, no markdown):

STYLE_SAMPLES: ...
TXT,
            ],
        ];

        foreach ($decoded as $row) {
            $parts[] = ['type' => 'image_url', 'image_url' => ['url' => $row['data_url']]];
        }

        $model = (string) config('openai.mirage_reference_vision_model', 'gpt-4o-mini');

        try {
            $response = OpenAI::chat()->create([
                'model' => $model,
                'messages' => [
                    ['role' => 'user', 'content' => $parts],
                ],
                'max_tokens' => 450,
                'temperature' => 0.2,
            ]);

            $content = $response->choices[0]->message->content ?? '';
            $text = trim(is_string($content) ? $content : '');

            return $text;
        } catch (\Throwable $e) {
            Log::warning('MirageReferenceVisionService::summarizeStyleSamplesForIdeas failed', [
                'error' => $e->getMessage(),
            ]);

            return '';
        }
    }
}
