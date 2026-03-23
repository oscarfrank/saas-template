<?php

declare(strict_types=1);

namespace Modules\Cortex\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Modules\Cortex\Jobs\PulseRunDigestPipelineJob;
use Modules\Cortex\Models\PulseDailyDigest;
use Modules\Cortex\Models\PulseFeed;
use Modules\Cortex\Models\PulseSetting;
use Modules\Cortex\Neuron\PulseAgent;
use Modules\Cortex\Services\PulseFeedRefresher;
use Modules\Cortex\Services\PulseFeedSignalsBuilder;
use NeuronAI\Chat\Messages\AssistantMessage;
use NeuronAI\Chat\Messages\UserMessage;

class PulseController extends Controller
{
    public function __construct(
        private readonly PulseFeedRefresher $feedRefresher,
        private readonly PulseFeedSignalsBuilder $signalsBuilder,
    ) {}

    public function index(): InertiaResponse
    {
        $tenantId = tenant('id');
        $feeds = [];
        if (is_string($tenantId) && $tenantId !== '') {
            $feeds = PulseFeed::query()
                ->where('tenant_id', $tenantId)
                ->orderBy('name')
                ->get()
                ->map(fn (PulseFeed $f) => $this->feedToArray($f))
                ->values()
                ->all();
        }

        $maxItems = 25;
        $digest = null;
        $digestDate = null;
        if (is_string($tenantId) && $tenantId !== '') {
            $maxItems = PulseSetting::maxItemsForTenant($tenantId);
            $digestDate = $this->todayDigestDateYmd();
            $row = PulseDailyDigest::query()
                ->where('tenant_id', $tenantId)
                ->whereDate('digest_date', $digestDate)
                ->first();
            if ($row !== null) {
                $digest = $this->digestToArray($row);
            }
        }

        return Inertia::render('cortex/agents/pulse', [
            'openAiConfigured' => $this->openAiIsConfigured(),
            'feeds' => $feeds,
            'max_items_per_feed' => $maxItems,
            'digest' => $digest,
            'digest_date' => $digestDate,
        ]);
    }

    public function feedsIndex(): InertiaResponse
    {
        $tenantId = tenant('id');
        $feeds = [];
        if (is_string($tenantId) && $tenantId !== '') {
            $feeds = PulseFeed::query()
                ->where('tenant_id', $tenantId)
                ->orderBy('name')
                ->get()
                ->map(fn (PulseFeed $f) => $this->feedToArray($f))
                ->values()
                ->all();
        }

        $maxItems = 25;
        if (is_string($tenantId) && $tenantId !== '') {
            $maxItems = PulseSetting::maxItemsForTenant($tenantId);
        }

        return Inertia::render('cortex/agents/pulse/feeds', [
            'openAiConfigured' => $this->openAiIsConfigured(),
            'feeds' => $feeds,
            'max_items_per_feed' => $maxItems,
        ]);
    }

    public function settingsIndex(): InertiaResponse
    {
        $tenantId = tenant('id');
        $maxItems = 25;
        if (is_string($tenantId) && $tenantId !== '') {
            $maxItems = PulseSetting::maxItemsForTenant($tenantId);
        }

        $autoPullEnabled = false;
        $autoPullTime = '07:00';
        $digestTimezone = null;
        if (is_string($tenantId) && $tenantId !== '') {
            $s = PulseSetting::getOrCreateForTenant($tenantId);
            $autoPullEnabled = (bool) $s->auto_pull_enabled;
            $autoPullTime = is_string($s->auto_pull_time) && $s->auto_pull_time !== '' ? $s->auto_pull_time : '07:00';
            $digestTimezone = $s->digest_timezone;
        }

        return Inertia::render('cortex/agents/pulse/settings', [
            'openAiConfigured' => $this->openAiIsConfigured(),
            'max_items_per_feed' => $maxItems,
            'auto_pull_enabled' => $autoPullEnabled,
            'auto_pull_time' => $autoPullTime,
            'digest_timezone' => $digestTimezone,
        ]);
    }

