<?php

namespace Modules\Script\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client;
use GuzzleHttp\Psr7\HttpFactory;
use MrMySQL\YoutubeTranscript\Exception\NoTranscriptAvailableException;
use MrMySQL\YoutubeTranscript\Exception\NoTranscriptFoundException;
use MrMySQL\YoutubeTranscript\Exception\TranscriptsDisabledException;
use MrMySQL\YoutubeTranscript\Exception\TooManyRequestsException;
use MrMySQL\YoutubeTranscript\Exception\YouTubeRequestFailedException;
use MrMySQL\YoutubeTranscript\TranscriptListFetcher;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Script\Models\Script;
use Modules\Script\Models\ScriptCollaborator;
use Modules\Script\Models\ScriptThumbnail;
use Modules\Script\Models\ScriptType;
use OpenAI\Laravel\Facades\OpenAI;

final class ScriptController extends Controller
{
    protected function ensureDefaultScriptTypes(string $tenantId): void
    {
        if (ScriptType::where('tenant_id', $tenantId)->exists()) {
            return;
        }
        $defaults = [
            ['name' => 'YouTube', 'slug' => 'youtube', 'sort_order' => 1],
            ['name' => 'TikTok', 'slug' => 'tiktok', 'sort_order' => 2],
            ['name' => 'Instagram', 'slug' => 'instagram', 'sort_order' => 3],
            ['name' => 'Podcast', 'slug' => 'podcast', 'sort_order' => 4],
            ['name' => 'General', 'slug' => 'general', 'sort_order' => 5],
        ];
        foreach ($defaults as $item) {
            ScriptType::create([
                'tenant_id' => $tenantId,
                'name' => $item['name'],
                'slug' => $item['slug'],
                'is_active' => true,
                'sort_order' => $item['sort_order'],
            ]);
        }
    }

    /**
     * List all scripts for the organization.
     * Supports sort, filter (category, status, production, date range), and search via query params.
     */
    public function index(Request $request): Response
    {
        $tenantId = tenant('id');
        $this->ensureDefaultScriptTypes($tenantId);

        $user = $request->user();
        $trashed = $request->boolean('trashed');
        $query = Script::query()
            ->with(['scriptType', 'titleOptions'])
            ->where('tenant_id', $tenantId)
            ->where(function ($q) use ($user) {
                $q->where('created_by', $user?->id);
                $q->orWhereHas('collaborators', fn ($c) => $c->where('user_id', $user?->id));
            });

        if ($trashed) {
            $query->onlyTrashed();
        }

        // Search
        $search = $request->filled('search') ? trim($request->search) : null;
        if ($search !== null && $search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%'.$search.'%')
                    ->orWhere('description', 'like', '%'.$search.'%')
                    ->orWhere('meta_tags', 'like', '%'.$search.'%');
            });
        }

        // Filters: category (script_type_id), status, production_status, date range
        // Normalize array params (Laravel/Inertia may send single value or array)
        $scriptTypeIds = $request->input('script_type_id', []);
        $scriptTypeIds = is_array($scriptTypeIds) ? $scriptTypeIds : (is_scalar($scriptTypeIds) && $scriptTypeIds !== '' ? [$scriptTypeIds] : []);
        $scriptTypeIds = array_values(array_map('intval', array_filter($scriptTypeIds)));
        if (count($scriptTypeIds) > 0) {
            $query->whereIn('script_type_id', $scriptTypeIds);
        }
        $statuses = $request->input('status', []);
        $statuses = is_array($statuses) ? $statuses : (is_scalar($statuses) && $statuses !== '' ? [$statuses] : []);
        $statusAllowed = ['draft', 'writing', 'completed', 'published', 'in_review', 'archived'];
        $statuses = array_values(array_intersect($statuses, $statusAllowed));
        if (count($statuses) > 0) {
            $query->whereIn('status', $statuses);
        }
        $productionStatuses = $request->input('production_status', []);
        $productionStatuses = is_array($productionStatuses) ? $productionStatuses : (is_scalar($productionStatuses) && $productionStatuses !== '' ? [$productionStatuses] : []);
        $productionAllowed = ['not_shot', 'shot', 'editing', 'edited'];
        $productionStatuses = array_values(array_intersect($productionStatuses, $productionAllowed));
        if (count($productionStatuses) > 0) {
            $query->whereIn('production_status', $productionStatuses);
        }
        $dateField = $request->input('date_field');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $dateFields = ['created_at', 'updated_at', 'scheduled_at'];
        if (in_array($dateField, $dateFields, true) && ($dateFrom !== null || $dateTo !== null)) {
            if ($dateFrom !== null && $dateFrom !== '') {
                $query->whereDate($dateField, '>=', $dateFrom);
            }
            if ($dateTo !== null && $dateTo !== '') {
                $query->whereDate($dateField, '<=', $dateTo);
            }
        }

        // Sort
        $sort = $request->input('sort', $trashed ? 'deleted_desc' : 'updated_desc');
        $sortColumn = 'updated_at';
        $sortDir = 'desc';
        $sortMap = [
            'updated_desc' => ['updated_at', 'desc'],
            'updated_asc' => ['updated_at', 'asc'],
            'created_desc' => ['created_at', 'desc'],
            'created_asc' => ['created_at', 'asc'],
            'title_asc' => ['title', 'asc'],
            'title_desc' => ['title', 'desc'],
            'scheduled_desc' => ['scheduled_at', 'desc'],
            'scheduled_asc' => ['scheduled_at', 'asc'],
            'deleted_desc' => ['deleted_at', 'desc'],
            'deleted_asc' => ['deleted_at', 'asc'],
        ];
        if (isset($sortMap[$sort])) {
            [$sortColumn, $sortDir] = $sortMap[$sort];
        } elseif ($trashed) {
            $sortColumn = 'deleted_at';
            $sortDir = 'desc';
        }
        if ($sortColumn === 'scheduled_at') {
            $query->orderByRaw('scheduled_at IS NULL')->orderBy($sortColumn, $sortDir);
        } else {
            $query->orderBy($sortColumn, $sortDir);
        }

        $scripts = $query->get()->map(fn (Script $script) => $this->formatScriptForList($script));

        $scriptTypes = ScriptType::where('tenant_id', $tenantId)
            ->active()
            ->ordered()
            ->get(['id', 'name', 'slug']);

        return Inertia::render('script/index', [
            'scripts' => $scripts,
            'trashed' => $trashed,
            'scriptTypes' => $scriptTypes,
            'filters' => [
                'search' => $search,
                'script_type_id' => $scriptTypeIds,
                'status' => $statuses,
                'production_status' => $productionStatuses,
                'date_field' => in_array($dateField, $dateFields, true) ? $dateField : null,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'sort' => $sort,
        ]);
    }

    /**
     * Show the new-script editor (create form).
     */
    public function create(Request $request): Response
    {
        $tenantId = tenant('id');
        $this->ensureDefaultScriptTypes($tenantId);

        $scriptTypes = ScriptType::where('tenant_id', $tenantId)
            ->active()
            ->ordered()
            ->get(['id', 'name', 'slug']);

        return Inertia::render('script/Form', [
            'script' => null,
            'scriptTypes' => $scriptTypes,
        ]);
    }

    /**
     * Store a new script.
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'thumbnail_text' => 'nullable|string|max:255',
            'script_type_id' => 'nullable|exists:script_types,id',
            'content' => 'nullable|array',
            'description' => 'nullable|string',
            'meta_tags' => 'nullable|string|max:600',
            'live_video_url' => 'nullable|url|max:500',
            'status' => 'nullable|string|in:draft,writing,completed,published,in_review,archived',
            'production_status' => 'nullable|string|in:not_shot,shot,editing,edited',
            'scheduled_at' => 'nullable|date',
            'title_options' => 'nullable|array',
            'title_options.*.title' => 'required_with:title_options|string|max:255',
            'title_options.*.thumbnail_text' => 'nullable|string|max:255',
            'title_options.*.is_primary' => 'nullable|boolean',
            'custom_attributes' => 'nullable|array',
        ]);

        $tenantId = tenant('id');
        $userId = $request->user()?->id;
        $customAttrs = $validated['custom_attributes'] ?? [];

        $script = Script::create([
            'tenant_id' => $tenantId,
            'script_type_id' => $validated['script_type_id'] ?? null,
            'created_by' => $userId,
            'updated_by' => $userId,
            'title' => $validated['title'] ?? 'Untitled script',
            'thumbnail_text' => $validated['thumbnail_text'] ?? null,
            'content' => $validated['content'] ?? null,
            'description' => $validated['description'] ?? null,
            'meta_tags' => $validated['meta_tags'] ?? null,
            'live_video_url' => $validated['live_video_url'] ?? null,
            'status' => $validated['status'] ?? 'draft',
            'production_status' => $validated['production_status'] ?? 'not_shot',
            'scheduled_at' => isset($validated['scheduled_at']) ? $validated['scheduled_at'] : null,
            'custom_attributes' => $customAttrs ?: null,
        ]);

        if (! empty($validated['title_options'])) {
            $script->syncTitleOptionsFromArray($validated['title_options']);
        } elseif ($validated['title'] ?? null) {
            $script->titleOptions()->create([
                'title' => $script->title,
                'thumbnail_text' => $script->thumbnail_text,
                'is_primary' => true,
                'sort_order' => 0,
            ]);
        }

        $editUrl = route('script.edit', ['tenant' => tenant('slug'), 'script' => $script->uuid]);

        // Return JSON for AJAX/autosave requests
        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'redirect_url' => $editUrl,
                'uuid' => $script->uuid,
            ]);
        }

        return redirect($editUrl)->with('success', 'Script created.');
    }

    /**
     * Show the script editor (edit form).
     */
    public function edit(Request $request, Script $script): Response|RedirectResponse
    {
        $tenantId = tenant('id');
        if ($script->tenant_id !== $tenantId) {
            abort(404);
        }
        if (! $script->canView($request->user())) {
            abort(403, 'You do not have access to this script.');
        }

        $this->ensureDefaultScriptTypes($tenantId);

        $script->load(['scriptType', 'titleOptions', 'thumbnails']);
        $scriptTypes = ScriptType::where('tenant_id', $tenantId)
            ->active()
            ->ordered()
            ->get(['id', 'name', 'slug']);

        $user = $request->user();
        return Inertia::render('script/Form', [
            'script' => Inertia::defer(fn () => $this->formatScriptForEdit($script, $user)),
            'scriptTypes' => $scriptTypes,
        ]);
    }

    /**
     * Update the script.
     */
    public function update(Request $request, Script $script): RedirectResponse|JsonResponse
    {
        $tenantId = tenant('id');
        if ($script->tenant_id !== $tenantId) {
            abort(404);
        }
        if (! $script->canEdit($request->user())) {
            abort(403, 'You do not have permission to edit this script.');
        }

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'thumbnail_text' => 'nullable|string|max:255',
            'script_type_id' => 'nullable|exists:script_types,id',
            'content' => 'nullable|array',
            'description' => 'nullable|string',
            'meta_tags' => 'nullable|string|max:600',
            'live_video_url' => 'nullable|url|max:500',
            'status' => 'nullable|string|in:draft,writing,completed,published,in_review,archived',
            'production_status' => 'nullable|string|in:not_shot,shot,editing,edited',
            'scheduled_at' => 'nullable|date',
            'title_options' => 'nullable|array',
            'title_options.*.id' => 'nullable|integer|exists:script_title_options,id',
            'title_options.*.title' => 'required_with:title_options|string|max:255',
            'title_options.*.thumbnail_text' => 'nullable|string|max:255',
            'title_options.*.is_primary' => 'nullable|boolean',
            'custom_attributes' => 'nullable|array',
        ]);

        $customAttrs = array_key_exists('custom_attributes', $validated) ? $validated['custom_attributes'] : null;
        $updatePayload = [
            'script_type_id' => $validated['script_type_id'] ?? $script->script_type_id,
            'updated_by' => $request->user()?->id,
            'title' => $validated['title'] ?? $script->title,
            'thumbnail_text' => $validated['thumbnail_text'] ?? $script->thumbnail_text,
            'content' => $validated['content'] ?? $script->content,
            'description' => $validated['description'] ?? $script->description,
            'meta_tags' => $validated['meta_tags'] ?? $script->meta_tags,
            'live_video_url' => $validated['live_video_url'] ?? $script->live_video_url,
            'status' => $validated['status'] ?? $script->status,
            'production_status' => $validated['production_status'] ?? $script->production_status,
            'scheduled_at' => array_key_exists('scheduled_at', $validated) ? ($validated['scheduled_at'] ?? null) : $script->scheduled_at,
        ];
        if ($customAttrs !== null) {
            $existing = $script->custom_attributes ?? [];
            $updatePayload['custom_attributes'] = array_merge($existing, $customAttrs);
        }
        $script->update($updatePayload);

        if (array_key_exists('title_options', $validated)) {
            $script->syncTitleOptionsFromArray($validated['title_options'] ?? []);
        }

        // Return JSON for AJAX/autosave requests
        if ($request->expectsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('success', 'Script updated.');
    }

    /**
     * Soft delete the script.
     */
    public function destroy(Request $request, Script $script): RedirectResponse
    {
        $tenantId = tenant('id');
        if ($script->tenant_id !== $tenantId) {
            abort(404);
        }
        if (! $script->canDelete($request->user())) {
            abort(403, 'You do not have permission to delete this script.');
        }
        $script->delete();
        return redirect()->route('script.index', ['tenant' => tenant('slug')])
            ->with('success', 'Script moved to recycle bin.');
    }

    /**
     * Restore a script from the recycle bin.
     */
    public function restore(Request $request, string $script): RedirectResponse
    {
        $tenantId = tenant('id');
        $scriptModel = Script::withTrashed()
            ->where('tenant_id', $tenantId)
            ->where('uuid', $script)
            ->firstOrFail();
        if (! $scriptModel->canDelete($request->user())) {
            abort(403, 'You do not have permission to restore this script.');
        }
        $scriptModel->restore();
        return redirect()->route('script.index', ['tenant' => tenant('slug')])
            ->with('success', 'Script restored.');
    }

    /**
     * Permanently delete a script and all its data (title options, thumbnails, etc.). Cannot be undone.
     */
    public function forceDestroy(Request $request, string $script): RedirectResponse
    {
        $tenantId = tenant('id');
        $scriptModel = Script::withTrashed()
            ->where('tenant_id', $tenantId)
            ->where('uuid', $script)
            ->firstOrFail();
        if (! $scriptModel->canDelete($request->user())) {
            abort(403, 'You do not have permission to permanently delete this script.');
        }
        $scriptModel->forceDelete();
        return redirect()->route('script.index', ['tenant' => tenant('slug'), 'trashed' => 1])
            ->with('success', 'Script permanently deleted.');
    }

    /**
     * Soft-delete all scripts for the current tenant (move all to recycle bin). Only scripts the user can delete are affected.
     */
    public function deleteAll(Request $request): RedirectResponse
    {
        $tenantId = tenant('id');
        $user = $request->user();
        $scripts = Script::where('tenant_id', $tenantId)->get();
        $toDelete = $scripts->filter(fn (Script $s) => $s->canDelete($user));
        $count = 0;
        foreach ($toDelete as $script) {
            $script->delete();
            $count++;
        }
        $message = $count > 0
            ? "{$count} script(s) moved to recycle bin."
            : 'No scripts were deleted.';

        return redirect()->route('script.index', ['tenant' => tenant('slug')])
            ->with('success', $message);
    }

    /**
     * Permanently delete all scripts in the recycle bin for the current tenant. Cannot be undone.
     */
    public function emptyTrash(Request $request): RedirectResponse
    {
        $tenantId = tenant('id');
        $user = $request->user();
        $scripts = Script::onlyTrashed()->where('tenant_id', $tenantId)->get();
        $toDelete = $scripts->filter(fn (Script $s) => $s->canDelete($user));
        $count = 0;
        foreach ($toDelete as $script) {
            $script->forceDelete();
            $count++;
        }
        $message = $count > 0
            ? "{$count} script(s) permanently deleted."
            : 'Recycle bin was already empty.';

        return redirect()->route('script.index', ['tenant' => tenant('slug'), 'trashed' => 1])
            ->with('success', $message);
    }

    /**
     * Generate YouTube-style title ideas + thumbnail text using OpenAI.
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
            if (preg_match('/^```(?:json)?\s*([\s\S]*?)```\s*$/s', $text, $m)) {
                $text = trim($m[1]);
            }
            $decoded = json_decode($text, true);
            if (! is_array($decoded)) {
                Log::warning('ScriptController::generateTitleIdeas invalid JSON', ['response' => $text]);
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
            Log::error('ScriptController::generateTitleIdeas failed', ['error' => $e->getMessage()]);
            return response()->json(
                ['message' => 'Failed to generate ideas. Please try again.'],
                500
            );
        }
    }

    /**
     * AI edit: rewrite a selected portion of the script based on user instruction.
     */
    public function aiEditSelection(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string|max:100000',
            'selected_text' => 'required|string|max:50000',
            'instruction' => 'required|string|max:2000',
        ]);

        $content = $validated['content'];
        $selectedText = $validated['selected_text'];
        $instruction = $validated['instruction'];

        $systemPrompt = <<<'PROMPT'
