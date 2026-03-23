<?php

namespace Modules\Cortex\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Cortex\Neuron\YouTubeVideoAgent;
use Modules\Cortex\Support\CortexAgents;
use NeuronAI\Chat\Messages\UserMessage;

class CortexController extends Controller
{
    /**
     * Cortex home: directory of available agents.
     */
    public function index(): Response
    {
        return Inertia::render('cortex/index', [
            'agents' => CortexAgents::definitions(),
        ]);
    }

    /**
     * YouTube video analyst agent UI.
     */
    public function youtubeAgent(): Response
    {
        return Inertia::render('cortex/agents/youtube', [
            'openAiConfigured' => $this->openAiIsConfigured(),
        ]);
    }

    /**
     * Run the YouTube analyst agent (JSON for the SPA panel).
     */
    public function youtubeAgentRun(Request $request): JsonResponse
    {
        $this->raiseRuntimeLimitForAgent();

        if (! $this->openAiIsConfigured()) {
            return response()->json([
                'message' => 'OpenAI is not configured. Add OPENAI_API_KEY to your environment.',
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

    private function openAiIsConfigured(): bool
    {
        $key = config('openai.api_key');

        return is_string($key) && $key !== '';
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
