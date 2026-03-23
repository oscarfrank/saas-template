<?php

declare(strict_types=1);

namespace Modules\Cortex\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Cortex\Neuron\PulseAgent;
use NeuronAI\Chat\Messages\AssistantMessage;
use NeuronAI\Chat\Messages\UserMessage;

class PulseController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('cortex/agents/pulse', [
            'openAiConfigured' => $this->openAiIsConfigured(),
        ]);
    }

    public function chat(Request $request): JsonResponse
    {
        $this->raiseRuntimeLimitForAgent();

        if (! $this->openAiIsConfigured()) {
            return response()->json([
                'message' => 'OpenAI is not configured. Add OPENAI_API_KEY to your environment.',
            ], 503);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:8000'],
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
                    $messages[] = new AssistantMessage($content);
                } else {
                    $messages[] = new UserMessage($content);
                }
            }
        }

        $body = trim((string) $validated['message']);
        $context = trim((string) ($validated['context'] ?? ''));
        if ($context !== '') {
            $body = "Optional signals / feeds / pasted research (user-provided):\n---\n{$context}\n---\n\nUser request:\n{$body}";
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
