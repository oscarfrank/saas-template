<?php

declare(strict_types=1);

namespace Modules\Cortex\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\TenantAiPromptResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Cortex\Neuron\QuillAgent;
use NeuronAI\Chat\Messages\AssistantMessage;
use NeuronAI\Chat\Messages\UserMessage;

class QuillController extends Controller
{
    public const PROMPT_KEY = 'cortex.quill';

    public function __construct(
        private readonly TenantAiPromptResolver $promptResolver,
    ) {}

    public function index(): Response
    {
        /** @var array<string, mixed> $definitions */
        $definitions = config('ai_prompts.definitions', []);
        $meta = $definitions[self::PROMPT_KEY] ?? [];

        return Inertia::render('cortex/agents/quill', [
            'openAiConfigured' => $this->openAiIsConfigured(),
            'promptKey' => self::PROMPT_KEY,
            'promptLabel' => is_array($meta) ? (string) ($meta['label'] ?? 'Quill') : 'Quill',
            'promptDescription' => is_array($meta) ? (string) ($meta['description'] ?? '') : '',
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

        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            return response()->json(['message' => 'Tenant context missing.'], 503);
        }

        $systemPrompt = trim($this->promptResolver->resolve($tenantId, self::PROMPT_KEY));
        if ($systemPrompt === '') {
            return response()->json([
                'message' => 'Quill system prompt is empty. Set “'.self::PROMPT_KEY.'” under Organization → AI prompts.',
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
                    $messages[] = new AssistantMessage($content);
                } else {
                    $messages[] = new UserMessage($content);
                }
            }
        }

        $body = trim((string) $validated['message']);
        $context = trim((string) ($validated['context'] ?? ''));
        if ($context !== '') {
            $body = "Additional context (outline, specs, links, rough notes — user-provided):\n---\n{$context}\n---\n\nRequest:\n{$body}";
        }

        $messages[] = new UserMessage($body);

        try {
            $agent = QuillAgent::make()
                ->setInstructions($systemPrompt)
                ->toolMaxRuns(0);

            $reply = $agent
                ->chat($messages)
                ->getMessage();

            $content = trim($reply->getContent() ?? '');
            if ($content === '') {
                return response()->json(['message' => 'Quill returned an empty response. Try again.'], 422);
            }

            return response()->json(['reply' => $content]);
        } catch (\Throwable $e) {
            Log::error('QuillController::chat failed', [
                'error' => $e->getMessage(),
                'exception' => $e::class,
            ]);

            return response()->json([
                'message' => 'Quill failed. Check logs or try again.',
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
