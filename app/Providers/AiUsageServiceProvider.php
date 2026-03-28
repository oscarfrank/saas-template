<?php

declare(strict_types=1);

namespace App\Providers;

use App\Services\AiUsage\AiCallLogger;
use App\Services\AiUsage\OpenAiGuzzleLoggingMiddleware;
use GuzzleHttp\Client;
use GuzzleHttp\HandlerStack;
use Illuminate\Support\ServiceProvider;
use OpenAI;
use OpenAI\Client as OpenAIClient;
use OpenAI\Contracts\ClientContract;
use OpenAI\Laravel\Commands\InstallCommand;
use OpenAI\Laravel\Exceptions\ApiKeyIsMissing;

/**
 * Registers the OpenAI client with usage logging. The stock openai-php/laravel provider is
 * disabled via composer.json dont-discover so this binding is not overwritten.
 */
final class AiUsageServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AiCallLogger::class);

        $this->app->singleton(ClientContract::class, function (): OpenAIClient {
            $apiKey = config('openai.api_key');
            $organization = config('openai.organization');
            $project = config('openai.project');
            $baseUri = config('openai.base_uri');

            if (! is_string($apiKey) || ($organization !== null && ! is_string($organization))) {
                throw ApiKeyIsMissing::create();
            }

            $stack = HandlerStack::create();
            $stack->push($this->app->make(OpenAiGuzzleLoggingMiddleware::class));

            $guzzle = new Client([
                'handler' => $stack,
                'timeout' => (float) config('openai.request_timeout', 120),
            ]);

            $factory = OpenAI::factory()
                ->withApiKey($apiKey)
                ->withOrganization($organization)
                ->withHttpHeader('OpenAI-Beta', 'assistants=v2')
                ->withHttpClient($guzzle);

            if (is_string($project)) {
                $factory->withProject($project);
            }

            if (is_string($baseUri)) {
                $factory->withBaseUri($baseUri);
            }

            return $factory->make();
        });

        $this->app->alias(ClientContract::class, 'openai');
        $this->app->alias(ClientContract::class, OpenAIClient::class);
    }

    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->publishes([
                base_path('vendor/openai-php/laravel/config/openai.php') => config_path('openai.php'),
            ], 'openai-config');

            $this->commands([
                InstallCommand::class,
            ]);
        }
    }
}
