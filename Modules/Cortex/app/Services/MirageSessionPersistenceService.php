<?php

declare(strict_types=1);

namespace Modules\Cortex\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Cortex\Models\MirageSession;
use Modules\Cortex\Models\MirageSessionOutput;
use Modules\Cortex\Models\MirageSessionTurn;
use Throwable;

final class MirageSessionPersistenceService
{
    private const int MAX_DATA_URL_BYTES = 12_000_000;

    private const int HTTP_TIMEOUT_SECONDS = 120;

    /**
     * @param  list<array<string, mixed>>  $ideas
     * @param  array<string, array{url?: string|null, revised_prompt?: string|null, error?: string|null}>  $imageByIdeaId
     */
    public function appendTurn(
        MirageSession $session,
        string $inputMode,
        string $focus,
        int $ideaCount,
        ?string $inputText,
        ?string $youtubeUrl,
        ?array $sourceJson,
        array $ideas,
        array $imageByIdeaId,
    ): MirageSessionTurn {
        return DB::transaction(function () use (
            $session,
            $inputMode,
            $focus,
            $ideaCount,
            $inputText,
            $youtubeUrl,
            $sourceJson,
            $ideas,
            $imageByIdeaId
        ): MirageSessionTurn {
            $maxPosition = (int) $session->turns()->max('position');
            $position = $maxPosition + 1;

            $turn = MirageSessionTurn::query()->create([
                'mirage_session_id' => $session->id,
                'position' => $position,
                'input_mode' => $inputMode,
                'focus' => $focus,
                'idea_count' => $ideaCount,
                'input_text' => $inputText,
                'youtube_url' => $youtubeUrl,
                'source_json' => $sourceJson,
                'ideas_json' => $ideas,
            ]);

            $tenantId = (string) $session->tenant_id;
            $disk = 'public';

            foreach ($ideas as $row) {
                if (! is_array($row)) {
                    continue;
                }
                $ideaId = (string) ($row['id'] ?? '');
                if ($ideaId === '') {
                    continue;
                }
                $title = (string) ($row['title'] ?? '');
                $imagePrompt = (string) ($row['image_prompt'] ?? '');
                $res = $imageByIdeaId[$ideaId] ?? [];
                if (! is_array($res)) {
                    $res = [];
                }
                $error = isset($res['error']) && is_string($res['error']) && $res['error'] !== '' ? $res['error'] : null;
                $revised = isset($res['revised_prompt']) && is_string($res['revised_prompt']) ? $res['revised_prompt'] : null;
                $rawUrl = isset($res['url']) && is_string($res['url']) ? $res['url'] : null;

                $out = MirageSessionOutput::query()->create([
                    'mirage_session_turn_id' => $turn->id,
                    'idea_id' => $ideaId,
                    'title' => $title !== '' ? Str::limit($title, 500, '') : '—',
                    'thumb_text' => is_string($row['thumb_text'] ?? null) ? (string) $row['thumb_text'] : null,
                    'rationale' => is_string($row['rationale'] ?? null) ? (string) $row['rationale'] : null,
                    'image_prompt' => $imagePrompt,
                    'disk' => $disk,
                    'path' => null,
                    'mime' => null,
                    'revised_prompt' => $revised,
                    'error_message' => $error,
                ]);

                if ($error !== null || $rawUrl === null || $rawUrl === '') {
                    continue;
                }

                $stored = $this->storeImageToDisk(
                    $rawUrl,
                    $disk,
                    $tenantId,
                    (string) $session->id,
                    $turn->id,
                    (int) $out->id,
                );

                if ($stored === null) {
                    $out->update([
                        'error_message' => 'Could not save image to storage.',
                    ]);

                    continue;
                }

                $out->update($stored);
            }

            $session->update(['last_activity_at' => now()]);

            if ($position === 1) {
                $newTitle = $this->suggestSessionTitle($ideas, $inputText, $sourceJson, $inputMode, $youtubeUrl);
                if ($newTitle !== null) {
                    $session->update(['title' => $newTitle]);
                }
            }

            $turn->load('outputs');

            return $turn;
        });
    }

