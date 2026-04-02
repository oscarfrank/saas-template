<?php

namespace Modules\Cortex\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Cortex\Http\Controllers\Concerns\InteractsWithCortexLlm;
use Modules\Cortex\Neuron\YouTubeVideoAgent;
use Modules\Cortex\Support\CortexAgentKey;
use Modules\Cortex\Support\CortexAgents;
use Modules\Cortex\Support\CortexLlmModelCatalog;
use Modules\Cortex\Support\CortexLlmProvider;
use NeuronAI\Chat\Messages\UserMessage;

class CortexController extends Controller
{
    use InteractsWithCortexLlm;

    /**
     * Cortex home: directory of available agents.
     */
    public function index(): Response
    {
        return Inertia::render('cortex/index', [
            'agents' => CortexAgents::definitions(),
            'cortexLlm' => [
                'default_openai_model' => (string) config('openai.chat_model', 'gpt-4o-mini'),
                'default_anthropic_model' => (string) config('anthropic.chat_model', 'claude-sonnet-4-20250514'),
                'openai_key_configured' => $this->cortexLlmFactory()->isOpenAiKeyConfigured(),
                'anthropic_key_configured' => $this->cortexLlmFactory()->isAnthropicKeyConfigured(),
                'openai_model_options' => CortexLlmModelCatalog::optionsFor(CortexLlmProvider::OpenAI),
                'anthropic_model_options' => CortexLlmModelCatalog::optionsFor(CortexLlmProvider::Anthropic),
            ],
        ]);
    }

    /**
     * YouTube video analyst agent UI.
     */
    public function youtubeAgent(): Response
    {
        $tenantId = tenant('id');

        return Inertia::render('cortex/agents/youtube', [
            'openAiConfigured' => $this->cortexOpenAiConfiguredProp(is_string($tenantId) ? $tenantId : null, CortexAgentKey::YoutubeVideo),
        ]);
    }

    /**
     * Run the YouTube analyst agent (JSON for the SPA panel).
     */
    public function youtubeAgentRun(Request $request): JsonResponse
    {
        $this->raiseRuntimeLimitForAgent();

        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        if (! $this->cortexLlmConfigured($tenantId, CortexAgentKey::YoutubeVideo)) {
            return response()->json([
                'message' => $this->cortexMissingLlmKeyMessage($tenantId, CortexAgentKey::YoutubeVideo),
            ], 503);
        }

        $validated = $request->validate([
            'video_url' => ['required', 'string', 'max:500'],
        ]);

        $prompt = <<<TXT
The user wants insights for this YouTube video:
{$validated['video_url']}

Use the fetch_youtube_transcript tool with this URL or ID to load captions when available, then respond following your output format.
TXT;

        try {
            $message = YouTubeVideoAgent::make()
                ->setAiProvider($this->cortexLlmFactory()->makeForTenantAgent($tenantId, CortexAgentKey::YoutubeVideo))
                ->toolMaxRuns(6)
                ->chat(new UserMessage($prompt))
                ->getMessage();

            $content = trim($message->getContent() ?? '');
            if ($content === '') {
                return response()->json(['message' => 'The agent returned an empty response. Try again.'], 422);
            }

            return response()->json(['reply' => $content]);
        } catch (\Throwable $e) {
            Log::error('CortexController::youtubeAgentRun failed', [
                'error' => $e->getMessage(),
                'exception' => $e::class,
            ]);

            return response()->json([
                'message' => 'The agent run failed. Check logs or try again in a moment.',
            ], 500);
        }
    }

    /**
     * Avoid PHP's default max_execution_time (e.g. 30s) aborting Guzzle mid-request
     * during tool + multi-step LLM calls.
     */
    private function raiseRuntimeLimitForAgent(): void
    {
        $seconds = (int) config('cortex.agent_max_execution_time', 300);
        if ($seconds > 0) {
            set_time_limit($seconds);

            return;
        }

        set_time_limit(0);
    }
}
