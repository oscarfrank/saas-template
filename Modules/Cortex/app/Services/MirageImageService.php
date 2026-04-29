<?php

declare(strict_types=1);

namespace Modules\Cortex\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Cortex\Support\MirageImageProvider;
use Modules\Cortex\Support\MirageOpenAiImageModel;
use OpenAI\Laravel\Facades\OpenAI;

final class MirageImageService
{
    /**
     * @param  list<array{binary: string, mime: string}>  $referenceLayers
     * @return array{url?: string, revised_prompt?: string|null, error?: string}
     */
    public function generate(
        string $prompt,
        MirageImageProvider $provider,
        MirageOpenAiImageModel $openAiModel,
        array $referenceLayers = [],
    ): array {
        $prompt = trim($prompt);
        if ($prompt === '') {
            return ['error' => 'Empty prompt.'];
        }

        return match ($provider) {
            MirageImageProvider::OpenAi => $openAiModel->isGptImageFamily()
                ? ($referenceLayers !== []
                    ? $this->openAiImageEdit($prompt, $openAiModel->value, $referenceLayers)
                    : $this->openAiImage(
                        $prompt,
                        $openAiModel->value,
                        (string) config('openai.gpt_image_size', '1536x1024'),
                        null,
                    ))
                : $this->openAiImage(
                    $prompt,
                    $openAiModel->value,
                    (string) config('openai.image_size', '1792x1024'),
                    (string) config('openai.image_quality', 'standard'),
                ),
            MirageImageProvider::DallE3 => $this->openAiImage(
                $prompt,
                'dall-e-3',
                (string) config('openai.image_size', '1792x1024'),
                (string) config('openai.image_quality', 'standard'),
            ),
            MirageImageProvider::GptImage1 => $referenceLayers !== []
                ? $this->openAiImageEdit($prompt, 'gpt-image-1.5', $referenceLayers)
                : $this->openAiImage(
                    $prompt,
                    'gpt-image-1.5',
                    (string) config('openai.gpt_image_size', '1536x1024'),
                    null,
                ),
            MirageImageProvider::Midjourney => $this->midjourneyHttp($prompt),
        };
    }

    /**
     * GPT Image edit: one or more reference images + prompt (high input fidelity).
     *
     * @param  list<array{binary: string, mime: string}>  $layers
     * @return array{url?: string, revised_prompt?: string|null, error?: string}
     */
    private function openAiImageEdit(string $prompt, string $model, array $layers): array
    {
        $key = config('openai.api_key');
        if (! is_string($key) || $key === '') {
            return ['error' => 'OpenAI is not configured. Add OPENAI_API_KEY to your environment.'];
        }

        $paths = [];
        $handles = [];

        try {
            foreach ($layers as $layer) {
                // openai-php multipart uses the temp path’s extension to set Content-Type per part.
                // Extensionless tempnam() paths yield no MIME → GPT Image edit rejects image[0].
                $ext = self::extensionForImageMime($layer['mime']);
                $path = sys_get_temp_dir().DIRECTORY_SEPARATOR.'mirage_ref_'.uniqid('', true).'.'.$ext;
                if (file_put_contents($path, $layer['binary']) === false) {
                    @unlink($path);

                    return ['error' => 'Could not write a reference image to disk.'];
                }
                $paths[] = $path;
                $handle = fopen($path, 'rb');
                if ($handle === false) {
                    return ['error' => 'Could not read a reference image.'];
                }
                $handles[] = $handle;
            }

            $params = [
                'model' => $model,
                'image' => $handles,
                'prompt' => $prompt,
                'n' => 1,
                'size' => (string) config('openai.gpt_image_size', '1536x1024'),
                'quality' => (string) config('openai.gpt_image_quality', 'auto'),
                'output_format' => (string) config('openai.gpt_image_output_format', 'png'),
            ];

            // gpt-image-2 rejects input_fidelity; 1.5 and earlier GPT Image edit models accept it.
            if (strtolower($model) !== MirageOpenAiImageModel::GptImage2->value) {
                $params['input_fidelity'] = 'high';
            }

            $response = OpenAI::images()->edit($params);

            $first = $response->data[0] ?? null;
            if ($first === null) {
                return ['error' => 'No image data in edit response.'];
            }

            $format = strtolower((string) config('openai.gpt_image_output_format', 'png'));
            $mime = match ($format) {
                'jpeg', 'jpg' => 'image/jpeg',
                'webp' => 'image/webp',
                default => 'image/png',
            };

            if ($first->b64_json !== '') {
                return [
                    'url' => 'data:'.$mime.';base64,'.$first->b64_json,
                    'revised_prompt' => null,
                ];
            }

            if ($first->url !== '') {
                return [
                    'url' => $first->url,
                    'revised_prompt' => null,
                ];
            }

            return ['error' => 'No image URL or base64 data in edit response.'];
        } catch (\Throwable $e) {
            Log::warning('MirageImageService::openAiImageEdit failed', [
                'model' => $model,
                'error' => $e->getMessage(),
            ]);

            return ['error' => 'Image edit failed: '.$e->getMessage()];
        } finally {
            foreach ($handles as $h) {
                if (is_resource($h)) {
                    fclose($h);
                }
            }
            foreach ($paths as $p) {
                if (is_string($p) && is_file($p)) {
                    @unlink($p);
                }
            }
        }
    }

