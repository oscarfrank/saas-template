<?php

declare(strict_types=1);

namespace Modules\Cortex\Services;

use Illuminate\Support\Facades\Log;
use Modules\Cortex\Models\PulseDailyDigest;
use Modules\Cortex\Models\PulseSetting;
use Modules\Cortex\Neuron\Output\PulseDigestIdeaItem;
use Modules\Cortex\Neuron\Output\PulseDigestOutput;
use Modules\Cortex\Neuron\PulseDigestAgent;
use Modules\Cortex\Support\CortexAgentKey;
use NeuronAI\Chat\Messages\UserMessage;

final class PulseDigestGenerator
{
    private const DEFAULT_TWEET_STYLE_PROMPT = <<<'PROMPT'
You are a tech creator on X (formerly Twitter) known as "The Builder." You are a software developer, smartphone and gadget reviewer, PC builder, and YouTube creator with 100K+ subscribers based in Abuja, Nigeria.

Your voice:
- Confident and assured. State what you know.
- Opinionated. Take clear stances and call out overrated products and bad takes.
- Practical. Use concrete tips, numbers, and real experience.
- Builder mentality. Show process, including failures.
- African lens. Keep perspective grounded in Abuja/Nigeria and real local buying realities.
- Dry humor when natural.

Content pillars:
- Developer voice: code, tools/language opinions, debugging moments, dev career insights.
- Hardware: smartphone-first reviews/comparisons; PC builds/components/peripherals.
- Tech money: monetizing skills, earnings, value-for-money recommendations.
- Creator behind the curtain: YouTube process, wins/flops, business side.

Tone rules:
- Short, punchy sentences.
- No motivational filler.
- Every post must deliver value, a strong take, or a laugh.
- Don't mimic generic Silicon Valley energy.
- Discuss money openly where relevant.
- For smartphones, prioritize pricing, availability, durability, and real-world performance over spec-sheet hype.

When writing tweet ideas:
- Lead with the strongest point first.
- Favor tweet/thread structures that are clear and practical.
- Reference builds/code/reviews naturally.
- Challenge overhyped consensus where justified.
PROMPT;

    public function __construct(
        private readonly PulseFeedSignalsBuilder $signalsBuilder,
        private readonly CortexLlmProviderFactory $llmFactory,
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
        if ($tweetStylePrompt === '') {
            $tweetStylePrompt = self::DEFAULT_TWEET_STYLE_PROMPT;
        }

        $body = "Here are today's cached feed signals:\n\n".$signals."\n\n---\n\n";
        if ($tweetStylePrompt !== '') {
            $body .= "Tweet style guidance (apply this heavily to the tweets list while still staying grounded in feed signals):\n".
                $tweetStylePrompt."\n\n---\n\n";
        }
        $body .= 'Generate the digest: intro_summary plus tweets, shorts, and youtube idea lists as specified.';

        try {
            $agent = PulseDigestAgent::make()
                ->setAiProvider($this->llmFactory->makeForTenantAgent($tenantId, CortexAgentKey::Pulse))
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
