<?php

declare(strict_types=1);

namespace Modules\OrgMcp\Services;

use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Modules\Cortex\Http\Controllers\MirageController;
use Modules\Cortex\Models\MirageSession;
use Modules\Cortex\Models\MirageSessionTurn;
use Modules\Cortex\Services\MirageSessionPersistenceService;

/**
 * Runs Mirage ideas + image generation inside tenant context with the profile user
 * authenticated, then persists a session turn so the run appears in the Mirage UI.
 */
final class OrgMcpMirageToolService
{
    public function __construct(
        private readonly MirageController $mirageController,
        private readonly MirageSessionPersistenceService $persistence,
    ) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function generate(string $tenantId, int $profileUserId, array $input): array
    {
        if ($profileUserId <= 0) {
            throw new \RuntimeException(
                'Mirage requires profile_user_id. Create your org-mcp session with profile_user_id set to the Laravel user id.'
            );
        }

        $tenant = Tenant::query()->find($tenantId);
        if ($tenant === null) {
            throw new \RuntimeException('Organization not found.');
        }

        tenancy()->initialize($tenant);

        try {
            if (! Auth::guard('web')->loginUsingId($profileUserId)) {
                throw new \RuntimeException('Could not authenticate profile user for Mirage.');
            }

            $inputMode = strtolower(trim((string) ($input['input_mode'] ?? 'prompt')));
            if (! in_array($inputMode, ['script', 'youtube', 'prompt'], true)) {
                $inputMode = 'prompt';
            }

            $focus = $this->resolveFocus($input);
            $ideaCount = min(max((int) ($input['idea_count'] ?? 1), 1), 12);

            $text = $this->resolvePrimaryText($input, $inputMode);
            $youtubeUrl = trim((string) ($input['youtube_url'] ?? ''));
            $context = trim((string) ($input['context'] ?? ''));

            if ($inputMode === 'youtube' && $youtubeUrl === '') {
                throw new \RuntimeException('input_mode "youtube" requires youtube_url.');
            }
            if ($inputMode !== 'youtube' && $text === '') {
                throw new \RuntimeException('Provide text (input, brief, text, or script) for this input_mode.');
            }

            $faceRef = isset($input['face_reference']) ? trim((string) $input['face_reference']) : '';
            $productRef = isset($input['product_reference']) ? trim((string) $input['product_reference']) : '';
            $styleRefs = $this->normalizeStyleReferences($input['style_references'] ?? null);

            $ideasPayload = [
                'input_mode' => $inputMode,
                'input' => $inputMode === 'youtube' ? null : $text,
                'youtube_url' => $youtubeUrl !== '' ? $youtubeUrl : null,
                'context' => $context !== '' ? $context : null,
                'idea_count' => $ideaCount,
                'focus' => $focus,
                'face_reference' => $faceRef !== '' ? $faceRef : null,
                'product_reference' => $productRef !== '' ? $productRef : null,
                'style_references' => $styleRefs !== [] ? $styleRefs : null,
            ];

            $ideasResponse = $this->mirageController->ideas(Request::create('/', 'POST', $ideasPayload));
            $ideasData = $this->jsonResponseOrThrow($ideasResponse, 'Mirage ideas step failed');

            /** @var list<array<string, mixed>> $ideas */
            $ideas = isset($ideasData['ideas']) && is_array($ideasData['ideas']) ? $ideasData['ideas'] : [];
            if ($ideas === []) {
                throw new \RuntimeException('Mirage returned no ideas.');
            }

            $source = isset($ideasData['source']) && is_array($ideasData['source']) ? $ideasData['source'] : null;

            $imageByIdeaId = [];
            $imageItems = [];
            foreach ($ideas as $idea) {
                if (! is_array($idea)) {
                    continue;
                }
                $ideaId = (string) ($idea['id'] ?? '');
                if ($ideaId === '') {
                    continue;
                }
                $prompt = $this->imagePromptForModel($idea);
                $imageItems[] = [
                    'idea_id' => $ideaId,
                    'image_prompt' => $prompt,
                ];
            }

            foreach (array_chunk($imageItems, 4) as $chunk) {
                $imagesPayload = [
                    'items' => $chunk,
                    'face_reference' => $faceRef !== '' ? $faceRef : null,
                    'product_reference' => $productRef !== '' ? $productRef : null,
                    'style_references' => $styleRefs !== [] ? $styleRefs : null,
                ];
                $imagesResponse = $this->mirageController->images(Request::create('/', 'POST', $imagesPayload));
                $imagesData = $this->jsonResponseOrThrow($imagesResponse, 'Mirage images step failed');
                $results = isset($imagesData['results']) && is_array($imagesData['results']) ? $imagesData['results'] : [];
                foreach ($results as $row) {
                    if (! is_array($row)) {
                        continue;
                    }
                    $iid = isset($row['idea_id']) && is_string($row['idea_id']) ? $row['idea_id'] : null;
                    if ($iid === null || $iid === '') {
                        continue;
                    }
                    $imageByIdeaId[$iid] = [
                        'url' => isset($row['url']) && is_string($row['url']) ? $row['url'] : null,
                        'revised_prompt' => isset($row['revised_prompt']) && is_string($row['revised_prompt']) ? $row['revised_prompt'] : null,
                        'error' => isset($row['error']) && is_string($row['error']) ? $row['error'] : null,
                    ];
                }
            }

            $session = $this->resolveOrCreateSession($tenantId, $profileUserId, $input);
            $inputText = $inputMode !== 'youtube' ? ($text !== '' ? $text : null) : null;
            $ytStored = $inputMode === 'youtube' && $youtubeUrl !== '' ? $youtubeUrl : null;

            $turn = $this->persistence->appendTurn(
                $session,
                $inputMode,
                $focus,
                count($ideas),
                $inputText,
                $ytStored,
                $source,
                $ideas,
                $imageByIdeaId,
            );

            return [
                'mirage_session_id' => $session->id,
                'turn_id' => (int) $turn->id,
                'idea_count' => count($ideas),
                'input_mode' => $inputMode,
                'focus' => $focus,
                'outputs' => $this->formatOutputsForMcp($turn),
            ];
        } finally {
            Auth::guard('web')->logout();
            tenancy()->end();
        }
    }

