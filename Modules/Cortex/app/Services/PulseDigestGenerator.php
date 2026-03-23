<?php

declare(strict_types=1);

namespace Modules\Cortex\Services;

use Illuminate\Support\Facades\Log;
use Modules\Cortex\Models\PulseDailyDigest;
use Modules\Cortex\Models\PulseSetting;
use Modules\Cortex\Neuron\Output\PulseDigestIdeaItem;
use Modules\Cortex\Neuron\Output\PulseDigestOutput;
use Modules\Cortex\Neuron\PulseDigestAgent;
use NeuronAI\Chat\Messages\UserMessage;

final class PulseDigestGenerator
{
    public function __construct(
        private readonly PulseFeedSignalsBuilder $signalsBuilder,
    ) {}

    public function generateAndStore(PulseDailyDigest $digest): void
    {
        $tenantId = (string) $digest->tenant_id;
        $signals = $this->signalsBuilder->build($tenantId, null);

        if ($signals === '') {
            throw new \RuntimeException('No feed signals available. Refresh feeds first.');
        }

        $setting = PulseSetting::query()->where('tenant_id', $tenantId)->first();
        $tweetStylePrompt = $setting !== null && is_string($setting->tweet_style_prompt)
            ? trim($setting->tweet_style_prompt)
            : '';

        $body = "Here are today's cached feed signals:\n\n".$signals."\n\n---\n\n";
        if ($tweetStylePrompt !== '') {
            $body .= "Tweet style guidance (apply this heavily to the tweets list while still staying grounded in feed signals):\n".
                $tweetStylePrompt."\n\n---\n\n";
        }
        $body .= 'Generate the digest: intro_summary plus tweets, shorts, and youtube idea lists as specified.';

        try {
            $agent = PulseDigestAgent::make()
                ->toolMaxRuns(0);

            /** @var PulseDigestOutput $output */
            $output = $agent->structured(
                messages: new UserMessage($body),
                class: PulseDigestOutput::class,
                maxRetries: 2,
            );

            $digest->intro_summary = $output->intro_summary;
            $digest->tweets = $this->normalizeIdeas($output->tweets ?? []);
            $digest->shorts = $this->normalizeIdeas($output->shorts ?? []);
            $digest->youtube = $this->normalizeIdeas($output->youtube ?? []);
            $digest->ideas_status = 'completed';
            $digest->ideas_generated_at = now();
            $digest->ideas_error = null;
            $digest->save();
        } catch (\Throwable $e) {
            Log::error('PulseDigestGenerator::generateAndStore failed', [
                'tenant_id' => $tenantId,
                'error' => $e->getMessage(),
                'exception' => $e::class,
            ]);

            throw $e;
        }
    }

    /**
     * @param  list<mixed>  $items
     * @return list<array{title: string, hook: string, angle: string|null}>
     */
    private function normalizeIdeas(array $items): array
    {
        $out = [];
        foreach ($items as $item) {
            if ($item instanceof PulseDigestIdeaItem) {
                $out[] = [
                    'title' => $item->title,
                    'hook' => $item->hook,
                    'angle' => $item->angle,
                ];
            }
        }

        return $out;
    }
}
