<?php

declare(strict_types=1);

namespace App\Services\AiUsage;

use GuzzleHttp\Promise\Create;
use GuzzleHttp\Psr7\Utils;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;
use Throwable;

/**
 * Guzzle middleware: logs OpenAI-compatible HTTP calls (tokens, model, timing).
 * Must restore the response body stream after reading so SDK consumers still work.
 */
final class OpenAiGuzzleLoggingMiddleware
{
    public function __construct(
        private readonly AiCallLogger $logger,
    ) {}

    public function __invoke(callable $handler): callable
    {
        return function (RequestInterface $request, array $options) use ($handler) {
            $startedAt = microtime(true);

            return $handler($request, $options)->then(
                function (ResponseInterface $response) use ($request, $startedAt) {
                    return $this->logAndRewindResponse($request, $response, $startedAt);
                },
                function ($reason) use ($request, $startedAt) {
                    $this->logTransportFailure($request, $reason, $startedAt);

                    return Create::rejectionFor($reason);
                }
            );
        };
    }

    private function logAndRewindResponse(RequestInterface $request, ResponseInterface $response, float $startedAt): ResponseInterface
    {
        $durationMs = $this->durationMs($startedAt);
        $body = (string) $response->getBody();
        $uri = $request->getUri();
        $host = strtolower($uri->getHost());
        $path = $uri->getPath();

        $provider = $this->detectProvider($host);
        $apiFamily = $this->detectApiFamily($path);

        $json = null;
        if ($body !== '') {
            try {
                $decoded = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
                $json = is_array($decoded) ? $decoded : null;
            } catch (Throwable) {
                $json = null;
            }
        }

        $httpStatus = $response->getStatusCode();
        $model = is_array($json) && isset($json['model']) && is_string($json['model']) ? $json['model'] : null;

        $prompt = null;
        $completion = null;
        $total = null;
        if (is_array($json) && isset($json['usage']) && is_array($json['usage'])) {
            $u = $json['usage'];
            // OpenAI-style
            $prompt = isset($u['prompt_tokens']) ? (int) $u['prompt_tokens'] : null;
            $completion = isset($u['completion_tokens']) ? (int) $u['completion_tokens'] : null;
            $total = isset($u['total_tokens']) ? (int) $u['total_tokens'] : null;
            // Anthropic Messages API (input_tokens / output_tokens)
            if ($prompt === null && isset($u['input_tokens'])) {
                $prompt = (int) $u['input_tokens'];
            }
            if ($completion === null && isset($u['output_tokens'])) {
                $completion = (int) $u['output_tokens'];
            }
            if ($total === null && $prompt !== null && $completion !== null) {
                $total = $prompt + $completion;
            }
        }

        $success = $httpStatus < 400;
        $errorMessage = null;
        if (! $success && is_array($json) && isset($json['error'])) {
            $err = $json['error'];
            if (is_array($err) && isset($err['message']) && is_string($err['message'])) {
                $errorMessage = $err['message'];
            } elseif (is_string($err)) {
                $errorMessage = $err;
            }
        }

        $this->logger->record(
            provider: $provider,
            apiFamily: $apiFamily,
            model: $model,
            promptTokens: $prompt,
            completionTokens: $completion,
            totalTokens: $total,
            durationMs: $durationMs,
            success: $success,
            httpStatus: $httpStatus,
            errorMessage: $errorMessage,
            meta: [
                'request_path' => $path,
                'request_host' => $host,
                'method' => $request->getMethod(),
            ],
        );

        return $response->withBody(Utils::streamFor($body));
    }

    private function logTransportFailure(RequestInterface $request, mixed $reason, float $startedAt): void
    {
        $durationMs = $this->durationMs($startedAt);
        $uri = $request->getUri();
        $host = strtolower($uri->getHost());
        $path = $uri->getPath();

        $message = $reason instanceof Throwable ? $reason->getMessage() : (is_string($reason) ? $reason : 'Request failed');

        $this->logger->record(
            provider: $this->detectProvider($host),
            apiFamily: $this->detectApiFamily($path),
            model: null,
            promptTokens: null,
            completionTokens: null,
            totalTokens: null,
            durationMs: $durationMs,
            success: false,
            httpStatus: null,
            errorMessage: $message,
            meta: [
                'request_path' => $path,
                'request_host' => $host,
                'method' => $request->getMethod(),
            ],
        );
    }

    private function durationMs(float $startedAt): int
    {
        return (int) round((microtime(true) - $startedAt) * 1000);
    }

    private function detectProvider(string $host): string
    {
        if (str_contains($host, 'openai.com')) {
            return 'openai';
        }
        if (str_contains($host, 'anthropic.com')) {
            return 'anthropic';
        }

        return $host !== '' ? $host : 'unknown';
    }

    private function detectApiFamily(string $path): ?string
    {
        $path = strtolower($path);

        return match (true) {
            str_contains($path, '/messages') => 'messages',
            str_contains($path, '/chat/completions') => 'chat.completions',
            str_contains($path, '/responses') => 'responses',
            str_contains($path, '/images/edits') => 'images.edits',
            str_contains($path, '/images/generations') => 'images.generations',
            str_contains($path, '/embeddings') => 'embeddings',
            str_contains($path, '/audio/') => 'audio',
            default => null,
        };
    }
}
