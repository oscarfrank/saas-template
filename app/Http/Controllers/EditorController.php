<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use OpenAI\Laravel\Facades\OpenAI;

final class EditorController extends Controller
{
    /**
     * Generate YouTube-style title ideas + thumbnail text using OpenAI.
     * Expects JSON: { "content": "script/transcript text", "styles": ["emotional", "urgency", ...] }
     * Returns: { "titles": [ { "title": "...", "thumbnailText": "..." }, ... ] }
     */
    public function generateTitleIdeas(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string|max:100000',
            'styles' => 'required|array',
            'styles.*' => 'string|in:emotional,urgency,curiosity,how-to,listicle,question,provocative',
        ]);

        $content = $validated['content'];
        $styles = $validated['styles'];
        $stylesLabel = implode(', ', array_map('ucfirst', $styles));

        $systemPrompt = <<<PROMPT
You are a YouTube growth-focused content strategist.

Your task is to analyze the video script/transcript provided and generate high-performing YouTube titles and thumbnail text optimized for:
- High CTR (click-through rate)
- Strong search intent (SEO) where relevant
- Curiosity + clarity balance
- Human, natural phrasing (not robotic or keyword-stuffed)

Think deeply before responding. Do not rush. Optimize like a creator with experience scaling videos.

DELIVERABLES (output only these, as JSON):

1. TITLES
Generate exactly 5 YouTube titles.
Each title must:
- Be under 70 characters
- Sound natural and conversational
- Trigger curiosity or tension without clickbait lies
- Be optimized for search where relevant
- Avoid repeating the exact same structure across all 5 titles
- Match the requested style(s): {$stylesLabel}

2. THUMBNAIL TEXT
Generate ONE thumbnail text option per title (5 total).
Each thumbnail text must:
- Be 2–3 words max
- Be emotionally punchy or curiosity-driven
- Complement the title (do NOT repeat it)
- Be readable at a glance on mobile

OUTPUT FORMAT
Respond with a single JSON array of exactly 5 objects, no other text or markdown. Each object must have exactly two keys: "title" (string) and "thumbnailText" (string).
Example: [{"title":"Your first title here","thumbnailText":"Two Words"},{"title":"Second title","thumbnailText":"Punchy Phrase"}, ...]
PROMPT;

        $userPrompt = "Requested title style(s): {$stylesLabel}.\n\nHere is the video script/transcript:\n\n" . $content;

        try {
            $response = OpenAI::chat()->create([
                'model' => config('openai.chat_model'),
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                'temperature' => 0.7,
            ]);

            $text = $response->choices[0]->message->content ?? '';
            $text = trim($text);
            // Strip markdown code block if present
            if (preg_match('/^```(?:json)?\s*([\s\S]*?)```\s*$/s', $text, $m)) {
                $text = trim($m[1]);
            }
            $decoded = json_decode($text, true);
            if (! is_array($decoded)) {
                Log::warning('EditorController::generateTitleIdeas invalid JSON', ['response' => $text]);
                return response()->json(['message' => 'Invalid response from AI'], 502);
            }

            $titles = [];
            foreach (array_slice($decoded, 0, 5) as $item) {
                if (isset($item['title']) && is_string($item['title'])) {
                    $titles[] = [
                        'title' => $item['title'],
                        'thumbnailText' => isset($item['thumbnailText']) && is_string($item['thumbnailText'])
                            ? $item['thumbnailText']
                            : '',
                    ];
                }
            }

            return response()->json(['titles' => $titles]);
        } catch (\Throwable $e) {
            Log::error('EditorController::generateTitleIdeas failed', ['error' => $e->getMessage()]);
            return response()->json(
                ['message' => 'Failed to generate ideas. Please try again.'],
                500
            );
        }
    }

    /**
     * Generate YouTube description, related videos, timestamps, and meta tags.
     * Expects JSON: { "content": "script/transcript text" }
     * Returns: { "shortDescription", "relatedVideos": [{ "title", "reason" }], "timestamps": [{ "time", "label" }], "metaTags": "tag1, tag2, ..." }
     */
    public function generateDescriptionAssets(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string|max:100000',
        ]);
        $content = $validated['content'];

        $systemPrompt = <<<'PROMPT'
You are a YouTube growth-focused content strategist.

Analyze the video script/transcript and generate the following. Output ONLY valid JSON with no markdown or extra text.
Do NOT generate related videos — the user will add those manually as "video 1 - ", "video 2 - ", "video 3 - ".

1. SHORT YOUTUBE DESCRIPTION (key "shortDescription")
   - Hook the viewer in the first 2 lines
   - Clearly explain what the video delivers
   - Human, conversational tone
   - Naturally include relevant keywords (no stuffing)
   - Optimized for both viewers and the algorithm

2. TIMESTAMPS (key "timestamps")
   - Based on the script structure. Each object: "time" (e.g. "0:00", "1:23"), "label" (string)
   - Engaging but clear section titles, skimmable

3. META TAGS (key "metaTags")
   - Single string: comma-separated tags. Include broad, mid, and long-tail keywords for search discoverability.

JSON shape (use exactly these keys):
{"shortDescription":"...","timestamps":[{"time":"0:00","label":"..."},...],"metaTags":"tag1, tag2, tag3, ..."}
PROMPT;

        $userPrompt = "Here is the video script/transcript:\n\n" . $content;

        try {
            $response = OpenAI::chat()->create([
                'model' => config('openai.chat_model'),
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                'temperature' => 0.5,
            ]);

            $text = $response->choices[0]->message->content ?? '';
            $text = trim($text);
            if (preg_match('/^```(?:json)?\s*([\s\S]*?)```\s*$/s', $text, $m)) {
                $text = trim($m[1]);
            }
            $data = json_decode($text, true);
            if (! is_array($data)) {
                Log::warning('EditorController::generateDescriptionAssets invalid JSON', ['response' => $text]);
                return response()->json(['message' => 'Invalid response from AI'], 502);
            }

            $shortDescription = isset($data['shortDescription']) && is_string($data['shortDescription'])
                ? $data['shortDescription'] : '';
            $timestamps = [];
            if (isset($data['timestamps']) && is_array($data['timestamps'])) {
                foreach ($data['timestamps'] as $item) {
                    if (is_array($item) && isset($item['time']) && isset($item['label'])) {
                        $timestamps[] = [
                            'time' => (string) $item['time'],
                            'label' => (string) $item['label'],
                        ];
                    }
                }
            }
            $metaTags = isset($data['metaTags']) && is_string($data['metaTags'])
                ? $data['metaTags'] : (is_array($data['metaTags'] ?? null) ? implode(', ', $data['metaTags']) : '');

            return response()->json([
                'shortDescription' => $shortDescription,
                'timestamps' => $timestamps,
                'metaTags' => $metaTags,
            ]);
        } catch (\Throwable $e) {
            Log::error('EditorController::generateDescriptionAssets failed', ['error' => $e->getMessage()]);
            return response()->json(
                ['message' => 'Failed to generate description assets. Please try again.'],
                500
            );
        }
    }
}