    private static function extensionForImageMime(string $mime): string
    {
        return match (strtolower($mime)) {
            'image/jpeg', 'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            default => 'png',
        };
    }

    /**
     * @return array{url?: string, revised_prompt?: string|null, error?: string}
     */
    private function openAiImage(string $prompt, string $model, string $size, ?string $quality): array
    {
        $key = config('openai.api_key');
        if (! is_string($key) || $key === '') {
            return ['error' => 'OpenAI is not configured. Add OPENAI_API_KEY to your environment.'];
        }

        $isGptImage = str_contains(strtolower($model), 'gpt-image');

        try {
            $params = [
                'model' => $model,
                'prompt' => $prompt,
                'n' => 1,
                'size' => $size,
            ];

            if ($isGptImage) {
                $params['quality'] = (string) config('openai.gpt_image_quality', 'auto');
                $params['output_format'] = (string) config('openai.gpt_image_output_format', 'png');
            } else {
                $params['response_format'] = 'url';
                if ($quality !== null && str_contains(strtolower($model), 'dall-e-3')) {
                    $params['quality'] = $quality;
                }
            }

            $response = OpenAI::images()->create($params);

            $first = $response->data[0] ?? null;
            if ($first === null) {
                return ['error' => 'No image data in response.'];
            }

            if (! $isGptImage && $first->url !== '') {
                return [
                    'url' => $first->url,
                    'revised_prompt' => $first->revisedPrompt,
                ];
            }

            if ($isGptImage && $first->b64_json !== '') {
                $format = strtolower((string) config('openai.gpt_image_output_format', 'png'));
                $mime = match ($format) {
                    'jpeg', 'jpg' => 'image/jpeg',
                    'webp' => 'image/webp',
                    default => 'image/png',
                };

                return [
                    'url' => 'data:'.$mime.';base64,'.$first->b64_json,
                    'revised_prompt' => $first->revisedPrompt,
                ];
            }

            if ($first->url !== '') {
                return [
                    'url' => $first->url,
                    'revised_prompt' => $first->revisedPrompt,
                ];
            }

            return ['error' => 'No image URL or base64 data in response.'];
        } catch (\Throwable $e) {
            Log::warning('MirageImageService::openAiImage failed', [
                'model' => $model,
                'error' => $e->getMessage(),
            ]);

            return ['error' => 'Image generation failed: '.$e->getMessage()];
        }
    }

    /**
     * POST JSON to a Midjourney-compatible endpoint. Configure MIDJOURNEY_API_URL (+ optional key).
     *
     * @return array{url?: string, revised_prompt?: null, error?: string}
     */
    private function midjourneyHttp(string $prompt): array
    {
        $apiUrl = trim((string) config('services.midjourney.api_url', ''));
        if ($apiUrl === '') {
            return [
                'error' => 'Midjourney is selected but MIDJOURNEY_API_URL is not set. Add it to your .env (your provider’s imagine/generate URL), or switch to DALL·E 3 in Mirage settings.',
            ];
        }

        $apiKey = config('services.midjourney.api_key');

        try {
            $request = Http::timeout((int) config('services.midjourney.timeout', 180))
                ->acceptJson()
                ->asJson();

            if (is_string($apiKey) && $apiKey !== '') {
                $request = $request->withToken($apiKey);
            }

            $response = $request->post($apiUrl, [
                'prompt' => $prompt,
            ]);

            if (! $response->successful()) {
                return [
                    'error' => 'Midjourney API error ('.$response->status().'): '.$response->body(),
                ];
            }

            $data = $response->json();
            $url = $this->extractImageUrlFromJson(is_array($data) ? $data : []);

            if ($url === null || $url === '') {
                return [
                    'error' => 'Midjourney response did not include an image URL. Check your API response shape or provider docs.',
                ];
            }

            return [
                'url' => $url,
                'revised_prompt' => null,
            ];
        } catch (\Throwable $e) {
            Log::warning('MirageImageService::midjourneyHttp failed', [
                'error' => $e->getMessage(),
            ]);

            return ['error' => 'Midjourney request failed: '.$e->getMessage()];
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function extractImageUrlFromJson(array $data): ?string
    {
        $candidates = [
            $data['url'] ?? null,
            $data['image_url'] ?? null,
            $data['imageUrl'] ?? null,
            isset($data['data'][0]['url']) ? $data['data'][0]['url'] : null,
            isset($data['output'][0]) ? $data['output'][0] : null,
            isset($data['outputs'][0]) ? $data['outputs'][0] : null,
        ];

        foreach ($candidates as $c) {
            if (is_string($c) && filter_var($c, FILTER_VALIDATE_URL)) {
                return $c;
            }
        }

        return null;
    }
}