You are an expert editor. The user will give you:
1. A full script (for context)
2. A selected excerpt from that script
3. An instruction (e.g. "rewrite to be more conversational", "make the intro punchier")

Your task: apply the instruction ONLY to the selected excerpt. Return ONLY the rewritten excerpt as plain text. Do not include the rest of the script, no markdown, no quotes, no explanation. Preserve the same general length and structure unless the instruction asks otherwise.
PROMPT;

        $userPrompt = "Full script (for context):\n\n" . $content . "\n\n---\n\nSelected excerpt to rewrite:\n\n" . $selectedText . "\n\n---\n\nInstruction: " . $instruction;

        try {
            $response = OpenAI::chat()->create([
                'model' => config('openai.chat_model'),
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                'max_completion_tokens' => 4096,
            ]);

            $rewritten = trim($response->choices[0]->message->content ?? '');
            if ($rewritten === '') {
                return response()->json(['message' => 'No rewrite returned. Try a different instruction.'], 422);
            }

            return response()->json(['rewritten' => $rewritten]);
        } catch (\Throwable $e) {
            Log::error('ScriptController::aiEditSelection failed', ['error' => $e->getMessage()]);
            return response()->json(
                ['message' => 'AI edit failed. Please try again.'],
                500
            );
        }
    }

    /**
     * Preset script AI actions: intro, outro, hook, shorten, expand, casual, add_example.
     */
    public function aiScriptAction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'required|string|in:intro,outro,hook,shorten,expand,casual,add_example',
            'content' => 'nullable|string|max:100000',
            'full_script' => 'nullable|string|max:100000',
        ]);
        $action = $validated['action'];
        $content = $validated['content'] ?? '';
        $fullScript = $validated['full_script'] ?? $content;

        $anchorFramework = <<<'ANCHORS'
