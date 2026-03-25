<?php

declare(strict_types=1);

namespace Modules\Cortex\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Cortex\Models\YoutubeDocSetting;
use Modules\Cortex\Neuron\YoutubeDocAgent;
use Modules\Cortex\Services\YoutubeDocAnalyticsSnapshotService;
use NeuronAI\Chat\Messages\AssistantMessage;
use NeuronAI\Chat\Messages\UserMessage;
use RuntimeException;

final class YoutubeDocController extends Controller
{
    /**
     * Channel analytics strategist UI.
     */
    public function index(): Response
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            abort(503);
        }

        $setting = YoutubeDocSetting::getOrCreateForTenant($tenantId);

        return Inertia::render('cortex/agents/youtube-doc', [
            'openAiConfigured' => $this->openAiIsConfigured(),
            'connected' => $setting->hasConnectedChannel(),
            'youtubeChannelTitle' => $setting->youtube_channel_title,
            'youtubeChannelId' => $setting->youtube_channel_id,
        ]);
    }

    /**
     * List channels the connected Google account can manage (for multi-channel accounts).
     */
    public function channels(): JsonResponse
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        $setting = YoutubeDocSetting::query()->where('tenant_id', $tenantId)->first();
        if ($setting === null || ! $setting->hasConnectedChannel()) {
            return response()->json(['message' => 'Connect YouTube Analytics first.'], 428);
        }

        try {
            $snapshotService = app(YoutubeDocAnalyticsSnapshotService::class);
            $channels = $snapshotService->listManagedChannels($setting);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 428);
        } catch (\Throwable $e) {
            Log::error('YoutubeDocController::channels failed', [
                'error' => $e->getMessage(),
                'exception' => $e::class,
            ]);

            return response()->json(['message' => 'Failed to list YouTube channels. Try again.'], 500);
        }

        return response()->json([
            'channels' => $channels,
            'selected_id' => $setting->youtube_channel_id,
        ]);
    }

    /**
     * Persist which channel this tenant analyzes (must belong to the connected Google account).
     */
    public function setChannel(Request $request): JsonResponse
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        $validated = $request->validate([
            'youtube_channel_id' => ['required', 'string', 'max:128'],
        ]);

        $setting = YoutubeDocSetting::query()->where('tenant_id', $tenantId)->first();
        if ($setting === null || ! $setting->hasConnectedChannel()) {
            return response()->json(['message' => 'Connect YouTube Analytics first.'], 428);
        }

        $targetId = trim((string) $validated['youtube_channel_id']);

        try {
            $snapshotService = app(YoutubeDocAnalyticsSnapshotService::class);
            $managed = $snapshotService->listManagedChannels($setting);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 428);
        } catch (\Throwable $e) {
            Log::error('YoutubeDocController::setChannel list failed', [
                'error' => $e->getMessage(),
                'exception' => $e::class,
            ]);

            return response()->json(['message' => 'Failed to verify channels. Try again.'], 500);
        }

        $match = null;
        foreach ($managed as $ch) {
            if ($ch['id'] === $targetId) {
                $match = $ch;
                break;
            }
        }

        if ($match === null) {
            return response()->json(['message' => 'That channel is not on this Google account.'], 422);
        }

        $setting->youtube_channel_id = $match['id'];
        $setting->youtube_channel_title = $match['title'] !== '' ? $match['title'] : null;
        $setting->save();

        return response()->json([
            'youtube_channel_id' => $setting->youtube_channel_id,
            'youtube_channel_title' => $setting->youtube_channel_title,
        ]);
    }

    /**
     * Start OAuth connect for this tenant.
     *
     * Note: callback is a single fixed path (not tenant-specific) and uses state to map back to the tenant.
     */
    public function connect(): RedirectResponse
    {
        $tenantId = tenant('id');
        $tenantSlug = tenant('slug');

        if (! is_string($tenantId) || $tenantId === '' || ! is_string($tenantSlug) || $tenantSlug === '') {
            abort(503);
        }

        $user = Auth::user();
        if ($user === null) {
            abort(403);
        }

        // Ensure the nonce roundtrip protects against CSRF.
        $nonce = Str::random(40);
        session()->put('youtube_doc_oauth_nonce', $nonce);

        $statePayload = [
            'tenant_id' => $tenantId,
            'tenant_slug' => $tenantSlug,
            'user_id' => (string) $user->id,
            'nonce' => $nonce,
        ];
        $state = Crypt::encryptString(json_encode($statePayload, JSON_THROW_ON_ERROR));

        $clientId = (string) config('services.google.client_id', '');
        if ($clientId === '') {
            abort(503, 'Google OAuth client_id is not configured.');
        }

        $scopes = [
            'https://www.googleapis.com/auth/youtube.readonly',
            'https://www.googleapis.com/auth/yt-analytics.readonly',
        ];

        $redirectUri = url(route('cortex.agents.youtube_doc.oauth.callback'));

        // Build auth URL manually (Socialite isn't used in this repo for YouTube Analytics scopes).
        $authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => implode(' ', $scopes),
            'access_type' => 'offline',
            'prompt' => 'consent',
            'include_granted_scopes' => 'true',
            'state' => $state,
        ]);

        YoutubeDocSetting::getOrCreateForTenant($tenantId);

        return redirect()->away($authUrl);
    }

    /**
     * OAuth callback (fixed URL; tenant resolved via state).
     */
    public function oauthCallback(Request $request): RedirectResponse
    {
        $stateParam = (string) ($request->query('state') ?? '');
        $code = (string) ($request->query('code') ?? '');

        if ($stateParam === '' || $code === '') {
            abort(400, 'Missing OAuth state or code.');
        }

        $user = Auth::user();
        if ($user === null) {
            abort(403);
        }

        $sessionNonce = (string) (session()->get('youtube_doc_oauth_nonce') ?? '');
        session()->forget('youtube_doc_oauth_nonce');

        try {
            $payload = json_decode(Crypt::decryptString($stateParam), true, flags: JSON_THROW_ON_ERROR);
        } catch (\Throwable $e) {
            abort(400, 'Invalid OAuth state.');
        }

        if (! is_array($payload)) {
            abort(400, 'Invalid OAuth state payload.');
        }

        $nonce = (string) ($payload['nonce'] ?? '');
        $tenantId = (string) ($payload['tenant_id'] ?? '');
        $tenantSlug = (string) ($payload['tenant_slug'] ?? '');
        $stateUserId = (string) ($payload['user_id'] ?? '');

        if ($nonce === '' || $tenantId === '' || $tenantSlug === '' || $stateUserId === '') {
            abort(400, 'Incomplete OAuth state payload.');
        }
        if ($sessionNonce === '' || ! hash_equals($sessionNonce, $nonce)) {
            abort(400, 'OAuth state verification failed.');
        }
        if (! hash_equals((string) $user->id, $stateUserId)) {
            abort(403, 'OAuth state user mismatch.');
        }

        $tenant = Tenant::query()->where('id', $tenantId)->first();
        if ($tenant === null) {
            abort(404, 'Tenant not found.');
        }

        // Authorization check (user must belong to the tenant).
        // Qualify `tenants.id` — join with `tenant_user` makes bare `id` ambiguous on SQLite.
        if (! $user->tenants()->where('tenants.id', $tenantId)->exists()) {
            abort(404);
        }

        tenancy()->initialize($tenant);

        try {
            $googleToken = Http::asForm()->timeout(30)->post('https://oauth2.googleapis.com/token', [
                'code' => $code,
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'redirect_uri' => url(route('cortex.agents.youtube_doc.oauth.callback')),
                'grant_type' => 'authorization_code',
            ])->throw()->json();

            $accessToken = (string) ($googleToken['access_token'] ?? '');
            $refreshToken = $googleToken['refresh_token'] ?? null;
            $expiresIn = (int) ($googleToken['expires_in'] ?? 3600);

            if ($accessToken === '') {
                throw new RuntimeException('OAuth callback did not return access_token.');
            }

            $setting = YoutubeDocSetting::getOrCreateForTenant($tenantId);
            $setting->google_access_token_expires_at = now()->addSeconds($expiresIn);
            $setting->google_access_token_encrypted = Crypt::encryptString($accessToken);
            $setting->connected_at = now();

            if (is_string($refreshToken) && $refreshToken !== '') {
                $setting->google_refresh_token_encrypted = Crypt::encryptString($refreshToken);
            } else {
                // If refresh_token isn't returned (common when the user previously granted consent),
                // keep the existing one if we already have it.
                if (! is_string($setting->google_refresh_token_encrypted) || $setting->google_refresh_token_encrypted === '') {
                    throw new RuntimeException('OAuth did not return a refresh_token; re-connect may be required.');
                }
            }

            // Fetch channel id/title from YouTube Data API (first page; user can pick another channel in the UI).
            $channelsResp = Http::withToken($accessToken)
                ->timeout(30)
                ->get('https://www.googleapis.com/youtube/v3/channels', [
                    'part' => 'snippet',
                    'mine' => 'true',
                    'maxResults' => 50,
                ])
                ->throw()
                ->json();

            $item = $channelsResp['items'][0] ?? null;
            if (is_array($item)) {
                $setting->youtube_channel_id = isset($item['id']) ? (string) $item['id'] : null;
                $setting->youtube_channel_title = isset($item['snippet']['title']) ? (string) $item['snippet']['title'] : null;
            }

            $setting->save();

            $chatUrl = route('cortex.agents.youtube_doc', ['tenant' => $tenantSlug]);

            return redirect()->to($chatUrl.'?connected=1');
        } catch (\Throwable $e) {
            Log::error('YoutubeDocController::oauthCallback failed', [
                'error' => $e->getMessage(),
                'exception' => $e::class,
            ]);

            $chatUrl = route('cortex.agents.youtube_doc', ['tenant' => $tenantSlug]);

            return redirect()->to($chatUrl.'?connected=0&error='.urlencode('OAuth connection failed. Try again.'));
        } finally {
            tenancy()->end();
        }
    }

    /**
     * Chat endpoint: answer with analytics snapshot context.
     */
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
            'history' => ['nullable', 'array'],
            'history.*.role' => ['nullable', 'string'],
            'history.*.content' => ['nullable', 'string'],
        ]);

        $setting = YoutubeDocSetting::query()->where('tenant_id', $tenantId)->first();
        if ($setting === null || ! $setting->hasConnectedChannel()) {
            return response()->json(['message' => 'Connect YouTube Analytics first.'], 428);
        }

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

        $userBody = trim((string) $validated['message']);
        $context = trim((string) ($validated['context'] ?? ''));

        try {
            $snapshotService = app(YoutubeDocAnalyticsSnapshotService::class);
            $snapshot = $snapshotService->snapshotForLastDays(28);
            $snapshotText = $snapshotService->formatSnapshotForPrompt($snapshot);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 428);
        } catch (\Throwable $e) {
            Log::error('YoutubeDocController::chat snapshot failed', [
                'error' => $e->getMessage(),
                'exception' => $e::class,
            ]);

            return response()->json(['message' => 'Failed to load YouTube analytics snapshot. Try again.'], 500);
        }

        $bodyParts = [];
        if ($context !== '') {
            $bodyParts[] = "## Extra context (one-off)\n\n".$context;
        }

        $bodyParts[] = $snapshotText;
        $bodyParts[] = "### User request\n\n".$userBody;

        $messages[] = new UserMessage(implode("\n\n---\n\n", $bodyParts));

        try {
            $agent = YoutubeDocAgent::make()->toolMaxRuns(0);
            $reply = $agent->chat($messages)->getMessage();

            $content = trim($reply->getContent() ?? '');
            if ($content === '') {
                return response()->json(['message' => 'Youtube Doc returned an empty response. Try again.'], 422);
            }

            return response()->json(['reply' => $content]);
        } catch (\Throwable $e) {
            Log::error('YoutubeDocController::chat failed', [
                'error' => $e->getMessage(),
                'exception' => $e::class,
            ]);

            return response()->json(['message' => 'Youtube Doc failed. Check logs or try again.'], 500);
        }
    }

    private function openAiIsConfigured(): bool
    {
        $key = config('openai.api_key');

        return is_string($key) && $key !== '';
    }

    /**
     * Avoid PHP's default max_execution_time aborting multi-step requests.
     */
    private function raiseRuntimeLimitForAgent(): void
    {
        $seconds = (int) config('cortex.agent_max_execution_time', 300);
        set_time_limit($seconds > 0 ? $seconds : 0);
    }
}
