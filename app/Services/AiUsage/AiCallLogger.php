<?php

declare(strict_types=1);

namespace App\Services\AiUsage;

use App\Models\AiCallLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Throwable;

final class AiCallLogger
{
    /**
     * @param  array<string, mixed>  $meta
     */
    public function record(
        string $provider,
        ?string $apiFamily,
        ?string $model,
        ?int $promptTokens,
        ?int $completionTokens,
        ?int $totalTokens,
        int $durationMs,
        bool $success,
        ?int $httpStatus,
        ?string $errorMessage,
        array $meta = [],
    ): void {
        try {
            $tenantId = tenant('id');

            AiCallLog::query()->create([
                'tenant_id' => is_string($tenantId) ? $tenantId : null,
                'user_id' => auth()->id(),
                'invocation_kind' => AiCallContext::invocationKind(),
                'source' => AiCallContext::resolveSource(),
                'route_name' => Route::currentRouteName(),
                'provider' => $provider,
                'api_family' => $apiFamily,
                'model' => $model,
                'prompt_tokens' => $promptTokens,
                'completion_tokens' => $completionTokens,
                'total_tokens' => $totalTokens,
                'duration_ms' => $durationMs,
                'success' => $success,
                'http_status' => $httpStatus,
                'error_message' => $errorMessage !== null && strlen($errorMessage) > 2000
                    ? substr($errorMessage, 0, 1997).'...'
                    : $errorMessage,
                'meta' => $meta === [] ? null : $meta,
            ]);
        } catch (Throwable $e) {
            Log::warning('AiCallLogger::record failed', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
