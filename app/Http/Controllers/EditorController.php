<?php

namespace App\Http\Controllers;

use App\Services\TenantAiPromptResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use OpenAI\Laravel\Facades\OpenAI;

final class EditorController extends Controller
{
    public function __construct(
        private readonly TenantAiPromptResolver $aiPrompts,
    ) {}

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

        // Editor demo routes are not tenant-scoped; use app defaults (no org override).
        $systemPrompt = $this->aiPrompts->resolve(null, 'script.title_ideas', [
            'stylesLabel' => $stylesLabel,
        ]);

        $userPrompt = "Requested title style(s): {$stylesLabel}.\n\nHere is the video script/transcript:\n\n".$content;

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

        $systemPrompt = $this->aiPrompts->resolve(null, 'script.description_assets');

        $userPrompt = "Here is the video script/transcript:\n\n".$content;

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
