<?php

declare(strict_types=1);

namespace Modules\Cortex\Services;

use OpenAI\Laravel\Facades\OpenAI;

final class BaitTitleService
{
    /**
     * @return array{
     *   parsed: array<string, mixed>|null,
     *   raw: string,
     *   attempts: int
     * }
     */
    public function analyzeScript(string $script): array
    {
        $attempts = 0;
        $lastRaw = '';
        $parsed = null;

        while ($attempts < 2 && $parsed === null) {
            $attempts++;
            $lastRaw = $this->chat(
                $this->callOneSystemPrompt(),
                $script,
                0.2
            );
            $parsed = $this->decodeJsonObject($lastRaw);
        }

        return [
            'parsed' => $parsed,
            'raw' => $lastRaw,
            'attempts' => $attempts,
        ];
    }

    public function generateTitles(string $script, array $analysis, string $framingToggle): string
    {
        $payload = implode("\n\n", [
            'ORIGINAL SCRIPT:',
            $script,
            'ANALYSIS JSON OBJECT:',
            json_encode($analysis, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}',
            'FRAMING TOGGLE: '.$framingToggle,
        ]);

        return $this->chat(
            $this->callTwoSystemPrompt(),
            $payload,
            0.5
        );
    }

    /**
     * @return array<string, mixed>|null
     */
    public function decodeJsonObject(string $content): ?array
    {
        $trim = trim($content);

        if ($trim === '') {
            return null;
        }

        if (preg_match('/```(?:json)?\s*([\s\S]*?)\s*```/', $trim, $m)) {
            $trim = trim($m[1]);
        }

        $decoded = json_decode($trim, true);
        if (is_array($decoded)) {
            return $decoded;
        }

        if (preg_match('/\{[\s\S]*\}/', $trim, $m)) {
            $decoded = json_decode($m[0], true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return null;
    }

    private function chat(string $systemInstruction, string $userMessage, float $temperature): string
    {
        $response = OpenAI::chat()->create([
            'model' => config('openai.chat_model', 'gpt-4o-mini'),
            'messages' => [
                ['role' => 'system', 'content' => $systemInstruction],
                ['role' => 'user', 'content' => $userMessage],
            ],
            'temperature' => $temperature,
            'max_completion_tokens' => 4000,
        ]);

        $content = $response->choices[0]->message->content ?? '';

        return trim(is_string($content) ? $content : '');
    }

    private function callOneSystemPrompt(): string
    {
        return <<<'TXT'
You are a script analyst. Your job is NOT to generate titles yet. Read this script deeply and return a structured JSON analysis object with the following fields:
- core_promise: The single transformation, revelation, or payoff the viewer gets from watching. One sentence.
- aha_moment: The most surprising, counterintuitive, or "wait, really?" claim in the script. One sentence.
- emotional_arc: The emotional journey of the video (e.g., confusion → clarity, fear → relief). One sentence.
- target_viewer: Who this video is for, what pain or desire they have, and what emotional state they're likely in when searching. Two to three sentences.
- concrete_specifics: An array of any numbers, timeframes, names, dollar amounts, or specific claims in the script that could make a title feel real and credible.
- search_queries: An array of 3 to 5 raw search phrases this viewer would actually type into YouTube.
- consensus_belief: The widely held assumption in this niche that the script either challenges, confirms, or reframes. One sentence.
- title_risk_flag: Any claim in the script that sounds clickable but that the video does NOT fully deliver on. Be honest. This is used to prevent overpromising.

Return only valid JSON. No preamble, no explanation.
TXT;
    }

    private function callTwoSystemPrompt(): string
    {
        return <<<'TXT'
You are a world-class YouTube title strategist. You have been given a full script and a deep analysis of it. Your job is to go through the following stages in order and show your reasoning at each one.

---

Stage 1 - Pattern Generation
Using the analysis provided, generate one title candidate for each of the following patterns. Use the actual script content - no generic placeholders:
- The Contrarian: challenges a consensus belief
- The Specific Number: leads with a concrete data point or result
- The Curiosity Gap: creates an open loop the viewer must close
- The Stakes Raiser: makes the cost of not watching feel real
- The Identity Signal: speaks directly to a specific type of person
- The Before/After: implies a transformation with a timeframe
- The Insider Reveal: implies access to knowledge others don't share

If the framing toggle is set to Polarizing Take: up-rank Contrarian and Stakes Raiser patterns - generate two variants for each instead of one, and mark them.
If the framing toggle is set to Strong Opinion: shift all titles toward first-person conviction language. Use words like "actually," "always," "never," "stop," "the truth about." Generate an additional conviction-framed variant for your top three patterns.
If the framing toggle is set to Contrarian Framing: identify the consensus belief from the analysis object. Check whether the script genuinely supports the opposite position. If yes - build the title around that inversion. If only partially - flag it explicitly and still generate the title but mark it as [Partially Supported].
If the framing toggle is None: proceed with standard weighting across all patterns.

---

Stage 2 - Multi-Criteria Scoring
Score every title candidate on these dimensions from 0 to 10:
- curiosity_gap: Does it create an open loop in the brain?
- specificity: Does it contain a concrete detail that makes it feel real?
- search_alignment: Would someone actually type this or a close variant?
- emotional_charge: Does it trigger a clear emotion - fear, ambition, FOMO, or curiosity?
- clarity: Can the premise be understood in under 3 seconds?
- authenticity: Does the script actually deliver on this title's promise? Cross-check against title_risk_flag from the analysis.
- thumbnail_compatibility: Could 3 to 5 words from this title sit on a thumbnail image and still make sense standalone?

If the framing toggle is Polarizing Take, Strong Opinion, or Contrarian Framing: add an eighth scoring dimension called tension_score - does this title create mild cognitive friction or a "wait, I'm not sure I agree" reaction in the viewer? Weight this at 1.5x when calculating the total.

Calculate a total score for each title. Show the breakdown.

---

Stage 3 - Adversarial Stress Test
Take the top 5 scoring titles and run each through these five tests. Mark each as PASS or FAIL:
- so_what_test: If someone reads this and thinks "so what?" - FAIL
- obvious_already_test: If the viewer feels they already know this - FAIL
- too_vague_test: Could this title apply to 1,000 other videos? - FAIL
- overpromise_test: Would a viewer feel deceived after watching? - FAIL. Note: if the framing toggle is active, apply this test at a stricter threshold.
- 5am_scroll_test: Would someone half-asleep on their phone stop for this? - FAIL if not

Eliminate any title that fails two or more tests.

---

Stage 4 - Final Selection
From the surviving titles, select the winner using this criterion: which title has the highest gap between what the viewer currently knows and what they now want to find out?

Return your output in this format:

WINNER
Title: [title]
Why it wins: [one to two sentences explaining specifically why this title beats the others - reference the script content, not generic reasoning]

RUNNER UP 1
Title: [title]
Best used when: [e.g., "if SEO is the priority" or "if your audience skews more advanced"]

RUNNER UP 2
Title: [title]
Best used when: [e.g., "if you want to A/B test a more neutral angle"]

ELIMINATED TITLES
List each eliminated title and the specific test(s) it failed.

ANALYST NOTE (only include if title_risk_flag was non-empty in the analysis)
Flag any winner or runner-up that comes close to the risk zone identified in the analysis. Be direct.
TXT;
    }
}