    /**
     * @param  list<array<string, mixed>>  $ideas
     * @return array{path: string, mime: string}|null
     */
    private function storeImageToDisk(
        string $url,
        string $disk,
        string $tenantId,
        string $sessionId,
        int $turnId,
        int $outputId,
    ): ?array {
        if (str_starts_with($url, 'data:')) {
            $decoded = $this->decodeDataUrl($url);
            if ($decoded === null) {
                return null;
            }
            $binary = $decoded[0];
            $mime = $decoded[1];
        } else {
            try {
                $response = \Illuminate\Support\Facades\Http::timeout(self::HTTP_TIMEOUT_SECONDS)
                    ->withHeaders($this->outboundImageHeaders($url))
                    ->get($url);
                if (! $response->successful()) {
                    Log::warning('MirageSessionPersistenceService: image HTTP failed', [
                        'status' => $response->status(),
                        'url_host' => parse_url($url, PHP_URL_HOST),
                    ]);

                    return null;
                }
                $binary = $response->body();
                if ($binary === '' || strlen($binary) < 8) {
                    return null;
                }
                $mime = $this->sniffImageMime($binary) ?? (string) ($response->header('Content-Type') ?: 'image/png');
            } catch (RequestException|Throwable $e) {
                Log::warning('MirageSessionPersistenceService: image fetch error', [
                    'error' => $e->getMessage(),
                ]);

                return null;
            }
        }

        $ext = $this->extensionForMime($mime);
        $dir = 'mirage/sessions/'.$tenantId.'/'.$sessionId.'/t'.$turnId;
        $filename = 'o'.$outputId.'_'.Str::lower(Str::random(8)).'.'.$ext;
        $path = $dir.'/'.$filename;
        if (! Storage::disk($disk)->put($path, $binary, ['visibility' => 'public'])) {
            return null;
        }

        return [
            'path' => $path,
            'mime' => $mime,
        ];
    }

    /**
     * @return array{0: string, 1: string}|null
     */
    private function decodeDataUrl(string $dataUrl): ?array
    {
        if (preg_match('#^data:([^;]+);base64,(.*)$#', $dataUrl, $m) !== 1) {
            return null;
        }
        $mime = $m[1];
        $b64 = $m[2] ?? '';
        if ($b64 === '') {
            return null;
        }
        $binary = base64_decode(str_replace(' ', '', $b64), true);
        if ($binary === false || $binary === '') {
            return null;
        }
        if (strlen($binary) > self::MAX_DATA_URL_BYTES) {
            return null;
        }

        return [$binary, $mime];
    }

    private function extensionForMime(string $mime): string
    {
        $m = strtolower($mime);

        return match (true) {
            str_contains($m, 'jpeg') || $m === 'image/jpg' => 'jpg',
            str_contains($m, 'webp') => 'webp',
            str_contains($m, 'gif') => 'gif',
            default => 'png',
        };
    }

    private function sniffImageMime(string $bin): ?string
    {
        if (str_starts_with($bin, "\xFF\xD8\xFF")) {
            return 'image/jpeg';
        }
        if (str_starts_with($bin, "\x89PNG\r\n\x1A\n")) {
            return 'image/png';
        }
        if (str_starts_with($bin, 'RIFF') && str_starts_with(substr($bin, 8, 4), 'WEBP')) {
            return 'image/webp';
        }
        if (str_starts_with($bin, 'GIF87a') || str_starts_with($bin, 'GIF89a')) {
            return 'image/gif';
        }

        return null;
    }

    /**
     * @return array<string, string>
     */
    private function outboundImageHeaders(string $url): array
    {
        $h = [
            'Accept' => 'image/*,*/*;q=0.8',
        ];
        if (is_string($url) && str_contains($url, 'oaiusercontent.com')) {
            $h['User-Agent'] = 'Laravel-Mirage/1.0';
        }

        return $h;
    }

    /**
     * @param  list<array<string, mixed>>  $ideas
     * @param  array<string, mixed>|null  $source
     */
    private function suggestSessionTitle(array $ideas, ?string $inputText, ?array $source, string $inputMode, ?string $youtubeUrl): ?string
    {
        if ($ideas !== []) {
            $first = (string) ($ideas[0]['title'] ?? '');
            if ($first !== '') {
                return Str::limit($first, 120, '…');
            }
        }
        if ($source !== null && is_string($source['youtube_title'] ?? null) && (string) $source['youtube_title'] !== '') {
            return Str::limit((string) $source['youtube_title'], 120, '…');
        }
        $t = $inputText !== null ? trim($inputText) : '';
        if ($t !== '') {
            return Str::limit($t, 80, '…');
        }
        if ($inputMode === 'youtube' && $youtubeUrl !== null) {
            return 'YouTube · '.Str::limit(trim($youtubeUrl), 50, '…');
        }

        return 'Mirage session';
    }
}