    public function settingsUpdate(Request $request): JsonResponse|\Illuminate\Http\RedirectResponse
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        $validated = $request->validate([
            'max_items_per_feed' => ['required', 'integer', 'min:1', 'max:100'],
            'auto_pull_enabled' => ['sometimes', 'boolean'],
            'auto_pull_time' => ['nullable', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'digest_timezone' => ['nullable', 'string', 'max:64'],
        ]);

        $row = PulseSetting::getOrCreateForTenant($tenantId);
        $row->max_items_per_feed = (int) $validated['max_items_per_feed'];
        if (array_key_exists('auto_pull_enabled', $validated)) {
            $row->auto_pull_enabled = (bool) $validated['auto_pull_enabled'];
        }
        if (array_key_exists('auto_pull_time', $validated) && isset($validated['auto_pull_time'])) {
            $row->auto_pull_time = (string) $validated['auto_pull_time'];
        }
        if (array_key_exists('digest_timezone', $validated)) {
            $row->digest_timezone = isset($validated['digest_timezone']) && $validated['digest_timezone'] !== ''
                ? (string) $validated['digest_timezone']
                : null;
        }
        $row->save();

        if ($request->wantsJson() || $request->expectsJson()) {
            $row->refresh();

            return response()->json([
                'max_items_per_feed' => PulseSetting::maxItemsForTenant($tenantId),
                'message' => 'Settings saved.',
                'auto_pull_enabled' => (bool) $row->auto_pull_enabled,
                'auto_pull_time' => $row->auto_pull_time ?? '07:00',
                'digest_timezone' => $row->digest_timezone,
            ]);
        }

        $slug = tenant('slug');
        if (! is_string($slug) || $slug === '') {
            return redirect()->back()->with('error', 'Tenant context missing.');
        }

        return redirect()->route('cortex.agents.pulse.settings', ['tenant' => $slug])
            ->with('success', 'Settings saved.');
    }

