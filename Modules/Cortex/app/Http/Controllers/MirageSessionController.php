<?php

declare(strict_types=1);

namespace Modules\Cortex\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Cortex\Models\MirageSession;
use Modules\Cortex\Models\MirageSessionOutput;
use Modules\Cortex\Models\MirageSessionTurn;
use Modules\Cortex\Services\MirageSessionPersistenceService;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class MirageSessionController extends Controller
{
    public function __construct(
        private readonly MirageController $miragePage,
        private readonly MirageSessionPersistenceService $persistence,
    ) {}

    public function historyIndex(Request $request): Response
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '' || $request->user() === null) {
            abort(403);
        }

        $sessions = MirageSession::query()
            ->where('tenant_id', $tenantId)
            ->ownedBy($request->user()->id)
            ->orderByDesc('last_activity_at')
            ->limit(80)
            ->get(['id', 'title', 'last_activity_at', 'created_at']);

        return Inertia::render('cortex/agents/mirage-history', [
            'sessions' => $sessions->map(fn (MirageSession $s) => [
                'id' => $s->id,
                'title' => $s->title ?? 'Untitled',
                'last_activity_at' => $s->last_activity_at?->toIso8601String(),
                'created_at' => $s->created_at?->toIso8601String(),
            ]),
        ]);
    }

    public function show(Request $request, string $mirageSession): Response
    {
        $session = $this->findSessionForUser($request, $mirageSession);

        $tenantSlug = $this->resolveTenantSlug($request);

        return Inertia::render('cortex/agents/mirage', array_merge(
            $this->miragePage->miragePageBaseProps($request),
            [
                'mirageSession' => $this->formatSessionForClient($session, $tenantSlug),
            ],
        ));
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '' || $request->user() === null) {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:200'],
        ]);

        $session = MirageSession::query()->create([
            'tenant_id' => $tenantId,
            'user_id' => $request->user()->id,
            'title' => isset($validated['title']) ? (string) $validated['title'] : null,
            'last_activity_at' => now(),
        ]);

        return response()->json([
            'id' => $session->id,
            'title' => $session->title,
        ]);
    }

    public function storeTurn(Request $request, string $mirageSession): JsonResponse
    {
        $session = $this->findSessionForUser($request, $mirageSession);
        if ($request->user() === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'input_mode' => ['required', 'string', 'in:script,youtube,prompt'],
            'focus' => ['required', 'string', 'in:face,product,mixed,scene'],
            'idea_count' => ['required', 'integer', 'min:1', 'max:12'],
            'input_text' => ['nullable', 'string', 'max:200000'],
            'youtube_url' => ['nullable', 'string', 'max:2048'],
            'source' => ['nullable', 'array'],
            'ideas' => ['required', 'array', 'min:1'],
            'image_by_idea_id' => ['nullable', 'array'],
        ]);

        /** @var list<array<string, mixed>> $ideas */
        $ideas = $validated['ideas'];
        $imageByIdea = [];
        $raw = $validated['image_by_idea_id'] ?? null;
        if (is_array($raw)) {
            foreach ($raw as $ideaId => $row) {
                if (! is_string($ideaId) && ! is_int($ideaId)) {
                    continue;
                }
                $key = (string) $ideaId;
                if (! is_array($row)) {
                    $imageByIdea[$key] = [];
                } else {
                    $imageByIdea[$key] = $row;
                }
            }
        }

        $source = isset($validated['source']) && is_array($validated['source']) ? $validated['source'] : null;
        $inputText = isset($validated['input_text']) ? (string) $validated['input_text'] : null;
        $yt = isset($validated['youtube_url']) ? (string) $validated['youtube_url'] : null;

        try {
            $turn = $this->persistence->appendTurn(
                $session,
                (string) $validated['input_mode'],
                (string) $validated['focus'],
                (int) $validated['idea_count'],
                $inputText !== '' ? $inputText : null,
                $yt !== '' ? $yt : null,
                $source,
                $ideas,
                $imageByIdea,
            );
        } catch (Throwable $e) {
            return response()->json(['message' => 'Could not save this run.'], 500);
        }

        return response()->json([
            'turn' => $this->formatTurnForClient($turn, $this->resolveTenantSlug($request)),
        ]);
    }

    public function destroyOutput(Request $request, MirageSessionOutput $mirageSessionOutput): JsonResponse
    {
        $this->authorizeOutput($request, $mirageSessionOutput);
        if ($mirageSessionOutput->trashed()) {
            return response()->json(['message' => 'Already removed.'], 200);
        }

        DB::transaction(function () use ($mirageSessionOutput) {
            $disk = $mirageSessionOutput->disk;
            $path = $mirageSessionOutput->path;
            if ($path !== null && is_string($path) && Storage::disk($disk)->exists($path)) {
                Storage::disk($disk)->delete($path);
            }
            $mirageSessionOutput->delete();
        });

        return response()->json(['ok' => true]);
    }

    public function destroySession(Request $request, string $mirageSession): JsonResponse
    {
        $session = $this->findSessionForUser($request, $mirageSession);
        $session->delete();

        return response()->json(['ok' => true]);
    }

    public function file(Request $request, MirageSessionOutput $mirageSessionOutput): StreamedResponse|\Illuminate\Http\Response
    {
        $this->authorizeOutput($request, $mirageSessionOutput);
        if ($mirageSessionOutput->trashed()) {
            abort(404);
        }
        $path = $mirageSessionOutput->path;
        if (! is_string($path) || $path === '' || ! Storage::disk($mirageSessionOutput->disk)->exists($path)) {
            abort(404);
        }

        return Storage::disk($mirageSessionOutput->disk)->response(
            $path,
            $mirageSessionOutput->title.'.image',
            ['Content-Type' => $mirageSessionOutput->mime ?: 'image/png'],
        );
    }

    /**
     * URL segment may be a slug string, or (if ever bound) a tenant model. Prefer the active tenant from tenancy.
     */
    private function resolveTenantSlug(Request $request): string
    {
        $fromTenancy = tenant('slug');
        if (is_string($fromTenancy) && $fromTenancy !== '') {
            return $fromTenancy;
        }

        $param = $request->route('tenant');
        if (is_object($param) && isset($param->slug) && is_string($param->slug) && $param->slug !== '') {
            return $param->slug;
        }

        $asString = (string) $param;
        if ($asString !== '') {
            return $asString;
        }

        abort(503, 'Tenant context missing.');
    }

    private function findSessionForUser(Request $request, string $id): MirageSession
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '' || $request->user() === null) {
            abort(404);
        }

        /** @var MirageSession|null $session */
        $session = MirageSession::query()
            ->where('tenant_id', $tenantId)
            ->ownedBy($request->user()->id)
            ->where('id', $id)
            ->first();

        if ($session === null) {
            abort(404);
        }

        return $session;
    }

    private function authorizeOutput(Request $request, MirageSessionOutput $output): void
    {
        if ($request->user() === null) {
            abort(403);
        }
        $output->load('turn.session');
        $session = $output->turn?->session;
        if ($session === null) {
            abort(404);
        }
        if ((int) $session->user_id !== (int) $request->user()->id) {
            abort(403);
        }
        $tid = tenant('id');
        if (! is_string($tid) || $session->tenant_id !== $tid) {
            abort(404);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function formatSessionForClient(MirageSession $session, string $tenantSlug): array
    {
        $session->load(['turns.outputs' => function ($q) {
            $q->orderBy('id');
        }]);

        $turns = $session->turns->map(fn (MirageSessionTurn $t) => $this->formatTurnForClient($t, $tenantSlug));

        return [
            'id' => $session->id,
            'title' => $session->title ?? 'Untitled',
            'turns' => $turns,
        ];
    }

    private function formatTurnForClient(MirageSessionTurn $turn, string $tenantSlug): array
    {
        $ideas = is_array($turn->ideas_json) ? $turn->ideas_json : [];
        $byIdea = [];
        foreach ($turn->outputs as $out) {
            if (! $out instanceof MirageSessionOutput) {
                continue;
            }
            if ($out->trashed()) {
                continue;
            }
            $url = null;
            if ($out->path !== null && is_string($out->path) && $out->path !== '') {
                $url = route('cortex.agents.mirage.outputs.file', [
                    'tenant' => $tenantSlug,
                    'mirageSessionOutput' => $out->id,
                ]);
            }
            $byIdea[$out->idea_id] = [
                'output_id' => $out->id,
                'url' => $url,
                'revised_prompt' => $out->revised_prompt,
                'error' => $out->error_message,
            ];
        }

        return [
            'id' => (int) $turn->id,
            'position' => (int) $turn->position,
            'input_mode' => $turn->input_mode,
            'focus' => $turn->focus,
            'idea_count' => (int) $turn->idea_count,
            'input_text' => $turn->input_text,
            'youtube_url' => $turn->youtube_url,
            'source' => $turn->source_json,
            'ideas' => $ideas,
            'imageByIdeaId' => $byIdea,
        ];
    }
}
