<?php

declare(strict_types=1);

namespace Modules\Cortex\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\TenantAiPromptResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Cortex\Http\Controllers\Concerns\InteractsWithCortexLlm;
use Modules\Cortex\Models\MirageReferenceAsset;
use Modules\Cortex\Models\MirageSetting;
use Modules\Cortex\Models\MirageUserPreference;
use Modules\Cortex\Neuron\MirageAgent;
use Modules\Cortex\Services\MirageImageService;
use Modules\Cortex\Services\MirageReferenceVisionService;
use Modules\Cortex\Services\YoutubeTranscriptService;
use Modules\Cortex\Support\CortexAgentKey;
use Modules\Cortex\Support\MirageDataImageDecoder;
use Modules\Cortex\Support\MirageImageProvider;
use NeuronAI\Chat\Messages\UserMessage;

class MirageController extends Controller
{
    use InteractsWithCortexLlm;

    public const PROMPT_KEY = 'cortex.mirage';

    public function __construct(
        private readonly TenantAiPromptResolver $promptResolver,
        private readonly MirageImageService $mirageImageService,
        private readonly MirageReferenceVisionService $mirageReferenceVision,
        private readonly YoutubeTranscriptService $youtubeTranscript,
    ) {}

    public function index(Request $request): Response
    {
        /** @var array<string, mixed> $definitions */
        $definitions = config('ai_prompts.definitions', []);
        $meta = $definitions[self::PROMPT_KEY] ?? [];

        $tenantId = tenant('id');
        $imageProvider = null;
        $openAiImageModel = null;
        $imageProviderLabel = null;
        if (is_string($tenantId) && $tenantId !== '') {
            $setting = MirageSetting::getOrCreateForTenant($tenantId);
            $imageProvider = $setting->image_provider->value;
            $openAiImageModel = $setting->openai_image_model->value;
            $imageProviderLabel = $setting->image_provider === MirageImageProvider::OpenAi
                ? $setting->image_provider->label().' · '.$setting->openai_image_model->label()
                : $setting->image_provider->label();
        }

        $referencePreferences = [
            'use_default_face_reference' => false,
            'use_default_style_references' => false,
        ];
        if (is_string($tenantId) && $tenantId !== '' && $request->user() !== null) {
            $pref = MirageUserPreference::query()
                ->where('tenant_id', $tenantId)
                ->where('user_id', $request->user()->id)
                ->first();
            if ($pref !== null) {
                $referencePreferences = [
                    'use_default_face_reference' => $pref->use_default_face_reference,
                    'use_default_style_references' => $pref->use_default_style_references,
                ];
            }
        }

        return Inertia::render('cortex/agents/mirage', [
            'openAiConfigured' => $this->cortexOpenAiConfiguredProp(is_string($tenantId) ? $tenantId : null, CortexAgentKey::Mirage),
            'promptKey' => self::PROMPT_KEY,
            'promptLabel' => is_array($meta) ? (string) ($meta['label'] ?? 'Mirage') : 'Mirage',
            'promptDescription' => is_array($meta) ? (string) ($meta['description'] ?? '') : '',
            'imageProvider' => $imageProvider,
            'openAiImageModel' => $openAiImageModel,
            'imageProviderLabel' => $imageProviderLabel,
            'referencePreferences' => $referencePreferences,
        ]);
    }

    public function chat(Request $request): JsonResponse
    {
        $this->raiseRuntimeLimitForAgent();

        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        if (! $this->cortexLlmConfigured($tenantId, CortexAgentKey::Mirage)) {
            return response()->json([
                'message' => $this->cortexMissingLlmKeyMessage($tenantId, CortexAgentKey::Mirage),
            ], 503);
        }

        $systemPrompt = trim($this->promptResolver->resolve($tenantId, self::PROMPT_KEY));
        if ($systemPrompt === '') {
            return response()->json([
                'message' => 'Mirage system prompt is empty. Set “'.self::PROMPT_KEY.'” under Organization → AI prompts.',
            ], 503);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:12000'],
            'context' => ['nullable', 'string', 'max:20000'],
            'history' => ['nullable', 'array'],
            'history.*.role' => ['nullable', 'string'],
            'history.*.content' => ['nullable', 'string'],
        ]);