Use this hook/anchor framework. The 10 anchors are: Risk; Conflict / Accusation; Remove Soft Language; Short, Punchy Sentences; Uncomfortable Truth; Contradiction; Bigger Question Framing; Shift from Review to Revelation; Stronger Conviction; Higher Emotional Tension.
You MUST: (1) Pick ONE of these as the primary anchor for the hook. (2) Weave in at least TWO other anchors from the list as supporting enhancers. Apply them in the writing—do not list their names in the output. Then output only the script, no explanation or labels.
ANCHORS;

        $instructions = [
            'intro' => $anchorFramework . ' Write a short, punchy YouTube video intro (first 30–60 seconds). Hook the viewer immediately.',
            'outro' => 'Write a short YouTube video outro. Include a clear call to action (subscribe, like, link in description). Output only the outro script, no explanation.',
            'hook' => $anchorFramework . ' Write a strong hook for the first 15–30 seconds of this script. One or two sentences that grab attention.',
            'shorten' => 'Shorten this text while keeping the main point. Keep it conversational. Output only the shortened text.',
            'expand' => 'Expand this with a bit more detail or an example. Keep the same tone. Output only the expanded text.',
            'casual' => 'Rewrite this to sound more casual and conversational, as if speaking to a friend. Output only the rewritten text.',
            'add_example' => 'Add a brief, concrete example to illustrate the point. Keep the original and add the example naturally. Output only the revised text.',
        ];
        $systemPrompt = 'You are an expert YouTube script editor. Apply the user\'s instruction. Return ONLY the requested text—no markdown, no quotes, no meta-commentary.';
        $userPrompt = $action === 'intro' || $action === 'outro' || $action === 'hook'
            ? "Script (for context):\n\n" . $fullScript . "\n\n---\n\nInstruction: " . $instructions[$action]
            : "Text to edit:\n\n" . $content . "\n\n---\n\nInstruction: " . $instructions[$action];

        try {
            $response = OpenAI::chat()->create([
                'model' => config('openai.chat_model'),
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                'max_completion_tokens' => 4096,
            ]);
            $text = trim($response->choices[0]->message->content ?? '');
            if ($text === '') {
                return response()->json(['message' => 'No response from AI. Try again.'], 422);
            }
            return response()->json(['text' => $text]);
        } catch (\Throwable $e) {
            Log::error('ScriptController::aiScriptAction failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'AI action failed. Please try again.'], 500);
        }
    }

    /**
     * List current user's script snippets.
     */
    public function snippetsIndex(Request $request): JsonResponse
    {
        $tenantId = tenant('id');
        $userId = $request->user()?->id;
        if (! $userId) {
            return response()->json(['snippets' => []]);
        }
        $snippets = ScriptSnippet::where('tenant_id', $tenantId)
            ->where('user_id', $userId)
            ->orderBy('title')
            ->get(['id', 'title', 'body']);
        return response()->json(['snippets' => $snippets]);
    }

    /**
     * Create a script snippet.
     */
    public function snippetsStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string|max:10000',
        ]);
        $tenantId = tenant('id');
        $userId = $request->user()?->id;
        if (! $userId) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        $snippet = ScriptSnippet::create([
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'title' => $validated['title'],
            'body' => $validated['body'],
        ]);
        return response()->json(['snippet' => ['id' => $snippet->id, 'title' => $snippet->title, 'body' => $snippet->body]]);
    }

    /**
     * Delete a script snippet.
     */
    public function snippetsDestroy(Request $request, int $id): JsonResponse
    {
        $tenantId = tenant('id');
        $userId = $request->user()?->id;
        $snippet = ScriptSnippet::where('id', $id)->where('tenant_id', $tenantId)->where('user_id', $userId)->first();
        if (! $snippet) {
            return response()->json(['message' => 'Snippet not found.'], 404);
        }
        $snippet->delete();
        return response()->json(['success' => true]);
    }

    /**
     * Extract JSON string from AI response that may be wrapped in markdown or have extra text.
     */
    private static function extractJsonFromAnalysisResponse(string $text): string
    {
        $text = trim($text);
        if ($text === '') {
            return '{}';
        }
        // Strip markdown code fence (optional "json" tag, allow content before/after)
        if (preg_match('/```(?:json)?\s*([\s\S]*?)```/s', $text, $m)) {
            return trim($m[1]);
        }
        // Find first { and last } to extract a single JSON object
        $start = strpos($text, '{');
        if ($start !== false) {
            $end = strrpos($text, '}');
            if ($end !== false && $end > $start) {
                return substr($text, $start, $end - $start + 1);
            }
        }
        return $text;
    }

    /**
     * Analyze script (e.g. retention). Returns analysis markdown + suggestions with applyable snippets.
     * Route: POST script/analyze (script.analyze)
     */
    public function analyzeScript(Request $request): JsonResponse
    {
        set_time_limit(180);
        $validated = $request->validate([
            'type' => 'required|string|in:retention,cta,storytelling,readability',
            'content' => 'required|string|max:100000',
        ]);
        $type = $validated['type'];
        $content = $validated['content'];

        if ($type === 'readability') {
            return response()->json([
                'analysis' => '',
                'suggestions' => [],
                'message' => 'Use the Analysis panel and choose Readability for local stats.',
            ]);
        }

        $retentionSystemPrompt = <<<'PROMPT'
You are a YouTube retention strategist. Optimize for: viewer retention, emotional engagement, personality, authority, watch time. Creator style: tech YouTuber, calm authority, rational, slightly playful.

Your output has two parts only:

1. A SHORT explanation (2–4 sentences): overall retention strength, the main thing to improve, and that the suggestions below are the concrete edits to consider. No long lists, no scores, no section-by-section breakdown. Keep it brief.

2. Concrete replacement suggestions: specific phrases or short passages in the script that you rewrite for better retention/engagement. Each suggestion will be inserted above the original so the user can compare.

You MUST respond with ONLY valid JSON (no markdown code fence, no extra text). Use exactly these keys:
- "analysis": string, the SHORT explanation only (2–4 sentences, plain text or minimal markdown).
- "suggestions": array of objects, each with "label" (short name, e.g. "Hook", "Pacing"), "originalSnippet" (exact 15–40 word quote from the script that must appear verbatim so we can locate it), "suggestedText" (the rewritten version to insert above the original). Provide at least 1 and up to 5 suggestions. The originalSnippet must be copied exactly from the script.
PROMPT;

        $ctaSystemPrompt = <<<'PROMPT'
You are a YouTube growth strategist focused on calls to action and conversion. The creator wants to drive actions (subscribe, like, link in description, product, etc.) without feeling pushy.

Your output has two parts only:

1. A SHORT explanation (2–4 sentences): how strong the CTAs are, where they land, and the main thing to improve. Then say the suggestions below are concrete edits to consider. Keep it brief.

2. Concrete replacement suggestions: specific phrases or short passages in the script where the CTA is weak, missing, or could be more effective. Rewrite them so the ask feels earned and clear. Each suggestion will be inserted above the original so the user can compare. Provide at least 1 and up to 5 suggestions. The originalSnippet must be an exact 15–40 word quote from the script so we can locate it.

You MUST respond with ONLY valid JSON (no markdown code fence, no extra text). Use exactly these keys:
- "analysis": string, the SHORT explanation only (2–4 sentences, plain text or minimal markdown).
- "suggestions": array of objects, each with "label" (short name, e.g. "Subscribe CTA", "Link CTA"), "originalSnippet" (exact 15–40 word quote from the script that must appear verbatim), "suggestedText" (the rewritten version to insert above the original). The originalSnippet must be copied exactly from the script.
PROMPT;

        $storytellingSystemPrompt = <<<'PROMPT'
You are a storytelling and narrative coach for video scripts. Focus on: narrative arc, tension and release, clarity of the "story", and where the script goes flat or loses the thread.

Your output has two parts only:

1. A SHORT explanation (2–4 sentences): overall narrative strength, where the story holds or drops, and the main thing to improve. Then say the suggestions below are concrete edits to consider. Keep it brief.

2. Concrete replacement suggestions: specific phrases or short passages in the script where the narrative could be stronger—better transitions, clearer stakes, a punchier beat, or a line that reinforces the arc. Each suggestion will be inserted above the original so the user can compare. Provide at least 1 and up to 5 suggestions. The originalSnippet must be an exact 15–40 word quote from the script so we can locate it.

You MUST respond with ONLY valid JSON (no markdown code fence, no extra text). Use exactly these keys:
- "analysis": string, the SHORT explanation only (2–4 sentences, plain text or minimal markdown).
- "suggestions": array of objects, each with "label" (short name, e.g. "Transition", "Stakes"), "originalSnippet" (exact 15–40 word quote from the script that must appear verbatim), "suggestedText" (the rewritten version to insert above the original). The originalSnippet must be copied exactly from the script.
PROMPT;

        $systemPrompt = match ($type) {
            'retention' => $retentionSystemPrompt,
            'cta' => $ctaSystemPrompt,
            'storytelling' => $storytellingSystemPrompt,
            default => $retentionSystemPrompt,
        };

        try {
            $response = OpenAI::chat()->create([
                'model' => config('openai.chat_model'),
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => "Here is my script:\n\n" . $content],
                ],
                'max_completion_tokens' => 4096,
                'temperature' => 0.4,
            ]);
            $text = trim($response->choices[0]->message->content ?? '');
            $text = self::extractJsonFromAnalysisResponse($text);
            $data = json_decode($text, true);
            if (! is_array($data)) {
                Log::warning('ScriptController::analyzeScript invalid JSON', ['response' => substr($text, 0, 500)]);
                return response()->json(['message' => 'Invalid response from AI. Please try again.'], 502);
            }
            $analysis = isset($data['analysis']) && is_string($data['analysis']) ? $data['analysis'] : $text;
            $suggestions = [];
            if (isset($data['suggestions']) && is_array($data['suggestions'])) {
                foreach ($data['suggestions'] as $item) {
                    if (is_array($item) && ! empty($item['originalSnippet']) && ! empty($item['suggestedText'])) {
                        $suggestions[] = [
                            'label' => isset($item['label']) ? (string) $item['label'] : 'Suggestion',
                            'originalSnippet' => (string) $item['originalSnippet'],
                            'suggestedText' => (string) $item['suggestedText'],
                        ];
                    }
                }
            }
            return response()->json([
                'analysis' => $analysis,
                'suggestions' => $suggestions,
            ]);
        } catch (\Throwable $e) {
            Log::error('ScriptController::analyzeScript failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Analysis failed. Please try again.'], 500);
        }
    }

    /**
     * Generate a short-form script from a full script (interactive, conversational, punchy).
     * Route: POST script/generate-short
     */
    public function generateShort(Request $request): JsonResponse
    {
        set_time_limit(120);
        $validated = $request->validate([
            'content' => 'required|string|max:100000',
        ]);
        $content = $validated['content'];

        $systemPrompt = <<<'PROMPT'
You are a short-form video script writer. Turn a long-form script into a SHORT version (e.g. for YouTube Shorts, TikTok, Reels).

The short must be:
- Interactive and engaging: hooks, questions, direct address to the viewer
- Conversational and natural, like talking to a friend
- Punchy and concise: short sentences, no fluff
- Optionally funny or witty where it fits the topic
- Designed for vertical/short format: strong opening, clear beats, satisfying end in 60–90 seconds when read aloud

Output ONLY the short script as plain text. No titles, no stage directions, no "Short script:" prefix. Just the script the creator will read. Use line breaks between paragraphs/beats. Do not add meta commentary.
PROMPT;

        try {
            $response = OpenAI::chat()->create([
                'model' => config('openai.chat_model'),
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => "Turn this full script into a short:\n\n" . $content],
                ],
                'max_completion_tokens' => 2048,
                'temperature' => 0.6,
            ]);
            $shortScript = trim($response->choices[0]->message->content ?? '');
            if ($shortScript === '') {
                return response()->json(['message' => 'No short script generated. Try again.'], 422);
            }
            return response()->json(['short_script' => $shortScript]);
        } catch (\Throwable $e) {
            Log::error('ScriptController::generateShort failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Could not generate short. Please try again.'], 500);
        }
    }

    /**
     * Generate YouTube description, timestamps, and meta tags.
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
                Log::warning('ScriptController::generateDescriptionAssets invalid JSON', ['response' => $text]);
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
            Log::error('ScriptController::generateDescriptionAssets failed', ['error' => $e->getMessage()]);
            return response()->json(
                ['message' => 'Failed to generate description assets. Please try again.'],
                500
            );
        }
    }

    private function formatScriptForList(Script $script): array
    {
        $type = $script->scriptType;
        $platform = $type ? strtolower($type->slug) : 'general';
        $validPlatforms = ['youtube', 'tiktok', 'instagram', 'podcast', 'general'];
        if (! in_array($platform, $validPlatforms)) {
            $platform = 'general';
        }

        $row = [
            'id' => $script->id,
            'uuid' => $script->uuid,
            'title' => $script->title,
            'excerpt' => $script->description
                ? \Illuminate\Support\Str::limit(strip_tags($script->description), 160)
                : 'No description yet.',
            'platform' => $platform,
            'updatedAt' => $script->updated_at->diffForHumans(),
            'script_type_id' => $script->script_type_id,
            'status' => $script->status,
            'production_status' => $script->production_status,
            'created_at' => $script->created_at?->toIso8601String(),
            'scheduled_at' => $script->scheduled_at?->toIso8601String(),
        ];
        if ($script->trashed()) {
            $row['deleted_at'] = $script->deleted_at?->toIso8601String();
            $row['deleted_at_human'] = $script->deleted_at?->diffForHumans();
        }
        return $row;
    }

    private function formatScriptForEdit(Script $script, $user): array
    {
        return [
            'id' => $script->id,
            'uuid' => $script->uuid,
            'title' => $script->title,
            'thumbnail_text' => $script->thumbnail_text,
            'script_type_id' => $script->script_type_id,
            'content' => $script->content,
            'description' => $script->description,
            'meta_tags' => $script->meta_tags,
            'live_video_url' => $script->live_video_url,
            'status' => $script->status,
            'production_status' => $script->production_status,
            'scheduled_at' => $script->scheduled_at?->toIso8601String(),
            'title_options' => $script->titleOptions->map(fn ($o) => [
                'id' => $o->id,
                'title' => $o->title,
                'thumbnail_text' => $o->thumbnail_text,
                'is_primary' => $o->is_primary,
                'sort_order' => $o->sort_order,
            ])->values()->all(),
            'thumbnails' => $script->thumbnails->map(fn ($t) => [
                'id' => $t->id,
                'type' => $t->type,
                'url' => $t->storage_path ? asset('storage/' . $t->storage_path) : null,
                'filename' => $t->filename,
                'sort_order' => $t->sort_order,
            ])->values()->all(),
            'current_user_role' => $script->userRole($user),
            'can_edit' => $script->canEdit($user),
            'can_delete' => $script->canDelete($user),
            'can_manage_access' => $script->canManageAccess($user),
            'checklist' => (isset($script->custom_attributes['checklist']) && is_array($script->custom_attributes['checklist'])) ? $script->custom_attributes['checklist'] : null,
            'analysis_retention' => isset($script->custom_attributes['analysis_retention']) && is_array($script->custom_attributes['analysis_retention'])
                ? $script->custom_attributes['analysis_retention']
                : null,
            'analysis_cta' => isset($script->custom_attributes['analysis_cta']) && is_array($script->custom_attributes['analysis_cta'])
                ? $script->custom_attributes['analysis_cta']
                : null,
            'analysis_storytelling' => isset($script->custom_attributes['analysis_storytelling']) && is_array($script->custom_attributes['analysis_storytelling'])
                ? $script->custom_attributes['analysis_storytelling']
                : null,
            'reel_captions' => isset($script->custom_attributes['reel_captions']) && is_array($script->custom_attributes['reel_captions'])
                ? $script->custom_attributes['reel_captions']
                : null,
        ];
    }

    /**
     * Generate 3 reel caption options for IG Reels, TikTok, Facebook Reels, X. Saved to script.
     * Route: POST script/{script}/generate-reel-captions
     */
    public function generateReelCaptions(Request $request, Script $script): JsonResponse
    {
        $tenantId = tenant('id');
        if ($script->tenant_id !== $tenantId) {
            abort(404);
        }
        if (! $script->canEdit($request->user())) {
            abort(403);
        }

        set_time_limit(120);
        $content = $this->blockNoteContentToPlainText($script->content ?? []);
        if (trim($content) === '') {
            return response()->json(['message' => 'Script has no content to generate captions from.'], 422);
        }

        $systemPrompt = <<<'PROMPT'
You are a social media copywriter. Create short-form captions for reels/shorts that work across Instagram Reels, TikTok, Facebook Reels, and X (Twitter).

Given a video script, output exactly 3 different caption options. Each caption must:
- Hook viewers in the first line (ideal for feeds)
- Be concise (roughly 1–3 short sentences or a punchy phrase; can use line breaks)
- Include 2–5 relevant hashtags: place them at the end of the caption (or after a line break). Use hashtags that fit the topic and help discoverability on IG/TikTok/FB (e.g. #tech #tips #howto). No generic spam.
- Feel native to reels/shorts: conversational, engaging
- Work for IG Reels, TikTok, Facebook Reels, and X (avoid platform-specific jargon)
- Vary in tone: e.g. one more curiosity-driven, one direct, one playful

Output ONLY a JSON object with one key: "captions" (array of exactly 3 strings). No other text or markdown.
Example: {"captions": ["Hook line here.\n\n#topic #niche", "Second caption with #hashtags at the end.", "Third option.\n\n#relevant #tags"]}
PROMPT;

        try {
            $response = OpenAI::chat()->create([
                'model' => config('openai.chat_model'),
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => "Video script:\n\n" . $content],
                ],
                'max_completion_tokens' => 1024,
                'temperature' => 0.7,
            ]);
            $text = trim($response->choices[0]->message->content ?? '');
            if (preg_match('/```(?:json)?\s*([\s\S]*?)```/s', $text, $m)) {
                $text = trim($m[1]);
            }
            $start = strpos($text, '{');
            if ($start !== false) {
                $end = strrpos($text, '}');
                if ($end !== false && $end > $start) {
                    $text = substr($text, $start, $end - $start + 1);
                }
            }
            $data = json_decode($text, true);
            if (! is_array($data) || ! isset($data['captions']) || ! is_array($data['captions'])) {
                Log::warning('ScriptController::generateReelCaptions invalid JSON', ['response' => substr($text, 0, 300)]);
                return response()->json(['message' => 'Invalid response from AI. Please try again.'], 502);
            }
            $captions = array_slice(array_filter(array_map(function ($c) {
                return is_string($c) ? trim($c) : null;
            }, $data['captions'])), 0, 3);
            if (count($captions) < 3) {
                return response()->json(['message' => 'Could not generate 3 captions. Please try again.'], 502);
            }
            $payload = [
                'generated_at' => now()->toIso8601String(),
                'options' => array_map(fn ($c) => ['caption' => $c], $captions),
            ];
            $existing = $script->custom_attributes ?? [];
            $existing['reel_captions'] = $payload;
            $script->update(['custom_attributes' => $existing]);

            return response()->json($payload);
        } catch (\Throwable $e) {
            Log::error('ScriptController::generateReelCaptions failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Could not generate captions. Please try again.'], 500);
        }
    }

    /**
     * Save retention analysis to script (custom_attributes) so it loads on next open.
     */
    public function saveAnalysisRetention(Request $request, Script $script): JsonResponse
    {
        if (! $script->canEdit($request->user())) {
            abort(403);
        }
        $validated = $request->validate([
            'analysis' => 'required|string|max:100000',
            'suggestions' => 'nullable|array',
        ]);
        $suggestions = $this->normalizeAnalysisSuggestions($validated['suggestions'] ?? []);
        $existing = $script->custom_attributes ?? [];
        $existing['analysis_retention'] = [
            'analysis' => $validated['analysis'],
            'suggestions' => $suggestions,
            'generated_at' => now()->toIso8601String(),
        ];
        $script->update(['custom_attributes' => $existing]);
        return response()->json(['ok' => true]);
    }

    /**
     * Save CTA analysis to script (custom_attributes).
     */
    public function saveAnalysisCta(Request $request, Script $script): JsonResponse
    {
        if (! $script->canEdit($request->user())) {
            abort(403);
        }
        $validated = $request->validate([
            'analysis' => 'required|string|max:100000',
            'suggestions' => 'nullable|array',
        ]);
        $suggestions = $this->normalizeAnalysisSuggestions($validated['suggestions'] ?? []);
        $existing = $script->custom_attributes ?? [];
        $existing['analysis_cta'] = [
            'analysis' => $validated['analysis'],
            'suggestions' => $suggestions,
            'generated_at' => now()->toIso8601String(),
        ];
        $script->update(['custom_attributes' => $existing]);
        return response()->json(['ok' => true]);
    }

    /**
     * Save storytelling analysis to script (custom_attributes).
     */
    public function saveAnalysisStorytelling(Request $request, Script $script): JsonResponse
    {
        if (! $script->canEdit($request->user())) {
            abort(403);
        }
        $validated = $request->validate([
            'analysis' => 'required|string|max:100000',
            'suggestions' => 'nullable|array',
        ]);
        $suggestions = $this->normalizeAnalysisSuggestions($validated['suggestions'] ?? []);
        $existing = $script->custom_attributes ?? [];
        $existing['analysis_storytelling'] = [
            'analysis' => $validated['analysis'],
            'suggestions' => $suggestions,
            'generated_at' => now()->toIso8601String(),
        ];
        $script->update(['custom_attributes' => $existing]);
        return response()->json(['ok' => true]);
    }

    /**
     * Normalize analysis suggestions array for storage.
     */
    private function normalizeAnalysisSuggestions(array $raw): array
    {
        $suggestions = [];
        foreach ($raw as $item) {
            if (! is_array($item) || empty($item['originalSnippet'] ?? '') || empty($item['suggestedText'] ?? '')) {
                continue;
            }
            $suggestions[] = [
                'label' => Str::limit((string) ($item['label'] ?? 'Suggestion'), 255),
                'originalSnippet' => Str::limit((string) $item['originalSnippet'], 2000),
                'suggestedText' => Str::limit((string) $item['suggestedText'], 10000),
            ];
        }
        return $suggestions;
    }

    /**
     * Upload one or more thumbnail images for a script.
     */
    public function storeThumbnail(Request $request, Script $script): JsonResponse
    {
        $tenantId = tenant('id');
        if ($script->tenant_id !== $tenantId) {
            abort(404);
        }
        if (! $script->canEdit($request->user())) {
            abort(403, 'You cannot edit this script.');
        }

        $request->validate([
            'file' => 'required|file|image|max:10240', // 10MB, image types
        ]);

        $file = $request->file('file');
        $disk = 'public';
        $dir = 'scripts/'.$script->id.'/thumbnails';
        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
        $path = $file->storeAs($dir, $filename, $disk);

        $maxSort = $script->thumbnails()->max('sort_order') ?? -1;
        $thumb = $script->thumbnails()->create([
            'type' => 'thumbnail',
            'storage_path' => $path,
            'disk' => $disk,
            'filename' => $filename,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'sort_order' => $maxSort + 1,
        ]);

        return response()->json([
            'thumbnail' => [
                'id' => $thumb->id,
                'type' => $thumb->type,
                'url' => asset('storage/' . $thumb->storage_path),
                'filename' => $thumb->filename,
                'sort_order' => $thumb->sort_order,
            ],
        ]);
    }

    /**
     * Calendar view of scripts by scheduled date.
     */
    public function calendar(Request $request): Response
    {
        $tenantId = tenant('id');
        $user = $request->user();

        $query = Script::query()
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at');

        // Optional range filters for future: ?start=YYYY-MM-DD&end=YYYY-MM-DD
        if ($request->filled('start')) {
            $start = Carbon::parse($request->query('start'))->startOfDay();
            $query->whereDate('scheduled_at', '>=', $start);
        }
        if ($request->filled('end')) {
            $end = Carbon::parse($request->query('end'))->endOfDay();
            $query->whereDate('scheduled_at', '<=', $end);
        }

        $scripts = $query
            ->with('scriptType')
            ->orderBy('scheduled_at')
            ->orderBy('title')
            ->get()
            ->map(fn (Script $script) => [
                'id' => $script->id,
                'uuid' => $script->uuid,
                'title' => $script->title,
                'scheduled_at' => $script->scheduled_at?->toIso8601String(),
                'status' => $script->status,
                'script_type' => $script->scriptType?->name,
                'production_status' => $script->production_status,
                'can_edit' => $script->canEdit($user),
            ]);

        return Inertia::render('script/Calendar', [
            'scripts' => $scripts,
        ]);
    }

    /**
     * Update a script's scheduled_at via drag-and-drop on the calendar.
     */
    public function reschedule(Request $request, Script $script): JsonResponse
    {
        $tenantId = tenant('id');
        if ($script->tenant_id !== $tenantId) {
            abort(404);
        }
        if (! $script->canEdit($request->user())) {
            abort(403, 'You do not have permission to edit this script.');
        }

        $validated = $request->validate([
            'scheduled_at' => 'nullable|date',
        ]);

        $script->update([
            'scheduled_at' => $validated['scheduled_at'] ?? null,
            'updated_by' => $request->user()?->id,
        ]);

        return response()->json([
            'script' => [
                'id' => $script->id,
                'uuid' => $script->uuid,
                'title' => $script->title,
                'scheduled_at' => $script->scheduled_at?->toIso8601String(),
                'status' => $script->status,
            ],
        ]);
    }

    /**
     * Export a script as JSON or CSV with full details.
     */
    public function export(Request $request, Script $script)
    {
        $tenantId = tenant('id');
        if ($script->tenant_id !== $tenantId) {
            abort(404);
        }
        if (! $script->canView($request->user())) {
            abort(403, 'You do not have permission to export this script.');
        }

        $format = $request->query('format', 'json');

        $script->loadMissing(['scriptType', 'titleOptions', 'thumbnails']);

        $data = [
            'id' => $script->id,
            'uuid' => $script->uuid,
            'title' => $script->title,
            'thumbnail_text' => $script->thumbnail_text,
            'script_type_id' => $script->script_type_id,
            'script_type' => $script->scriptType?->name,
            'content' => $script->content,
            'description' => $script->description,
            'meta_tags' => $script->meta_tags,
            'live_video_url' => $script->live_video_url,
            'status' => $script->status,
            'production_status' => $script->production_status,
            'scheduled_at' => $script->scheduled_at?->toIso8601String(),
            'published_at' => $script->published_at?->toIso8601String(),
            'title_options' => $script->titleOptions->map(fn ($o) => [
                'id' => $o->id,
                'title' => $o->title,
                'thumbnail_text' => $o->thumbnail_text,
                'is_primary' => $o->is_primary,
                'sort_order' => $o->sort_order,
            ])->values()->all(),
            'thumbnails' => $script->thumbnails->map(fn ($t) => [
                'id' => $t->id,
                'type' => $t->type,
                'filename' => $t->filename,
                'storage_path' => $t->storage_path,
                'url' => $t->storage_path ? asset('storage/' . $t->storage_path) : null,
                'sort_order' => $t->sort_order,
            ])->values()->all(),
            'created_at' => $script->created_at?->toIso8601String(),
            'updated_at' => $script->updated_at?->toIso8601String(),
        ];

        // If the request provided an explicit content payload (e.g. from the editor),
        // prefer that for export without persisting it.
        $overrideContent = $request->input('content');
        if (is_array($overrideContent)) {
            $data['content'] = $overrideContent;
        }

        $filenameBase = 'script-'.$script->uuid;

        if ($format === 'csv') {
            $filename = $filenameBase.'.csv';
            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ];

            $callback = static function () use ($data): void {
                $out = fopen('php://output', 'w');
                // Flatten some nested fields as JSON strings
                $flat = $data;
                $flat['content'] = json_encode($data['content']);
                $flat['title_options'] = json_encode($data['title_options']);
                $flat['thumbnails'] = json_encode($data['thumbnails']);

                fputcsv($out, array_keys($flat));
                fputcsv($out, array_map(static fn ($v) => is_scalar($v) || is_null($v) ? $v : json_encode($v), $flat));
                fclose($out);
            };

            return response()->stream($callback, 200, $headers);
        }

        $filename = $filenameBase.'.json';
        $headers = [
            'Content-Type' => 'application/json',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return response()->make(
            json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
            200,
            $headers
        );
    }

    /**
     * Bulk import scripts from a CSV file.
     */
    public function importCsv(Request $request): RedirectResponse
    {
        $tenantId = tenant('id');
        $userId = $request->user()?->id;

        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();
        if (! $path) {
            return back()->with('error', 'Could not read uploaded file.');
        }

        $handle = fopen($path, 'r');
        if (! $handle) {
            return back()->with('error', 'Could not open uploaded file.');
        }

        $header = fgetcsv($handle);
        if (! $header) {
            fclose($handle);
            return back()->with('error', 'CSV file is empty.');
        }

        $header = array_map('trim', $header);

        $created = 0;
        $headerCount = count($header);
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) === 1 && trim($row[0] ?? '') === '') {
                continue;
            }
            $row = array_map('trim', $row);
            // Ensure row has same number of columns as header (avoids array_combine error when
            // a cell contains commas/quotes/newlines and is parsed as extra columns)
            if (count($row) < $headerCount) {
                $row = array_pad($row, $headerCount, '');
            } elseif (count($row) > $headerCount) {
                $row = array_slice($row, 0, $headerCount);
            }
            $data = array_combine($header, $row);
            if (! $data) {
                continue;
            }

            $title = $data['title'] ?? null;
            if (! $title) {
                continue;
            }

            $scriptTypeId = null;
            if (! empty($data['script_type_slug'])) {
                // Prefer explicit slug column when present
                $type = ScriptType::where('tenant_id', $tenantId)
                    ->where('slug', $data['script_type_slug'])
                    ->first();
                $scriptTypeId = $type?->id;
            } elseif (! empty($data['script_type'])) {
                // Fallback: try to match exported script_type (name or slug)
                $type = ScriptType::where('tenant_id', $tenantId)
                    ->where(function ($q) use ($data) {
                        $q->where('slug', $data['script_type'])
                          ->orWhere('name', $data['script_type']);
                    })
                    ->first();
                $scriptTypeId = $type?->id;
            }

            $status = $data['status'] ?? 'draft';
            if (! in_array($status, ['draft', 'writing', 'completed', 'published', 'in_review', 'archived'], true)) {
                $status = 'draft';
            }

            $productionStatus = $data['production_status'] ?? 'not_shot';
            if (! in_array($productionStatus, ['not_shot', 'shot', 'editing', 'edited'], true)) {
                $productionStatus = 'not_shot';
            }

            $scheduledAt = null;
            if (! empty($data['scheduled_at'])) {
                try {
                    $scheduledAt = Carbon::parse($data['scheduled_at']);
                } catch (\Throwable) {
                    $scheduledAt = null;
                }
            }

            // Optional content JSON column from exported CSV
            $content = null;
            if (! empty($data['content'])) {
                $decoded = json_decode($data['content'], true);
                if (is_array($decoded)) {
                    $content = $decoded;
                }
            }

            Script::create([
                'tenant_id' => $tenantId,
                'script_type_id' => $scriptTypeId,
                'created_by' => $userId,
                'updated_by' => $userId,
                'title' => $title,
                'thumbnail_text' => $data['thumbnail_text'] ?? null,
                'content' => $content,
                'description' => $data['description'] ?? null,
                'meta_tags' => $data['meta_tags'] ?? null,
                'live_video_url' => $data['live_video_url'] ?? null,
                'status' => $status,
                'production_status' => $productionStatus,
                'scheduled_at' => $scheduledAt,
            ]);

            $created++;
        }

        fclose($handle);

        return back()->with('success', "Imported {$created} scripts from CSV.");
    }

    /**
     * Export all scripts for the current tenant as a single CSV.
     */
    public function exportAll(Request $request)
    {
        $tenantId = tenant('id');
        $user = $request->user();

        // Reuse the same visibility rules as index(): creator or collaborator
        $scripts = Script::query()
            ->with(['scriptType', 'titleOptions', 'thumbnails'])
            ->where('tenant_id', $tenantId)
            ->where(function ($q) use ($user) {
                $q->where('created_by', $user?->id);
                $q->orWhereHas('collaborators', fn ($c) => $c->where('user_id', $user?->id));
            })
            ->orderBy('created_at')
            ->get();

        $headers = [
            'id',
            'uuid',
            'title',
            'thumbnail_text',
            'script_type_id',
            'script_type',
            'content',
            'description',
            'meta_tags',
            'live_video_url',
            'status',
            'production_status',
            'scheduled_at',
            'published_at',
            'title_options',
            'thumbnails',
            'created_at',
            'updated_at',
        ];

        $callback = static function () use ($scripts, $headers): void {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);

            foreach ($scripts as $script) {
                /** @var \Modules\Script\Models\Script $script */
                $row = [
                    'id' => $script->id,
                    'uuid' => $script->uuid,
                    'title' => $script->title,
                    'thumbnail_text' => $script->thumbnail_text,
                    'script_type_id' => $script->script_type_id,
                    'script_type' => $script->scriptType?->name,
                    'content' => json_encode($script->content),
                    'description' => $script->description,
                    'meta_tags' => $script->meta_tags,
                    'live_video_url' => $script->live_video_url,
                    'status' => $script->status,
                    'production_status' => $script->production_status,
                    'scheduled_at' => $script->scheduled_at?->toIso8601String(),
                    'published_at' => $script->published_at?->toIso8601String(),
                    'title_options' => json_encode(
                        $script->titleOptions->map(fn ($o) => [
                            'id' => $o->id,
                            'title' => $o->title,
                            'thumbnail_text' => $o->thumbnail_text,
                            'is_primary' => $o->is_primary,
                            'sort_order' => $o->sort_order,
                        ])->values()->all()
                    ),
                    'thumbnails' => json_encode(
                        $script->thumbnails->map(fn ($t) => [
                            'id' => $t->id,
                            'type' => $t->type,
                            'filename' => $t->filename,
                            'storage_path' => $t->storage_path,
                            'url' => $t->storage_path ? asset('storage/' . $t->storage_path) : null,
                            'sort_order' => $t->sort_order,
                        ])->values()->all()
                    ),
                    'created_at' => $script->created_at?->toIso8601String(),
                    'updated_at' => $script->updated_at?->toIso8601String(),
                ];

                fputcsv(
                    $file,
                    array_map(
                        static fn ($v) => is_scalar($v) || is_null($v) ? $v : json_encode($v),
                        $row
                    )
                );
            }

            fclose($file);
        };

        $filename = 'scripts_'.date('Y-m-d').'.csv';

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    /**
     * Delete a script thumbnail image.
     */
    public function destroyThumbnail(Request $request, Script $script, ScriptThumbnail $thumbnail): JsonResponse
    {
        $tenantId = tenant('id');
        if ($script->tenant_id !== $tenantId) {
            abort(404);
        }
        if ($thumbnail->script_id !== $script->id) {
            abort(404);
        }
        if (! $script->canEdit($request->user())) {
            abort(403, 'You cannot edit this script.');
        }

        if ($thumbnail->storage_path && $thumbnail->disk) {
            Storage::disk($thumbnail->disk)->delete($thumbnail->storage_path);
        }
        $thumbnail->delete();

        return response()->json(['deleted' => true]);
    }

    /**
     * Share modal data: collaborators, publish state, public URL.
     */
    public function shareData(Request $request, Script $script): JsonResponse
    {
        $tenantId = tenant('id');
        if ($script->tenant_id !== $tenantId) {
            abort(404);
        }
        if (! $script->canManageAccess($request->user())) {
            abort(403, 'You cannot manage access for this script.');
        }

        $script->load(['collaborators.user']);
        $tenantSlug = tenant('slug');

        $collaborators = $script->collaborators->map(function (ScriptCollaborator $c) {
            $u = $c->user;
            $name = $u ? trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? '')) : '';
            return [
                'user_id' => $c->user_id,
                'name' => $name !== '' ? $name : ($u?->email ?? 'Unknown'),
                'email' => $u?->email ?? '',
                'role' => $c->role,
            ];
        })->values()->all();

        $owner = $script->creator;
        $ownerName = $owner ? trim(($owner->first_name ?? '') . ' ' . ($owner->last_name ?? '')) : '';
        $ownerRow = [
            'user_id' => $owner?->id,
            'name' => $ownerName !== '' ? $ownerName : ($owner?->email ?? 'Unknown'),
            'email' => $owner?->email ?? '',
            'role' => 'owner',
        ];

        $publicUrl = null;
        if ($script->visibility === 'published' && $script->share_token) {
            $publicUrl = url('/script/shared/' . $script->share_token);
        }

        return response()->json([
            'visibility' => $script->visibility ?? 'private',
            'share_token' => $script->share_token,
            'published_at' => $script->published_at?->toIso8601String(),
            'public_url' => $publicUrl,
            'owner' => $ownerRow,
            'collaborators' => $collaborators,
        ]);
    }

    /**
     * Publish script to web (read-only link).
     */
    public function publish(Request $request, Script $script): JsonResponse
    {
        $tenantId = tenant('id');
        if ($script->tenant_id !== $tenantId) {
            abort(404);
        }
        if (! $script->canManageAccess($request->user())) {
            abort(403);
        }

        if (! $script->share_token) {
            $script->update(['share_token' => Str::random(32)]);
        }
        $script->update([
            'visibility' => 'published',
            'published_at' => $script->freshTimestamp(),
        ]);

        $tenantSlug = tenant('slug');
        $publicUrl = url('/script/shared/' . $script->share_token);

        return response()->json([
            'visibility' => 'published',
            'public_url' => $publicUrl,
            'share_token' => $script->share_token,
        ]);
    }

    /**
     * Unpublish script.
     */
    public function unpublish(Request $request, Script $script): JsonResponse
    {
        $tenantId = tenant('id');
        if ($script->tenant_id !== $tenantId) {
            abort(404);
        }
        if (! $script->canManageAccess($request->user())) {
            abort(403);
        }

        $script->update(['visibility' => 'private']);

        return response()->json(['visibility' => 'private']);
    }

    /**
     * Invite a user (by email) as collaborator. User must belong to the same tenant.
     */
    public function addCollaborator(Request $request, Script $script): JsonResponse
    {
        $tenantId = tenant('id');
        if ($script->tenant_id !== $tenantId) {
            abort(404);
        }
        if (! $script->canManageAccess($request->user())) {
            abort(403);
        }

        $validated = $request->validate([
            'email' => 'required|email',
            'role' => 'required|string|in:view,edit,admin',
        ]);

        $user = \Modules\User\Models\User::where('email', $validated['email'])->whereHas('tenants', fn ($q) => $q->where('tenants.id', $tenantId))->first();
        if (! $user) {
            return response()->json(['message' => 'No user in this organization with that email.'], 422);
        }

        if ((int) $user->id === (int) $script->created_by) {
            return response()->json(['message' => 'That user is the owner.'], 422);
        }

        $existing = $script->collaborators()->where('user_id', $user->id)->first();
        if ($existing) {
            $existing->update(['role' => $validated['role']]);
            $name = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
            return response()->json([
                'collaborator' => [
                    'user_id' => $user->id,
                    'name' => $name !== '' ? $name : $user->email,
                    'email' => $user->email,
                    'role' => $existing->role,
                ],
            ]);
        }

        $script->collaborators()->create([
            'user_id' => $user->id,
            'role' => $validated['role'],
        ]);

        $name = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));

        return response()->json([
            'collaborator' => [
                'user_id' => $user->id,
                'name' => $name !== '' ? $name : $user->email,
                'email' => $user->email,
                'role' => $validated['role'],
            ],
        ]);
    }

    /**
     * Remove a collaborator.
     */
    public function removeCollaborator(Request $request, Script $script, int $userId): JsonResponse
    {
        $tenantId = tenant('id');
        if ($script->tenant_id !== $tenantId) {
            abort(404);
        }
        if (! $script->canManageAccess($request->user())) {
            abort(403);
        }

        $script->collaborators()->where('user_id', $userId)->delete();

        return response()->json(['removed' => true]);
    }

    /**
     * Update a collaborator's role.
     */
    public function updateCollaboratorRole(Request $request, Script $script, int $userId): JsonResponse
    {
        $tenantId = tenant('id');
        if ($script->tenant_id !== $tenantId) {
            abort(404);
        }
        if (! $script->canManageAccess($request->user())) {
            abort(403);
        }

        $validated = $request->validate([
            'role' => 'required|string|in:view,edit,admin',
        ]);

        $collab = $script->collaborators()->where('user_id', $userId)->first();
        if (! $collab) {
            return response()->json(['message' => 'Collaborator not found.'], 404);
        }

        $collab->update(['role' => $validated['role']]);

        return response()->json([
            'collaborator' => [
                'user_id' => $collab->user_id,
                'role' => $collab->role,
            ],
        ]);
    }

    /**
     * Public read-only view (no auth, no tenant in URL). Anyone with the link can view when script is published.
     */
    public function sharedShow(string $token): Response
    {
        $script = Script::withoutGlobalScopes()
            ->with(['scriptType', 'titleOptions', 'thumbnails'])
            ->where('visibility', 'published')
            ->where('share_token', $token)
            ->first();

        if (! $script) {
            abort(404, 'This link is invalid or the script is no longer shared.');
        }

        $tenant = Tenant::find($script->tenant_id);
        if (! $tenant) {
            abort(404, 'This link is invalid.');
        }

        tenancy()->initialize($tenant);

        $payload = $this->formatScriptForEdit($script, null);
        $payload['read_only'] = true;

        return Inertia::render('script/SharedView', [
            'script' => $payload,
        ]);
    }

    /**
     * Public read-only production calendar (no auth, no tenant path).
     */
    public function publicCalendar(Request $request): Response
    {
        // For now, use the first tenant as the source for the public calendar.
        $tenant = Tenant::first();
        if (! $tenant) {
            abort(404, 'No tenant configured.');
        }

        tenancy()->initialize($tenant);

        $query = Script::query()
            ->where('tenant_id', $tenant->id)
            ->whereNull('deleted_at')
            ->whereNotNull('scheduled_at');

        $scripts = $query
            ->with('scriptType')
            ->orderBy('scheduled_at')
            ->orderBy('title')
            ->get()
            ->map(fn (Script $script) => [
                'id' => $script->id,
                'uuid' => $script->uuid,
                'title' => $script->title,
                'scheduled_at' => $script->scheduled_at?->toIso8601String(),
                'status' => $script->status,
                'script_type' => $script->scriptType?->name,
                'production_status' => $script->production_status,
            ]);

        return Inertia::render('script/PublicCalendar', [
            'scripts' => $scripts,
        ]);
    }

    /**
     * Show the YouTube transcripts tool page (paste URLs, get combined transcripts).
     */
    public function transcripts(Request $request): Response
    {
        return Inertia::render('script/Transcripts');
    }

    /**
     * Fetch transcripts for the given YouTube URLs. Returns JSON with combined transcript text
     * or errors. Uses mrmysql/youtube-transcript (Innertube-based, same approach as Python youtube_transcript_api).
     */
    public function fetchTranscripts(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'urls' => 'required|string|max:50000',
        ]);
        $urls = array_filter(array_map('trim', explode("\n", $validated['urls'])));
        $urls = array_slice($urls, 0, 50);
        $videoIds = [];
        foreach ($urls as $url) {
            $id = $this->extractYoutubeVideoId($url);
            if ($id !== null) {
                $videoIds[] = $id;
            }
        }
        $videoIds = array_values(array_unique($videoIds));

        $httpClient = new Client([
            'timeout' => 15,
            'headers' => [
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language' => 'en-US,en;q=0.9',
            ],
        ]);
        $requestFactory = new HttpFactory;
        $streamFactory = new HttpFactory;
        $fetcher = new TranscriptListFetcher($httpClient, $requestFactory, $streamFactory);

        $segments = [];
        $errors = [];
        foreach ($videoIds as $index => $videoId) {
            $result = $this->fetchTranscriptForVideo($fetcher, $videoId);
            if ($result['success']) {
                $title = $result['title'] !== '' ? $result['title'] : 'Video '.$videoId;
                $segments[] = '## '.($index + 1).'. '.$title."\n\n```\n".$result['text']."\n```";
            } else {
                $errors[] = $result['error'] ?? 'Video '.$videoId;
            }
        }
        $transcript = count($segments) > 0 ? implode("\n\n", $segments) : '';

        return response()->json([
            'transcript' => $transcript,
            'errors' => $errors,
            'fetched' => count($segments),
            'failed' => count($errors),
        ]);
    }

    /**
     * Generate a YouTube script from the built transcript prompt using OpenAI.
     */
    public function generateScriptFromTranscripts(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'prompt' => 'required|string|max:150000',
        ]);

        $systemPrompt = <<<'PROMPT'
