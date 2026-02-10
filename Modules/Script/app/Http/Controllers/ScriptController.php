<?php

namespace Modules\Script\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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

        $query->orderByDesc($trashed ? 'deleted_at' : 'updated_at');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('meta_tags', 'like', "%{$search}%");
            });
        }

        $scripts = $query->get()->map(fn (Script $script) => $this->formatScriptForList($script));

        return Inertia::render('script/index', [
            'scripts' => $scripts,
            'trashed' => $trashed,
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
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'thumbnail_text' => 'nullable|string|max:255',
            'script_type_id' => 'nullable|exists:script_types,id',
            'content' => 'nullable|array',
            'description' => 'nullable|string',
            'meta_tags' => 'nullable|string|max:600',
            'live_video_url' => 'nullable|url|max:500',
            'status' => 'nullable|string|in:draft,in_review,published,archived',
            'title_options' => 'nullable|array',
            'title_options.*.title' => 'required_with:title_options|string|max:255',
            'title_options.*.thumbnail_text' => 'nullable|string|max:255',
            'title_options.*.is_primary' => 'nullable|boolean',
        ]);

        $tenantId = tenant('id');
        $userId = $request->user()?->id;

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

        return redirect()->route('script.edit', ['tenant' => tenant('slug'), 'script' => $script->uuid])
            ->with('success', 'Script created.');
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
            'script' => $this->formatScriptForEdit($script, $user),
            'scriptTypes' => $scriptTypes,
        ]);
    }

    /**
     * Update the script.
     */
    public function update(Request $request, Script $script): RedirectResponse
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
            'status' => 'nullable|string|in:draft,in_review,published,archived',
            'title_options' => 'nullable|array',
            'title_options.*.id' => 'nullable|integer|exists:script_title_options,id',
            'title_options.*.title' => 'required_with:title_options|string|max:255',
            'title_options.*.thumbnail_text' => 'nullable|string|max:255',
            'title_options.*.is_primary' => 'nullable|boolean',
        ]);

        $script->update([
            'script_type_id' => $validated['script_type_id'] ?? $script->script_type_id,
            'updated_by' => $request->user()?->id,
            'title' => $validated['title'] ?? $script->title,
            'thumbnail_text' => $validated['thumbnail_text'] ?? $script->thumbnail_text,
            'content' => $validated['content'] ?? $script->content,
            'description' => $validated['description'] ?? $script->description,
            'meta_tags' => $validated['meta_tags'] ?? $script->meta_tags,
            'live_video_url' => $validated['live_video_url'] ?? $script->live_video_url,
            'status' => $validated['status'] ?? $script->status,
        ]);

        if (array_key_exists('title_options', $validated)) {
            $script->syncTitleOptionsFromArray($validated['title_options'] ?? []);
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
                'max_tokens' => 4096,
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
        ];
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
}
