<?php

declare(strict_types=1);

namespace Modules\Cortex\Jobs;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Modules\Cortex\Models\CortexAgentLlmSetting;
use Modules\Cortex\Models\PulseDailyDigest;
use Modules\Cortex\Models\PulseSetting;
use Modules\Cortex\Services\CortexLlmProviderFactory;
use Modules\Cortex\Services\PulseDigestGenerator;
use Modules\Cortex\Services\PulseFeedRefresher;
use Modules\Cortex\Support\CortexAgentKey;
use Modules\Cortex\Support\CortexLlmProvider;

final class PulseRunDigestPipelineJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $timeout = 3600;

    public function __construct(
        public string $tenantId,
        public string $mode,
        public string $digestDateYmd,
        public bool $isScheduled = false,
    ) {}

    /**
     * @return list<object>
     */
    public function middleware(): array
    {
        return [
            (new WithoutOverlapping('pulse-digest-pipeline:'.$this->tenantId))->releaseAfter(120),
        ];
    }

    public function handle(
        PulseFeedRefresher $feedRefresher,
        PulseDigestGenerator $digestGenerator,
        CortexLlmProviderFactory $llmFactory,
    ): void {
        $tenant = Tenant::query()->find($this->tenantId);
        if ($tenant === null) {
            return;
        }

        tenancy()->initialize($tenant);

        try {
            // Prefer existing row (HTTP handler may have created it); avoid duplicate firstOrCreate races on unique (tenant_id, digest_date).
            $digest = PulseDailyDigest::query()
                ->where('tenant_id', $this->tenantId)
                ->whereDate('digest_date', $this->digestDateYmd)
                ->first()
                ?? PulseDailyDigest::getOrCreateForTenantDate($this->tenantId, $this->digestDateYmd);

            if ($this->mode === 'full' || $this->mode === 'feeds') {
                $digest->feeds_status = 'running';
                $digest->feeds_error = null;
                $digest->save();

                try {
                    $feedRefresher->refreshAllForTenant($this->tenantId);
                    $digest->refresh();
                    $digest->feeds_status = 'completed';
                    $digest->feeds_refreshed_at = now();
                    $digest->feeds_error = null;
                    $digest->save();
                } catch (\Throwable $e) {
                    Log::error('PulseRunDigestPipelineJob: feeds refresh failed', [
                        'tenant_id' => $this->tenantId,
                        'error' => $e->getMessage(),
                    ]);
                    $digest->refresh();
                    $digest->feeds_status = 'failed';
                    $digest->feeds_error = $e->getMessage();
                    $digest->save();
                    if ($this->mode === 'full') {
                        return;
                    }
                }
            }

            if ($this->mode === 'full' || $this->mode === 'ideas') {
                if (! $llmFactory->isTenantAgentConfigured($this->tenantId, CortexAgentKey::Pulse)) {
                    $digest->refresh();
                    $digest->ideas_status = 'failed';
                    $provider = CortexAgentLlmSetting::resolvedProviderFor($this->tenantId, CortexAgentKey::Pulse);
                    $envKey = $provider === CortexLlmProvider::Anthropic ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY';
                    $digest->ideas_error = 'LLM is not configured for Pulse: '.$envKey.' is missing or empty for the '
                        .$provider->value.' provider. Set it in .env, then restart the queue worker; run php artisan config:clear if you use config caching.';
                    $digest->save();

                    return;
                }

                $digest->refresh();
                $digest->ideas_status = 'running';
                $digest->ideas_error = null;
                $digest->save();

                try {
                    $digestGenerator->generateAndStore($digest->fresh());
                } catch (\Throwable $e) {
                    Log::error('PulseRunDigestPipelineJob: idea generation failed', [
                        'tenant_id' => $this->tenantId,
                        'error' => $e->getMessage(),
                    ]);
                    $digest->refresh();
                    $digest->ideas_status = 'failed';
                    $digest->ideas_error = $e->getMessage();
                    $digest->save();
                }
            }

            if ($this->isScheduled && $this->mode === 'full') {
                $digest->refresh();
                if ($digest->feeds_status === 'completed' && $digest->ideas_status === 'completed') {
                    $settings = PulseSetting::query()->where('tenant_id', $this->tenantId)->first();
                    if ($settings !== null) {
                        $tz = is_string($settings->digest_timezone) && $settings->digest_timezone !== ''
                            ? $settings->digest_timezone
                            : (string) config('app.timezone');
                        $settings->last_auto_digest_date = now($tz)->toDateString();
                        $settings->save();
                    }
                }
            }
        } finally {
            tenancy()->end();
        }
    }
}