    /**
     * Download feed list as JSON (names, URLs, enabled flags — no cached items).
     */
    public function exportFeeds(): \Illuminate\Http\Response
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            abort(503);
        }

        $feeds = PulseFeed::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get(['name', 'feed_url', 'enabled']);

        $payload = [
            'pulse_feed_export_version' => 1,
            'exported_at' => now()->toIso8601String(),
            'max_items_per_feed' => PulseSetting::maxItemsForTenant($tenantId),
            'feeds' => $feeds->map(fn (PulseFeed $f) => [
                'name' => $f->name,
                'feed_url' => $f->feed_url,
                'enabled' => $f->enabled,
            ])->values()->all(),
        ];

        $json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);

        return response($json, 200, [
            'Content-Type' => 'application/json; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="pulse-feeds.json"',
        ]);
    }

    public function importFeeds(Request $request): JsonResponse
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        if ($request->hasFile('file')) {
            $request->validate([
                'file' => ['required', 'file', 'max:1024'],
            ]);
        }

        $data = $this->decodeImportPayload($request);
        if ($data === null) {
            return response()->json(['message' => 'Invalid JSON. Expected an object with a "feeds" array.'], 422);
        }

        if ($request->hasFile('file')) {
            $data['replace'] = $request->boolean('replace');
            $data['apply_settings'] = $request->boolean('apply_settings');
        }

        $feedsInput = $data['feeds'] ?? null;
        if (! is_array($feedsInput)) {
            return response()->json(['message' => 'Missing "feeds" array.'], 422);
        }

        $replace = filter_var($data['replace'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $applySettings = filter_var($data['apply_settings'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if ($applySettings && isset($data['max_items_per_feed'])) {
            $n = (int) $data['max_items_per_feed'];
            if ($n >= 1 && $n <= 100) {
                $s = PulseSetting::getOrCreateForTenant($tenantId);
                $s->max_items_per_feed = $n;
                $s->save();
            }
        }

        $created = 0;
        $skipped = 0;
        $errors = [];

        try {
            DB::transaction(function () use ($tenantId, $feedsInput, $replace, &$created, &$skipped, &$errors) {
                if ($replace) {
                    PulseFeed::query()->where('tenant_id', $tenantId)->delete();
                }

                $existingUrls = PulseFeed::query()
                    ->where('tenant_id', $tenantId)
                    ->pluck('feed_url')
                    ->flip()
                    ->all();

                foreach ($feedsInput as $i => $row) {
                    if (! is_array($row)) {
                        $errors[] = "Row {$i}: not an object.";

                        continue;
                    }
                    $name = isset($row['name']) ? trim((string) $row['name']) : '';
                    $url = isset($row['feed_url']) ? trim((string) $row['feed_url']) : '';
                    $enabled = array_key_exists('enabled', $row) ? (bool) $row['enabled'] : true;

                    if ($name === '' || $url === '') {
                        $errors[] = "Row {$i}: name and feed_url are required.";

                        continue;
                    }
                    if (strlen($name) > 255 || strlen($url) > 2000) {
                        $errors[] = "Row {$i}: name or URL too long.";

                        continue;
                    }
                    if (! filter_var($url, FILTER_VALIDATE_URL)) {
                        $errors[] = "Row {$i}: invalid feed_url.";

                        continue;
                    }

                    if (! $replace && isset($existingUrls[$url])) {
                        $skipped++;

                        continue;
                    }

                    $feed = new PulseFeed([
                        'tenant_id' => $tenantId,
                        'name' => $name,
                        'feed_url' => $url,
                        'enabled' => $enabled,
                    ]);
                    $feed->save();
                    $existingUrls[$url] = true;
                    $created++;
                    // Do not fetch RSS here: N feeds × ~22s HTTP timeout can exceed PHP/proxy limits.
                    // User can "Refresh all" after import to cache headlines.
                }
            });
        } catch (\Throwable $e) {
            Log::error('PulseController::importFeeds failed', [
                'error' => $e->getMessage(),
                'exception' => $e::class,
            ]);

            return response()->json(['message' => 'Import failed. Check logs.'], 500);
        }

        $fresh = PulseFeed::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get()
            ->map(fn (PulseFeed $f) => $this->feedToArray($f))
            ->values()
            ->all();

        return response()->json([
            'message' => 'Feeds saved. Use Refresh all to fetch headlines into the cache.',
            'created' => $created,
            'skipped' => $skipped,
            'errors' => $errors,
            'feeds' => $fresh,
            'max_items_per_feed' => PulseSetting::maxItemsForTenant($tenantId),
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function decodeImportPayload(Request $request): ?array
    {
        if ($request->isJson() && $request->has('feeds')) {
            $all = $request->json()->all();

            return is_array($all) ? $all : null;
        }

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            if ($file === null || ! $file->isValid()) {
                return null;
            }
            $raw = file_get_contents($file->getRealPath() ?: '');
            if ($raw === false || $raw === '') {
                return null;
            }
            try {
                $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
            } catch (\JsonException) {
                return null;
            }

            return is_array($decoded) ? $decoded : null;
        }

        $json = $request->input('json');
        if (is_string($json) && $json !== '') {
            try {
                $decoded = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
            } catch (\JsonException) {
                return null;
            }

            return is_array($decoded) ? $decoded : null;
        }

        $all = $request->all();
        if (isset($all['feeds']) && is_array($all['feeds'])) {
            return $all;
        }

        return null;
    }

    public function storeFeed(Request $request): JsonResponse
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'feed_url' => ['required', 'string', 'max:2000'],
        ]);

        $url = trim($validated['feed_url']);
        $exists = PulseFeed::query()
            ->where('tenant_id', $tenantId)
            ->where('feed_url', $url)
            ->exists();
        if ($exists) {
            return response()->json(['message' => 'This feed URL is already saved.'], 422);
        }

        $feed = new PulseFeed([
            'tenant_id' => $tenantId,
            'name' => trim($validated['name']),
            'feed_url' => $url,
            'enabled' => true,
        ]);
        $feed->save();

        $this->feedRefresher->refreshSnapshot($feed);

        return response()->json(['feed' => $this->feedToArray($feed->fresh())]);
    }

    public function updateFeed(Request $request, int $pulseFeed): JsonResponse
    {
        $feed = $this->findTenantFeedOrAbort($pulseFeed);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'enabled' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('name', $validated)) {
            $feed->name = trim((string) $validated['name']);
        }
        if (array_key_exists('enabled', $validated)) {
            $feed->enabled = (bool) $validated['enabled'];
        }
        $feed->save();

        return response()->json(['feed' => $this->feedToArray($feed->fresh())]);
    }

    public function destroyFeed(int $pulseFeed): JsonResponse
    {
        $feed = $this->findTenantFeedOrAbort($pulseFeed);
        $feed->delete();

        return response()->json(['message' => 'Feed removed.']);
    }

    public function refreshFeed(int $pulseFeed): JsonResponse
    {
        $feed = $this->findTenantFeedOrAbort($pulseFeed);
        $this->feedRefresher->refreshSnapshot($feed);

        return response()->json(['feed' => $this->feedToArray($feed->fresh())]);
    }

    public function refreshAllFeeds(): JsonResponse
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        $feeds = PulseFeed::query()->where('tenant_id', $tenantId)->orderBy('name')->get();
        $count = $feeds->count();
        if ($count > 0) {
            // Headroom above PulseRssFetcher::TIMEOUT_SECONDS per feed; capped to avoid runaway.
            $seconds = min(3600, max(120, $count * 28));
            set_time_limit($seconds);
        }

        foreach ($feeds as $feed) {
            $this->feedRefresher->refreshSnapshot($feed);
        }

        $fresh = PulseFeed::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get()
            ->map(fn (PulseFeed $f) => $this->feedToArray($f))
            ->values()
            ->all();

        return response()->json(['feeds' => $fresh]);
    }

    public function chat(Request $request): JsonResponse
    {
        $this->raiseRuntimeLimitForAgent();

        if (! $this->openAiIsConfigured()) {
            return response()->json([
                'message' => 'OpenAI is not configured. Add OPENAI_API_KEY to your environment.',
            ], 503);
        }

        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:8000'],
            'context' => ['nullable', 'string', 'max:20000'],
            'feed_ids' => ['sometimes', 'array'],
            'feed_ids.*' => ['integer'],
            'include_daily_digest' => ['sometimes', 'boolean'],
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
                    $messages[] = new AssistantMessage($content);
                } else {
                    $messages[] = new UserMessage($content);
                }
            }
        }

        $body = trim((string) $validated['message']);
        $context = trim((string) ($validated['context'] ?? ''));

        // feed_ids omitted = all enabled feeds; [] = exclude saved feeds from this message; [ids] = subset
        $feedIds = null;
        if ($request->has('feed_ids')) {
            $feedIds = array_values(array_map('intval', $validated['feed_ids'] ?? []));
        }

        $signals = $this->signalsBuilder->build($tenantId, $feedIds);
        $parts = [];
        if ($signals !== '') {
            $parts[] = "## Saved feed signals (cached from your Pulse feeds — refresh feeds to update)\n\n".$signals;
        }
        if ($request->boolean('include_daily_digest')) {
            $date = $this->todayDigestDateYmd();
            $digestModel = PulseDailyDigest::query()
                ->where('tenant_id', $tenantId)
                ->whereDate('digest_date', $date)
                ->first();
            if ($digestModel !== null && $digestModel->ideas_status === 'completed') {
                $parts[] = "## Today's generated ideas (Pulse digest)\n\n".$this->formatDigestForChat($digestModel);
            }
        }
        if ($context !== '') {
            $parts[] = "## Extra notes (one-off context)\n\n".$context;
        }
        if ($parts !== []) {
            $body = implode("\n\n", $parts)."\n\n---\n\n**User request:**\n".$body;
        }

        $messages[] = new UserMessage($body);

        try {
            $agent = PulseAgent::make()
                ->toolMaxRuns(0);

            $reply = $agent
                ->chat($messages)
                ->getMessage();

            $content = trim($reply->getContent() ?? '');
            if ($content === '') {
                return response()->json(['message' => 'Pulse returned an empty response. Try again.'], 422);
            }

            return response()->json(['reply' => $content]);
        } catch (\Throwable $e) {
            Log::error('PulseController::chat failed', [
                'error' => $e->getMessage(),
                'exception' => $e::class,
            ]);

            return response()->json([
                'message' => 'Pulse failed. Check logs or try again.',
            ], 500);
        }
    }

    public function digestRun(Request $request): JsonResponse
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        $validated = $request->validate([
            'mode' => ['required', 'string', 'in:full,feeds,ideas'],
        ]);

        if ($validated['mode'] !== 'feeds' && ! $this->openAiIsConfigured()) {
            return response()->json([
                'message' => 'OpenAI is not configured. Feed refresh only, or add OPENAI_API_KEY for idea generation.',
            ], 503);
        }

        $date = $this->todayDigestDateYmd();
        PulseDailyDigest::getOrCreateForTenantDate($tenantId, $date);

        PulseRunDigestPipelineJob::dispatch($tenantId, $validated['mode'], $date, false);

        $digestRow = PulseDailyDigest::query()
            ->where('tenant_id', $tenantId)
            ->whereDate('digest_date', $date)
            ->first();

        return response()->json([
            'message' => 'Digest run queued.',
            'digest' => $digestRow !== null ? $this->digestToArray($digestRow) : null,
        ]);
    }

    public function digestToday(): JsonResponse
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        $date = $this->todayDigestDateYmd();
        $digestRow = PulseDailyDigest::query()
            ->where('tenant_id', $tenantId)
            ->whereDate('digest_date', $date)
            ->first();

        return response()->json([
            'digest_date' => $date,
            'digest' => $digestRow !== null ? $this->digestToArray($digestRow) : null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function digestToArray(PulseDailyDigest $d): array
    {
        return [
            'digest_date' => $d->digest_date->toDateString(),
            'feeds_status' => $d->feeds_status,
            'ideas_status' => $d->ideas_status,
            'feeds_refreshed_at' => $d->feeds_refreshed_at?->toIso8601String(),
            'ideas_generated_at' => $d->ideas_generated_at?->toIso8601String(),
            'feeds_error' => $d->feeds_error,
            'ideas_error' => $d->ideas_error,
            'intro_summary' => $d->intro_summary,
            'tweets' => is_array($d->tweets) ? $d->tweets : [],
            'shorts' => is_array($d->shorts) ? $d->shorts : [],
            'youtube' => is_array($d->youtube) ? $d->youtube : [],
        ];
    }

    private function todayDigestDateYmd(): string
    {
        $tenantId = tenant('id');
        $tz = (string) config('app.timezone');
        if (is_string($tenantId) && $tenantId !== '') {
            $s = PulseSetting::query()->where('tenant_id', $tenantId)->first();
            if ($s !== null && is_string($s->digest_timezone) && $s->digest_timezone !== '') {
                $tz = $s->digest_timezone;
            }
        }

        return now($tz)->toDateString();
    }

    private function formatDigestForChat(PulseDailyDigest $d): string
    {
        $lines = [];
        if (is_string($d->intro_summary) && $d->intro_summary !== '') {
            $lines[] = $d->intro_summary;
            $lines[] = '';
        }
        $tweets = is_array($d->tweets) ? $d->tweets : [];
        $shorts = is_array($d->shorts) ? $d->shorts : [];
        $youtube = is_array($d->youtube) ? $d->youtube : [];

        if ($tweets !== []) {
            $lines[] = '### Tweets';
            foreach ($tweets as $i => $row) {
                if (! is_array($row)) {
                    continue;
                }
                $n = $i + 1;
                $title = (string) ($row['title'] ?? '');
                $hook = (string) ($row['hook'] ?? '');
                $angle = (string) ($row['angle'] ?? '');
                $lines[] = "{$n}. **{$title}** — {$hook}";
                if ($angle !== '') {
                    $lines[] = '   '.$angle;
                }
            }
            $lines[] = '';
        }
        if ($shorts !== []) {
            $lines[] = '### Shorts';
            foreach ($shorts as $i => $row) {
                if (! is_array($row)) {
                    continue;
                }
                $n = $i + 1;
                $title = (string) ($row['title'] ?? '');
                $hook = (string) ($row['hook'] ?? '');
                $lines[] = "{$n}. **{$title}** — {$hook}";
            }
            $lines[] = '';
        }
        if ($youtube !== []) {
            $lines[] = '### Long-form YouTube';
            foreach ($youtube as $i => $row) {
                if (! is_array($row)) {
                    continue;
                }
                $n = $i + 1;
                $title = (string) ($row['title'] ?? '');
                $hook = (string) ($row['hook'] ?? '');
                $angle = (string) ($row['angle'] ?? '');
                $lines[] = "{$n}. **{$title}** — {$hook}";
                if ($angle !== '') {
                    $lines[] = '   '.$angle;
                }
            }
        }

        return trim(implode("\n", $lines));
    }

    /**
     * @return array<string, mixed>
     */
    private function feedToArray(PulseFeed $f): array
    {
        $snap = $f->cached_snapshot ?? [];
        $items = is_array($snap['items'] ?? null) ? $snap['items'] : [];

        return [
            'id' => $f->id,
            'name' => $f->name,
            'feed_url' => $f->feed_url,
            'enabled' => $f->enabled,
            'last_fetched_at' => $f->last_fetched_at?->toIso8601String(),
            'item_count' => count($items),
            'fetch_error' => is_string($snap['error'] ?? null) ? $snap['error'] : null,
        ];
    }

    private function findTenantFeedOrAbort(int $id): PulseFeed
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            abort(503);
        }

        /** @var PulseFeed|null $feed */
        $feed = PulseFeed::query()
            ->where('tenant_id', $tenantId)
            ->where('id', $id)
            ->first();

        if ($feed === null) {
            abort(404);
        }

        return $feed;
    }

    private function openAiIsConfigured(): bool
    {
        $key = config('openai.api_key');

        return is_string($key) && $key !== '';
    }

    private function raiseRuntimeLimitForAgent(): void
    {
        $seconds = (int) config('cortex.agent_max_execution_time', 300);
        set_time_limit($seconds > 0 ? $seconds : 0);
    }
}