    /**
     * @param  array<string, mixed>  $input
     */
    private function resolveOrCreateSession(string $tenantId, int $profileUserId, array $input): MirageSession
    {
        $sessionId = trim((string) ($input['mirage_session_id'] ?? $input['session_id'] ?? ''));
        if ($sessionId !== '') {
            $session = MirageSession::query()
                ->where('tenant_id', $tenantId)
                ->ownedBy($profileUserId)
                ->where('id', $sessionId)
                ->first();
            if ($session === null) {
                throw new \RuntimeException('mirage_session_id not found or not owned by this user.');
            }

            return $session;
        }

        $title = isset($input['session_title']) ? trim((string) $input['session_title']) : null;
        if ($title === '') {
            $title = null;
        }

        return MirageSession::query()->create([
            'tenant_id' => $tenantId,
            'user_id' => $profileUserId,
            'title' => $title,
            'last_activity_at' => now(),
        ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function formatOutputsForMcp(MirageSessionTurn $turn): array
    {
        $turn->load(['outputs' => fn ($q) => $q->orderBy('id')]);
        $out = [];
        foreach ($turn->outputs as $output) {
            $url = null;
            if ($output->path !== null && $output->path !== '') {
                $url = Storage::disk($output->disk)->url($output->path);
                if ($url !== '' && str_starts_with($url, '/')) {
                    $url = rtrim((string) config('app.url'), '/').$url;
                }
            }
            $out[] = [
                'output_id' => (int) $output->id,
                'idea_id' => $output->idea_id,
                'title' => $output->title,
                'url' => $url,
                'error' => $output->error_message,
                'revised_prompt' => $output->revised_prompt,
            ];
        }

        return $out;
    }

    private function jsonResponseOrThrow(JsonResponse $response, string $label): array
    {
        $data = $response->getData(true);
        if (! is_array($data)) {
            $data = [];
        }
        $status = $response->getStatusCode();
        if ($status >= 400) {
            $msg = is_string($data['message'] ?? null) ? (string) $data['message'] : $label;

            throw new \RuntimeException($msg);
        }

        return $data;
    }

    /**
     * @param  array<string, mixed>  $idea
     */
    private function imagePromptForModel(array $idea): string
    {
        $base = trim((string) ($idea['image_prompt'] ?? ''));
        $overlay = trim((string) ($idea['thumb_text'] ?? ''));
        if ($overlay === '') {
            return $base;
        }

        return $base."\n\n".
            'The large, readable on-thumbnail text overlay (where appropriate for a YouTube thumbnail) must use these exact words, spelled as given: '.
            $overlay;
    }

    /**
     * @param  array<string, mixed>  $input
     */
    private function resolveFocus(array $input): string
    {
        $raw = strtolower(trim((string) ($input['focus'] ?? $input['composition'] ?? 'mixed')));
        if (in_array($raw, ['face', 'product', 'mixed', 'scene'], true)) {
            return $raw;
        }
        if (in_array($raw, ['product_with_text', 'product-text'], true)) {
            return 'product';
        }
        if (in_array($raw, ['face_and_product', 'face_product', 'face+product'], true)) {
            return 'mixed';
        }

        return 'mixed';
    }

    /**
     * @param  array<string, mixed>  $input
     */
    private function resolvePrimaryText(array $input, string $inputMode): string
    {
        foreach (['text', 'input', 'brief', 'script'] as $key) {
            if (! isset($input[$key])) {
                continue;
            }
            $v = trim((string) $input[$key]);
            if ($v !== '') {
                return $v;
            }
        }

        return '';
    }

    /**
     * @param  mixed  $raw
     * @return list<string>
     */
    private function normalizeStyleReferences($raw): array
    {
        if (! is_array($raw)) {
            return [];
        }
        $out = [];
        foreach ($raw as $item) {
            if (! is_string($item)) {
                continue;
            }
            $t = trim($item);
            if ($t !== '') {
                $out[] = $t;
            }
        }

        return $out;
    }
}
