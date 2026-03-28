<?php

declare(strict_types=1);

namespace App\Services\AiUsage;

use GuzzleHttp\HandlerStack;
use NeuronAI\HttpClient\GuzzleHttpClient;

/**
 * Neuron agents use a dedicated Guzzle stack; we attach the same OpenAI usage logger as the OpenAI facade client.
 */
final class NeuronOpenAiHttpClientFactory
{
    /**
     * @param  float|null  $timeoutOverride  Guzzle request timeout seconds (defaults to config openai.request_timeout).
     */
    public static function make(?float $timeoutOverride = null): GuzzleHttpClient
    {
        $timeout = $timeoutOverride ?? (float) config('openai.request_timeout', 120);
        $stack = HandlerStack::create();
        $stack->push(app(OpenAiGuzzleLoggingMiddleware::class));

        return new GuzzleHttpClient([], $timeout, 10.0, $stack);
    }
}