You are an expert YouTube script writer. The user will provide a request and supporting materials (scripts from other videos, specs, observations). Write a single, conversational YouTube script that fulfills their request. Output only the script: no meta-commentary, no "Here is your script", no bullet points. Use section headings if they asked for them. Write in a natural, read-aloud style—not one sentence per line like a poem. Do not add cues like [pause] or [cut]. Output plain text/markdown only.
PROMPT;

        try {
            $response = OpenAI::chat()->create([
                'model' => config('openai.chat_model'),
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $validated['prompt']],
                ],
                'max_completion_tokens' => 8192,
                'temperature' => 0.7,
            ]);

            $script = trim($response->choices[0]->message->content ?? '');
            if ($script === '') {
                return response()->json(['message' => 'No script generated. Try again.'], 422);
            }

            return response()->json(['script' => $script]);
        } catch (\Throwable $e) {
            Log::error('ScriptController::generateScriptFromTranscripts failed', ['error' => $e->getMessage()]);

            return response()->json(
                ['message' => 'Failed to generate script. Please try again.'],
                500
            );
        }
    }

    /**
     * Generate YouTube script/video ideas from a topic using OpenAI.
     */
    public function generateScriptIdeas(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'topic' => 'required|string|max:2000',
            'count' => 'nullable|integer|min:3|max:20',
            'tone' => 'nullable|string|max:100',
        ]);

        $topic = trim($validated['topic']);
        $count = (int) ($validated['count'] ?? 10);
        $tone = trim($validated['tone'] ?? 'conversational and engaging');

        $systemPrompt = 'You are a creative YouTube content strategist. Generate video or script ideas that would work well on YouTube. Output a numbered list only: no intro, no outro, no extra commentary. Each idea should be one clear title or one-line concept.';

        $userPrompt = "Topic or niche: {$topic}\n\nGenerate exactly {$count} YouTube video/script ideas. Tone: {$tone}. Reply with only the numbered list (e.g. 1. Idea one\n2. Idea two).";

        try {
            $response = OpenAI::chat()->create([
                'model' => config('openai.chat_model'),
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                'max_completion_tokens' => 2048,
                'temperature' => 0.8,
            ]);

            $ideas = trim($response->choices[0]->message->content ?? '');
            if ($ideas === '') {
                return response()->json(['message' => 'No ideas generated. Try again.'], 422);
            }

            return response()->json(['ideas' => $ideas]);
        } catch (\Throwable $e) {
            Log::error('ScriptController::generateScriptIdeas failed', ['error' => $e->getMessage()]);

            return response()->json(
                ['message' => 'Failed to generate ideas. Please try again.'],
                500
            );
        }
    }

    /**
     * Create a new script from generated transcript content (plain text) and redirect to the script editor.
     */
    public function createScriptFromGenerated(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'content' => 'required|string|max:500000',
        ]);

        $tenantId = tenant('id');
        $userId = $request->user()?->id;
        if (! $userId) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $this->ensureDefaultScriptTypes($tenantId);

        $title = trim($validated['title'] ?? '') ?: 'Generated script';
        $plainText = $validated['content'];
        $content = $this->plainTextToBlockNoteContent($plainText);

        $scriptTypeId = ScriptType::where('tenant_id', $tenantId)->where('slug', 'youtube')->value('id')
            ?? ScriptType::where('tenant_id', $tenantId)->orderBy('sort_order')->value('id');

        $script = Script::create([
            'tenant_id' => $tenantId,
            'script_type_id' => $scriptTypeId,
            'created_by' => $userId,
            'updated_by' => $userId,
            'title' => $title,
            'content' => $content,
            'status' => 'draft',
            'production_status' => 'not_shot',
        ]);

        $script->titleOptions()->create([
            'title' => $script->title,
            'thumbnail_text' => null,
            'is_primary' => true,
            'sort_order' => 0,
        ]);

        $editUrl = route('script.edit', ['tenant' => tenant('slug'), 'script' => $script->uuid]);

        return response()->json([
            'uuid' => $script->uuid,
            'edit_url' => $editUrl,
        ]);
    }

    /**
     * Convert plain text to BlockNote block array (paragraphs only).
     *
     * @return array<int, array<string, mixed>>
     */
    private function plainTextToBlockNoteContent(string $text): array
    {
        $text = trim($text);
        if ($text === '') {
            return [];
        }
        $paragraphs = preg_split('/\n\n+/', $text, -1, PREG_SPLIT_NO_EMPTY);
        $blocks = [];
        foreach ($paragraphs as $i => $para) {
            $para = trim($para);
            if ($para === '') {
                continue;
            }
            $blocks[] = [
                'id' => Str::uuid()->toString(),
                'type' => 'paragraph',
                'content' => [
                    ['type' => 'text', 'text' => $para],
                ],
            ];
        }

        return $blocks;
    }

    /**
     * Search current user's scripts by title/description for the transcript tool (e.g. pick a script to use as device review).
     * Returns top 10 matches: uuid, title.
     */
    public function searchMyScripts(Request $request): JsonResponse
    {
        $q = $request->query('q', '');
        $q = is_string($q) ? trim($q) : '';
        $tenantId = tenant('id');
        $user = $request->user();
        if (! $user) {
            return response()->json(['scripts' => []]);
        }

        $query = Script::query()
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->where(function ($qb) use ($user) {
                $qb->where('created_by', $user->id)
                    ->orWhereHas('collaborators', fn ($c) => $c->where('user_id', $user->id));
            });

        if ($q !== '') {
            $query->where(function ($qb) use ($q) {
                $qb->where('title', 'like', '%'.$q.'%')
                    ->orWhere('description', 'like', '%'.$q.'%');
            });
        }

        $scripts = $query->orderByDesc('updated_at')->limit(10)->get(['uuid', 'title']);

        return response()->json([
            'scripts' => $scripts->map(fn (Script $s) => ['uuid' => $s->uuid, 'title' => $s->title])->values()->all(),
        ]);
    }

    /**
     * Return a script's content as plain text (for use in transcript tool device review).
     */
    public function getScriptContentAsText(Request $request, Script $script): JsonResponse
    {
        $tenantId = tenant('id');
        if ($script->tenant_id !== $tenantId) {
            abort(404);
        }
        if (! $script->canView($request->user())) {
            abort(403);
        }

        $content = $script->content;
        $text = $this->blockNoteContentToPlainText($content);

        return response()->json(['content' => $text]);
    }

    /**
     * Convert BlockNote JSON content (array of blocks) to plain text.
     *
     * @param  mixed  $content
     */
    private function blockNoteContentToPlainText($content): string
    {
        if (! is_array($content) || count($content) === 0) {
            return '';
        }
        $lines = [];
        foreach ($content as $block) {
            if (! is_array($block)) {
                continue;
            }
            $line = $this->blockNoteBlockToText($block);
            if ($line !== '') {
                $lines[] = $line;
            }
        }

        return implode("\n\n", $lines);
    }

    /**
     * @param  array<string, mixed>  $block
     */
    private function blockNoteBlockToText(array $block): string
    {
        $parts = [];
        if (isset($block['content']) && is_array($block['content'])) {
            foreach ($block['content'] as $inline) {
                $parts[] = $this->blockNoteInlineToText($inline);
            }
        }
        $text = implode('', $parts);
        if (isset($block['children']) && is_array($block['children']) && count($block['children']) > 0) {
            $childLines = [];
            foreach ($block['children'] as $child) {
                if (is_array($child)) {
                    $childLines[] = $this->blockNoteBlockToText($child);
                }
            }
            $childText = implode("\n", array_filter($childLines));
            $text = $text !== '' ? $text."\n".$childText : $childText;
        }

        return $text;
    }

    /**
     * @param  mixed  $inline
     */
    private function blockNoteInlineToText($inline): string
    {
        if (is_string($inline)) {
            return $inline;
        }
        if (! is_array($inline)) {
            return '';
        }
        if (isset($inline['type']) && $inline['type'] === 'text' && isset($inline['text']) && is_string($inline['text'])) {
            return $inline['text'];
        }
        if (isset($inline['type']) && $inline['type'] === 'link' && isset($inline['content']) && is_array($inline['content'])) {
            $out = '';
            foreach ($inline['content'] as $c) {
                $out .= $this->blockNoteInlineToText($c);
            }

            return $out;
        }

        return '';
    }

    /**
     * Fetch phone specs from a GSMArena URL. Returns extracted specs as plain text.
     */
    public function fetchSpecsFromUrl(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'url' => 'required|string|url',
        ]);
        $url = $validated['url'];

        $parsed = parse_url($url);
        $host = strtolower($parsed['host'] ?? '');
        $allowed = ['www.gsmarena.com', 'gsmarena.com'];
        if (! in_array($host, $allowed, true)) {
            return response()->json(
                ['message' => 'Only GSMArena URLs are supported (e.g. https://www.gsmarena.com/phone_name-12345.php).'],
                422
            );
        }

        try {
            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language' => 'en-US,en;q=0.9',
            ])->timeout(15)->get($url);

            if (! $response->successful()) {
                return response()->json(['message' => 'Could not load the page. Check the URL and try again.'], 422);
            }

            $html = $response->body();
            $result = $this->parseGsmArenaSpecs($html);

            if ($result['specs'] === '') {
                return response()->json(['message' => 'No specs found on this page.'], 422);
            }

            return response()->json([
                'specs' => $result['specs'],
                'title' => $result['title'],
            ]);
        } catch (\Throwable $e) {
            Log::warning('fetchSpecsFromUrl failed', ['url' => $url, 'error' => $e->getMessage()]);

            return response()->json(
                ['message' => 'Failed to fetch specs. Please try again.'],
                500
            );
        }
    }

    /**
     * Parse GSMArena phone specs page HTML into plain text.
     *
     * @return array{specs: string, title: string}
     */
    private function parseGsmArenaSpecs(string $html): array
    {
        $title = '';
        $lines = [];

        libxml_use_internal_errors(true);
        $dom = new \DOMDocument;
        @$dom->loadHTML($html);
        libxml_clear_errors();

        $xpath = new \DOMXPath($dom);

        // Try to get phone name from h1 or title
        foreach (['//h1', '//title'] as $query) {
            $nodes = $xpath->query($query);
            if ($nodes->length > 0 && $nodes->item(0)->textContent !== null) {
                $t = trim(preg_replace('/\s+/', ' ', $nodes->item(0)->textContent));
                if ($t !== '' && stripos($t, 'GSMArena') === false) {
                    $title = preg_replace('/\s*[-|]\s*Full phone specifications.*$/i', '', $t);

                    break;
                }
            }
        }

        // Specs are in tables. GSMArena uses table with class "specs" or inside #specs-list
        $tables = $xpath->query("//*[@id='specs-list']//table | //table[contains(@class,'specs')]");
        if ($tables->length === 0) {
            $tables = $xpath->query('//table');
        }

        $currentSection = '';
        foreach ($tables as $table) {
            $rows = $xpath->query('.//tr', $table);
            foreach ($rows as $row) {
                $cells = $xpath->query('.//td | .//th', $row);
                $texts = [];
                foreach ($cells as $cell) {
                    $texts[] = trim(preg_replace('/\s+/', ' ', $cell->textContent ?? ''));
                }
                $texts = array_filter($texts);
                if (count($texts) === 0) {
                    continue;
                }
                // GSMArena: 2 cols = spec name : value; 3 cols = section | spec name | value
                if (count($texts) === 1) {
                    $lines[] = '';
                    $lines[] = '## '.$texts[0];
                    $currentSection = $texts[0];
                } elseif (count($texts) === 2) {
                    $lines[] = $texts[0].': '.$texts[1];
                } else {
                    $section = $texts[0];
                    $name = $texts[1];
                    $value = $texts[count($texts) - 1];
                    if ($currentSection !== $section) {
                        $lines[] = '';
                        $lines[] = '## '.$section;
                        $currentSection = $section;
                    }
                    $lines[] = $name.': '.$value;
                }
            }
        }

        $specs = trim(implode("\n", $lines));

        return ['specs' => $specs, 'title' => trim($title)];
    }

    private function extractYoutubeVideoId(string $url): ?string
    {
        if (preg_match('/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/', $url, $m)) {
            return $m[1];
        }

        return null;
    }

    private function fetchTranscriptForVideo(TranscriptListFetcher $fetcher, string $videoId): array
    {
        try {
            $transcriptList = $fetcher->fetch($videoId);
            $transcript = null;
            try {
                $transcript = $transcriptList->findGeneratedTranscript(['en', 'en-US', 'en-GB']);
            } catch (NoTranscriptFoundException $e) {
                $codes = $transcriptList->getAvailableLanguageCodes();
                if (count($codes) > 0) {
                    $transcript = $transcriptList->findTranscript($codes);
                } else {
                    throw $e;
                }
            }
            $segments = $transcript->fetch();
            $text = implode(' ', array_map(fn ($s) => $s['text'] ?? '', $segments));
            $title = $transcriptList->getTitle();

            return ['success' => true, 'text' => trim($text), 'title' => $title];
        } catch (TranscriptsDisabledException $e) {
            return ['success' => false, 'error' => 'Transcripts disabled for video '.$videoId];
        } catch (NoTranscriptFoundException|NoTranscriptAvailableException $e) {
            return ['success' => false, 'error' => 'No transcript found for video '.$videoId];
        } catch (TooManyRequestsException $e) {
            return ['success' => false, 'error' => 'Rate limited by YouTube for video '.$videoId.' — try again later'];
        } catch (YouTubeRequestFailedException $e) {
            Log::warning('YouTube transcript request failed for '.$videoId.': '.$e->getMessage());

            return ['success' => false, 'error' => $e->getMessage()];
        } catch (\Throwable $e) {
            Log::warning('YouTube transcript fetch failed for '.$videoId.': '.$e->getMessage());

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