        $messages = [];

        if (is_array($validated['history'] ?? null)) {
            foreach ($validated['history'] as $row) {
                $role = (string) ($row['role'] ?? '');
                $content = trim((string) ($row['content'] ?? ''));
                if ($content === '') {
                    continue;
                }
                if ($role === 'assistant') {
                    $messages[] = new \NeuronAI\Chat\Messages\AssistantMessage($content);
                } else {
                    $messages[] = new UserMessage($content);
                }
            }
        }

        $body = trim((string) $validated['message']);
        $context = trim((string) ($validated['context'] ?? ''));
        if ($context !== '') {
            $body = "Extra context (script excerpt, short brief, niche, competitor refs — user-provided):\n---\n{$context}\n---\n\nRequest:\n{$body}";
        }

        $messages[] = new UserMessage($body);

        try {
            $agent = MirageAgent::make()
                ->setAiProvider($this->cortexLlmFactory()->makeForTenantAgent($tenantId, CortexAgentKey::Mirage))
                ->setInstructions($systemPrompt)
                ->toolMaxRuns(0);

            $reply = $agent
                ->chat($messages)
                ->getMessage();

            $content = trim($reply->getContent() ?? '');
            if ($content === '') {
                return response()->json(['message' => 'Mirage returned an empty response. Try again.'], 422);
            }

            return response()->json(['reply' => $content]);
        } catch (\Throwable $e) {
            Log::error('MirageController::chat failed', [
                'error' => $e->getMessage(),
                'exception' => $e::class,
            ]);

            return response()->json([
                'message' => 'Mirage failed. Check logs or try again.',
            ], 500);
        }
    }

    /**
     * Generate structured thumbnail/title ideas (JSON) from a topic or full script.
     */
    public function ideas(Request $request): JsonResponse
    {
        $this->raiseRuntimeLimitForAgent();

        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        if (! $this->cortexLlmConfigured($tenantId, CortexAgentKey::Mirage)) {
            return response()->json([
                'message' => $this->cortexMissingLlmKeyMessage($tenantId, CortexAgentKey::Mirage),
            ], 503);
        }

        $systemPrompt = trim($this->promptResolver->resolve($tenantId, self::PROMPT_KEY));
        if ($systemPrompt === '') {
            return response()->json([
                'message' => 'Mirage system prompt is empty. Set “'.self::PROMPT_KEY.'” under Organization → AI prompts.',
            ], 503);
        }

        $validated = $request->validate([
            'input_mode' => ['required', 'string', 'in:script,youtube,prompt'],
            'input' => ['nullable', 'string', 'max:120000'],
            'youtube_url' => ['nullable', 'string', 'max:2048'],
            'context' => ['nullable', 'string', 'max:20000'],
            'idea_count' => ['required', 'integer', 'min:1', 'max:12'],
            'focus' => ['nullable', 'string', 'in:face,product,mixed,scene'],
            'face_reference' => ['nullable', 'string', 'max:12000000'],
            'product_reference' => ['nullable', 'string', 'max:12000000'],
            'style_references' => ['nullable', 'array', 'max:'.MirageDataImageDecoder::MAX_STYLE_SAMPLES],
            'style_references.*' => ['nullable', 'string', 'max:12000000'],
        ]);

        $badRef = $this->mirageReferencePayloadError($request);
        if ($badRef !== null) {
            return response()->json(['message' => $badRef], 422);
        }

        $resolved = $this->resolveMirageIdeasBody($validated);
        if (isset($resolved['error'])) {
            return response()->json(['message' => $resolved['error']], 422);
        }

        $ideaCount = (int) $validated['idea_count'];
        $input = $resolved['input'];
        $context = trim((string) ($validated['context'] ?? ''));
        $focus = isset($validated['focus']) ? (string) $validated['focus'] : null;

        $faceRef = isset($validated['face_reference']) ? trim((string) $validated['face_reference']) : '';
        $productRef = isset($validated['product_reference']) ? trim((string) $validated['product_reference']) : '';
        $styleRefStrings = $this->normalizeStyleReferenceInput($validated['style_references'] ?? null);
        $this->applyLibraryDefaultReferences($request, $tenantId, $faceRef, $styleRefStrings);
        $referenceLayers = MirageDataImageDecoder::referenceLayers(
            $faceRef !== '' ? $faceRef : null,
            $productRef !== '' ? $productRef : null,
        );
        $hasReferencePhotos = $referenceLayers !== [];
        $hasStyleSamples = $styleRefStrings !== [];

        $mergedSystem = $systemPrompt."\n\n".$this->ideasJsonModeSuffix($ideaCount, $hasReferencePhotos, $hasStyleSamples);

        $userParts = [];
        $userParts[] = $this->visualFocusInstruction($focus);
        if ($context !== '') {
            $userParts[] = "Additional notes (optional):\n---\n{$context}\n---";
        }
        if ($hasReferencePhotos) {
            $vision = $this->mirageReferenceVision->summarizeForIdeas(
                $faceRef !== '' ? $faceRef : null,
                $productRef !== '' ? $productRef : null,
            );
            if ($vision !== '') {
                $userParts[] = "User reference photos — use these FACE / PRODUCT notes in every title and image_prompt (match appearance; no real names):\n---\n{$vision}\n---";
            } else {
                $userParts[] = 'User attached reference photo(s) for face and/or product. Preserve recognizable likeness and product appearance in every image_prompt.';
            }
        }
        if ($hasStyleSamples) {
            $styleVision = $this->mirageReferenceVision->summarizeStyleSamplesForIdeas($styleRefStrings);
            if ($styleVision !== '') {
                $userParts[] = "User sample thumbnails — match this **look and layout** in every title, thumb_text, and image_prompt (same energy, composition, and typography style; adapt to this video’s topic):\n---\n{$styleVision}\n---";
            } else {
                $userParts[] = 'User attached sample thumbnail image(s). Echo their composition, color, and typography style in every image_prompt while keeping this video’s subject matter.';
            }
        }
        $userParts[] = 'Generate exactly '.$ideaCount.' distinct YouTube thumbnail packaging concepts from the following topic or script. Follow the JSON-only rules in your instructions.';
        $userParts[] = "--- BEGIN TOPIC OR SCRIPT ---\n{$input}\n--- END ---";
        $userBody = implode("\n\n", $userParts);

        try {
            $agent = MirageAgent::make()
                ->setAiProvider($this->cortexLlmFactory()->makeForTenantAgent($tenantId, CortexAgentKey::Mirage))
                ->setInstructions($mergedSystem)
                ->toolMaxRuns(0);

            $reply = $agent
                ->chat([new UserMessage($userBody)])
                ->getMessage();

            $raw = trim($reply->getContent() ?? '');
            if ($raw === '') {
                return response()->json(['message' => 'Mirage returned an empty response. Try again.'], 422);
            }

            $decoded = $this->decodeIdeasJson($raw);
            if ($decoded === null) {
                Log::warning('MirageController::ideas JSON parse failed', ['snippet' => Str::limit($raw, 500)]);

                return response()->json([
                    'message' => 'Could not parse ideas. The model did not return valid JSON. Try again or shorten the input.',
                ], 422);
            }

            if (! isset($decoded['ideas']) || ! is_array($decoded['ideas'])) {
                return response()->json(['message' => 'Invalid ideas payload (missing "ideas" array).'], 422);
            }

            $ideas = [];
            foreach ($decoded['ideas'] as $row) {
                if (! is_array($row)) {
                    continue;
                }
                $title = trim((string) ($row['title'] ?? ''));
                $thumbText = trim((string) ($row['thumb_text'] ?? ''));
                $rationale = trim((string) ($row['rationale'] ?? ''));
                $imagePrompt = trim((string) ($row['image_prompt'] ?? ''));
                if ($title === '' || $imagePrompt === '') {
                    continue;
                }
                $ideas[] = [
                    'id' => (string) Str::uuid(),
                    'title' => $title,
                    'thumb_text' => $thumbText,
                    'rationale' => $rationale,
                    'image_prompt' => $imagePrompt,
                ];
            }

            if ($ideas === []) {
                return response()->json(['message' => 'No valid ideas were returned. Try again.'], 422);
            }

            return response()->json([
                'ideas' => $ideas,
                'source' => [
                    'input_mode' => $resolved['input_mode'],
                    'youtube_title' => $resolved['youtube_title'] ?? null,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('MirageController::ideas failed', [
                'error' => $e->getMessage(),
                'exception' => $e::class,
            ]);

            return response()->json([
                'message' => 'Mirage failed. Check logs or try again.',
            ], 500);
        }
    }

    /**
     * Generate images from DALL·E using prompts from the ideas step (max 4 per request).
     */
    public function images(Request $request): JsonResponse
    {
        $this->raiseRuntimeLimitForAgent();

        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        $setting = MirageSetting::getOrCreateForTenant($tenantId);
        $provider = $setting->image_provider;

        if ($provider->isOpenAi() && ! $this->cortexLlmFactory()->isOpenAiKeyConfigured()) {
            return response()->json([
                'message' => 'OpenAI is not configured. Add OPENAI_API_KEY to your environment.',
            ], 503);
        }

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:4'],
            'items.*.image_prompt' => ['required', 'string', 'max:4000'],
            'items.*.idea_id' => ['nullable', 'string', 'max:64'],
            'face_reference' => ['nullable', 'string', 'max:12000000'],
            'product_reference' => ['nullable', 'string', 'max:12000000'],
            'style_references' => ['nullable', 'array', 'max:'.MirageDataImageDecoder::MAX_STYLE_SAMPLES],
            'style_references.*' => ['nullable', 'string', 'max:12000000'],
        ]);

        $badRef = $this->mirageReferencePayloadError($request);
        if ($badRef !== null) {
            return response()->json(['message' => $badRef], 422);
        }

        $faceRef = isset($validated['face_reference']) ? trim((string) $validated['face_reference']) : '';
        $productRef = isset($validated['product_reference']) ? trim((string) $validated['product_reference']) : '';
        $styleRefStrings = $this->normalizeStyleReferenceInput($validated['style_references'] ?? null);
        $this->applyLibraryDefaultReferences($request, $tenantId, $faceRef, $styleRefStrings);
        $referenceLayers = MirageDataImageDecoder::allGenerationLayers(
            $faceRef !== '' ? $faceRef : null,
            $productRef !== '' ? $productRef : null,
            $styleRefStrings,
        );

        $results = [];

        foreach ($validated['items'] as $index => $item) {
            $prompt = trim((string) ($item['image_prompt'] ?? ''));
            $ideaId = isset($item['idea_id']) ? trim((string) $item['idea_id']) : null;

            if ($prompt === '') {
                $results[] = [
                    'index' => $index,
                    'idea_id' => $ideaId,
                    'error' => 'Empty prompt.',
                ];

                continue;
            }

            $out = $this->mirageImageService->generate($prompt, $provider, $setting->openai_image_model, $referenceLayers);

            if (isset($out['error'])) {
                $results[] = [
                    'index' => $index,
                    'idea_id' => $ideaId,
                    'error' => $out['error'],
                ];

                continue;
            }

            $results[] = [
                'index' => $index,
                'idea_id' => $ideaId,
                'url' => $out['url'] ?? null,
                'revised_prompt' => $out['revised_prompt'] ?? null,
            ];
        }

        return response()->json(['results' => $results]);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array{input: string, input_mode: string, youtube_title?: string|null}|array{error: string}
     */
    private function resolveMirageIdeasBody(array $validated): array
    {
        $mode = (string) ($validated['input_mode'] ?? 'script');
        if (! in_array($mode, ['script', 'youtube', 'prompt'], true)) {
            $mode = 'script';
        }

        if ($mode === 'youtube') {
            $url = trim((string) ($validated['youtube_url'] ?? ''));
            if ($url === '') {
                return ['error' => 'Paste a YouTube watch URL or an 11-character video ID.'];
            }

            $tx = $this->youtubeTranscript->fetchTranscript($url);
            if (! $tx['success']) {
                return ['error' => $tx['error']];
            }

            $title = trim((string) ($tx['title'] ?? ''));
            $text = trim((string) ($tx['text'] ?? ''));
            $input = 'YouTube video: '.($title !== '' ? $title : 'Unknown title')."\n\nTranscript:\n".$text;
            if (! empty($tx['truncated'])) {
                $input .= "\n\n[Note: transcript was truncated for length.]";
            }

            return [
                'input' => $input,
                'input_mode' => $mode,
                'youtube_title' => $title !== '' ? $title : null,
            ];
        }

        $rawInput = trim((string) ($validated['input'] ?? ''));
        if ($rawInput === '') {
            return ['error' => $mode === 'prompt'
                ? 'Add a short creative brief (tone, niche, or what the thumbnails should feel like).'
                : 'Paste a script, outline, or topic.'];
        }

        $input = $mode === 'prompt'
            ? "Creative brief from the user (short prompt — infer the video topic and thumbnail angles):\n---\n{$rawInput}\n---"
            : $rawInput;

        return [
            'input' => $input,
            'input_mode' => $mode,
            'youtube_title' => null,
        ];
    }

    private function ideasJsonModeSuffix(int $ideaCount, bool $hasReferencePhotos, bool $hasStyleSamples = false): string
    {
        $refNote = $hasReferencePhotos
            ? "\n\nWhen the user message includes FACE / PRODUCT reference notes or photos, every **image_prompt** must stay consistent with that likeness and product look (no real-person names)."
            : '';
        $styleNote = $hasStyleSamples
            ? "\n\nWhen the user message includes STYLE_SAMPLES or sample-thumbnail notes, every **thumb_text** and **image_prompt** should reflect that layout, palette, and typography vibe (adapted to this video’s topic)."
            : '';

        return <<<TXT
## Structured ideas mode (this request only — overrides conversational rules above)

Do **not** ask follow-up questions. Do **not** use Markdown. Respond with **only** valid JSON (no prose before or after, no code fences).

The JSON must match this shape exactly (types are descriptive):
{
  "ideas": [
    {
      "title": "string — YouTube title, aim under 70 characters",
      "thumb_text": "string — 2–4 words for on-thumbnail overlay, mobile-legible",
      "rationale": "string — one short sentence on why this could earn CTR honestly",
      "image_prompt": "string — one detailed English prompt for an image model: photorealistic YouTube thumbnail (16:9), cinematic lighting, sharp focus, readable large text if any. Must match the Visual focus block above (face-led, product-led, etc.). No real-person names, no trademarks, no celebrity likenesses."
    }
  ]
}

Produce **exactly {$ideaCount}** objects in \`ideas\`, each with a **distinct** angle (curiosity hook, emotion, or visual approach). Base everything on the user’s script or topic and the visual focus.{$refNote}{$styleNote}
TXT;
    }

    /**
     * Non-empty values must be valid data-URL images (max 5MB decoded).
     */
    private function mirageReferencePayloadError(Request $request): ?string
    {
        foreach (['face_reference' => 'face reference', 'product_reference' => 'product reference'] as $field => $label) {
            $raw = $request->input($field);
            if (! is_string($raw)) {
                continue;
            }
            $trim = trim($raw);
            if ($trim === '') {
                continue;
            }
            if (MirageDataImageDecoder::fromDataUrl($trim) === null) {
                return "Invalid {$label}: use a PNG, JPEG, GIF, or WebP image under 5MB (browser data URL).";
            }
        }

        $styles = $request->input('style_references');
        if (is_array($styles) && count($styles) > MirageDataImageDecoder::MAX_STYLE_SAMPLES) {
            return 'At most '.MirageDataImageDecoder::MAX_STYLE_SAMPLES.' sample thumbnails are allowed.';
        }
        if (is_array($styles)) {
            foreach ($styles as $idx => $raw) {
                if (! is_string($raw)) {
                    continue;
                }
                $trim = trim($raw);
                if ($trim === '') {
                    continue;
                }
                if (MirageDataImageDecoder::fromDataUrl($trim) === null) {
                    return 'Invalid sample thumbnail #'.(((int) $idx) + 1).': use a PNG, JPEG, GIF, or WebP image under 5MB (browser data URL).';
                }
            }
        }

        return null;
    }

    /**
     * @param  mixed  $raw
     * @return list<string>
     */
    private function normalizeStyleReferenceInput($raw): array
    {
        if (! is_array($raw)) {
            return [];
        }
        $out = [];
        foreach ($raw as $item) {
            if (count($out) >= MirageDataImageDecoder::MAX_STYLE_SAMPLES) {
                break;
            }
            if (! is_string($item)) {
                continue;
            }
            $t = trim($item);
            if ($t === '') {
                continue;
            }
            $out[] = $t;
        }

        return $out;
    }

    /**
     * When the user enabled “use saved defaults” and left refs empty, load their default library assets.
     *
     * @param  list<string>  $styleRefStrings
     */
    private function applyLibraryDefaultReferences(
        Request $request,
        string $tenantId,
        string &$faceRef,
        array &$styleRefStrings,
    ): void {
        $user = $request->user();
        if ($user === null) {
            return;
        }

        $pref = MirageUserPreference::query()
            ->where('tenant_id', $tenantId)
            ->where('user_id', $user->id)
            ->first();

        if ($pref === null) {
            return;
        }

        if ($pref->use_default_face_reference && trim($faceRef) === '') {
            $dataUrl = $this->defaultLibraryAssetDataUrl($tenantId, (int) $user->id, MirageReferenceAsset::KIND_FACE);
            if ($dataUrl !== null && MirageDataImageDecoder::fromDataUrl($dataUrl) !== null) {
                $faceRef = $dataUrl;
            }
        }

        if ($pref->use_default_style_references && $styleRefStrings === []) {
            $dataUrl = $this->defaultLibraryAssetDataUrl($tenantId, (int) $user->id, MirageReferenceAsset::KIND_STYLE);
            if ($dataUrl !== null && MirageDataImageDecoder::fromDataUrl($dataUrl) !== null) {
                $styleRefStrings = [$dataUrl];
            }
        }
    }

    private function defaultLibraryAssetDataUrl(string $tenantId, int $userId, string $kind): ?string
    {
        $asset = MirageReferenceAsset::query()
            ->where('tenant_id', $tenantId)
            ->forUser($userId)
            ->kind($kind)
            ->where('is_default', true)
            ->first();

        return $asset?->toDataUrlString();
    }

    /**
     * User-facing “face / product / …” choice, injected into the ideas request.
     */
    private function visualFocusInstruction(?string $focus): string
    {
        $lines = [
            'face' => 'Visual focus: **Face-led** — prominent human face or strong reaction (expressive close-up or talking-head style). Product may appear small.',
            'product' => 'Visual focus: **Product-led** — hero the object, gadget, screen, food, or packaging; face optional or absent.',
            'mixed' => 'Visual focus: **Face + product** — show both clearly (e.g. holding device, split layout, or face beside item).',
            'scene' => 'Visual focus: **Scene / mood** — environment, setting, or atmosphere; no recognizable face; can show hands or wide shot.',
        ];

        $key = $focus !== null && $focus !== '' ? $focus : 'mixed';
        $line = $lines[$key] ?? $lines['mixed'];

        return "Thumbnail visual direction (follow this for every image_prompt):\n{$line}";
    }

    /**
     * @return array<string, mixed>|null
     */
    private function decodeIdeasJson(string $content): ?array
    {
        $trim = trim($content);

        if (preg_match('/```(?:json)?\s*([\s\S]*?)\s*```/', $trim, $m)) {
            $trim = trim($m[1]);
        }

        $decoded = json_decode($trim, true);
        if (is_array($decoded)) {
            return $decoded;
        }

        if (preg_match('/\{[\s\S]*"ideas"[\s\S]*\}/', $trim, $m)) {
            $decoded = json_decode($m[0], true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return null;
    }

    private function raiseRuntimeLimitForAgent(): void
    {
        $seconds = (int) config('cortex.agent_max_execution_time', 300);
        set_time_limit($seconds > 0 ? $seconds : 0);
    }
}
