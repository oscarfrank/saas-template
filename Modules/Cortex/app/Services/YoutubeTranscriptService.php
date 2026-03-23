<?php

namespace Modules\Cortex\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Psr7\HttpFactory;
use Illuminate\Support\Facades\Log;
use MrMySQL\YoutubeTranscript\Exception\NoTranscriptAvailableException;
use MrMySQL\YoutubeTranscript\Exception\NoTranscriptFoundException;
use MrMySQL\YoutubeTranscript\Exception\TooManyRequestsException;
use MrMySQL\YoutubeTranscript\Exception\TranscriptsDisabledException;
use MrMySQL\YoutubeTranscript\Exception\YouTubeRequestFailedException;
use MrMySQL\YoutubeTranscript\TranscriptListFetcher;

final class YoutubeTranscriptService
{
    private const MAX_TRANSCRIPT_CHARS = 100_000;

    public function extractVideoId(string $urlOrId): ?string
    {
        $trimmed = trim($urlOrId);
        if (preg_match('/^[a-zA-Z0-9_-]{11}$/', $trimmed)) {
            return $trimmed;
        }
        if (preg_match('/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/', $trimmed, $m)) {
            return $m[1];
        }

        return null;
    }

    /**
     * @return array{success: true, title: string, text: string, truncated: bool}|array{success: false, error: string}
     */
    public function fetchTranscript(string $urlOrId): array
    {
        $videoId = $this->extractVideoId($urlOrId);
        if ($videoId === null) {
            return ['success' => false, 'error' => 'Could not parse a YouTube video ID from the input.'];
        }

        $httpClient = new Client([
            'timeout' => 15,
            'headers' => [
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language' => 'en-US,en;q=0.9',
            ],
        ]);
        $requestFactory = new HttpFactory;
        $streamFactory = new HttpFactory;
        $fetcher = new TranscriptListFetcher($httpClient, $requestFactory, $streamFactory);

        try {
            $transcriptList = $fetcher->fetch($videoId);
            $transcript = null;
            try {
                $transcript = $transcriptList->findGeneratedTranscript(['en', 'en-US', 'en-GB']);
            } catch (NoTranscriptFoundException $e) {
                $codes = $transcriptList->getAvailableLanguageCodes();
                if (count($codes) > 0) {
                    $transcript = $transcriptList->findTranscript($codes);
                } else {
                    throw $e;
                }
            }
            $segments = $transcript->fetch();
            $text = implode(' ', array_map(fn ($s) => $s['text'] ?? '', $segments));
            $text = trim($text);
            $title = $transcriptList->getTitle();

            $truncated = false;
            if (strlen($text) > self::MAX_TRANSCRIPT_CHARS) {
                $text = substr($text, 0, self::MAX_TRANSCRIPT_CHARS).'…';
                $truncated = true;
            }

            return [
                'success' => true,
                'title' => $title !== '' ? $title : 'Video '.$videoId,
                'text' => $text,
                'truncated' => $truncated,
            ];
        } catch (TranscriptsDisabledException) {
            return ['success' => false, 'error' => 'Transcripts are disabled for this video.'];
        } catch (NoTranscriptFoundException|NoTranscriptAvailableException) {
            return ['success' => false, 'error' => 'No transcript found for this video.'];
        } catch (TooManyRequestsException) {
            return ['success' => false, 'error' => 'YouTube rate limited the request — try again shortly.'];
        } catch (YouTubeRequestFailedException $e) {
            Log::warning('Cortex YouTube transcript request failed: '.$e->getMessage());

            return ['success' => false, 'error' => $e->getMessage()];
        } catch (\Throwable $e) {
            Log::warning('Cortex YouTube transcript fetch failed: '.$e->getMessage());

            return ['success' => false, 'error' => 'Failed to load transcript.'];
        }
    }
}
