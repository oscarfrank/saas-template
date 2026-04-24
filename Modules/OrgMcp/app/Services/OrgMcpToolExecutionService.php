<?php

declare(strict_types=1);

namespace Modules\OrgMcp\Services;

use Illuminate\Support\Facades\Http;
use Modules\Assets\Models\Asset;
use Modules\Assets\Models\AssetCategory;
use Modules\HR\Models\Project;
use Modules\HR\Models\Staff;
use Modules\HR\Models\Task;
use Modules\OrgMcp\Models\OrgMcpAuditLog;
use Modules\OrgMcp\Models\OrgMcpClient;
use Modules\OrgMcp\Models\OrgMcpIntegration;

final class OrgMcpToolExecutionService
{
    public function __construct(
        private readonly OrgMcpPolicyService $policyService,
        private readonly OrgMcpMirageToolService $mirageToolService,
        private readonly OrgMcpPulseToolService $pulseToolService,
    ) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function execute(
        OrgMcpClient $client,
        string $tenantId,
        ?int $profileUserId,
        string $toolKey,
        array $input
    ): array {
        $startedAt = microtime(true);
        $status = 'ok';
        $errorMessage = null;
        $result = [];

        try {
            $this->policyService->assertToolAllowed($client, $toolKey);
            $this->policyService->assertProfileInTenant($tenantId, $profileUserId);

            $result = match ($toolKey) {
                'org.summary' => $this->organizationSummary($tenantId),
                'org.projects.list_open' => $this->listOpenProjects($tenantId, $input),
                'org.contacts.search' => $this->searchContacts($tenantId, $input),
                'org.assets.list_available' => $this->listAvailableAssets($tenantId, $input),
                'org.assets.search' => $this->searchAssets($tenantId, $input),
                'org.assets.summary' => $this->assetsSummary($tenantId, $input),
                'org.mirage.generate' => $this->invokeMirageGenerate($tenantId, $profileUserId, $input),
                'org.pulse.digest.get' => $this->invokePulseDigestGet($tenantId, $profileUserId, $input),
                'org.sheets.query_range',
                'org.sheets.get_values' => $this->sheetsGetValues($tenantId, $input),
                'org.sheets.append_rows' => $this->sheetsAppendRows($tenantId, $input),
                'org.sheets.update_range' => $this->sheetsUpdateRange($tenantId, $input),
                'org.gmail.recent_threads',
                'org.slack.search_messages',
                'org.notion.search_pages',
                'org.hubspot.search_contacts',
                'org.linear.list_issues' => $this->integrationStub($tenantId, $toolKey),
                default => throw new \RuntimeException('Unknown tool key.'),
            };
        } catch (\Throwable $e) {
            $status = 'error';
            $errorMessage = $e->getMessage();
            $result = [
                'error' => [
                    'code' => 'tool_execution_failed',
                    'message' => $e->getMessage(),
                ],
            ];
        }

        $durationMs = (int) round((microtime(true) - $startedAt) * 1000);
        $requestJson = json_encode($input);
        $requestHash = $requestJson === false ? null : hash('sha256', $requestJson);

        OrgMcpAuditLog::query()->create([
            'tenant_id' => $tenantId,
            'client_id' => $client->id,
            'profile_user_id' => $profileUserId,
            'tool' => $toolKey,
            'request_hash' => $requestHash,
            'request_meta' => ['input_keys' => array_keys($input)],
            'response_meta' => ['result_keys' => array_keys($result)],
            'status' => $status,
            'error_message' => $errorMessage,
            'duration_ms' => $durationMs,
        ]);

        return [
            'status' => $status,
            'duration_ms' => $durationMs,
            'result' => $result,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function organizationSummary(string $tenantId): array
    {
        $activeStaffCount = Staff::query()
            ->where('tenant_id', $tenantId)
            ->whereNull('ended_at')
            ->count();

        $openProjectsCount = Project::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['active', 'on_hold'])
            ->count();

        $openTasksCount = Task::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['todo', 'in_progress'])
            ->count();

        return [
            'tenant_id' => $tenantId,
            'staff' => [
                'active_count' => $activeStaffCount,
            ],
            'projects' => [
                'open_count' => $openProjectsCount,
            ],
            'tasks' => [
                'open_count' => $openTasksCount,
            ],
            'generated_at' => now()->toIso8601String(),
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function listOpenProjects(string $tenantId, array $input): array
    {
        $limit = min(max((int) ($input['limit'] ?? 20), 1), 100);

        $items = Project::query()
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['active', 'on_hold'])
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get(['id', 'name', 'status', 'start_date', 'end_date', 'updated_at'])
            ->map(fn (Project $project) => [
                'id' => $project->id,
                'name' => $project->name,
                'status' => $project->status,
                'start_date' => $project->start_date?->toDateString(),
                'end_date' => $project->end_date?->toDateString(),
                'updated_at' => $project->updated_at?->toIso8601String(),
            ])
            ->values()
            ->all();

        return [
            'tenant_id' => $tenantId,
            'count' => count($items),
            'items' => $items,
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function searchContacts(string $tenantId, array $input): array
    {
        $q = trim((string) ($input['query'] ?? ''));
        $limit = min(max((int) ($input['limit'] ?? 20), 1), 100);

        $query = Staff::query()
            ->where('tenant_id', $tenantId)
            ->with(['user:id,first_name,last_name,email'])
            ->orderBy('job_title')
            ->limit($limit);

        if ($q !== '') {
            $query->where(function ($builder) use ($q): void {
                $builder
                    ->where('job_title', 'like', '%'.$q.'%')
                    ->orWhereHas('user', function ($userQuery) use ($q): void {
                        $userQuery
                            ->where('first_name', 'like', '%'.$q.'%')
                            ->orWhere('last_name', 'like', '%'.$q.'%')
                            ->orWhere('email', 'like', '%'.$q.'%');
                    });
            });
        }

        $items = $query->get()->map(fn (Staff $staff) => [
            'staff_id' => $staff->id,
            'name' => $staff->user !== null
                ? trim((string) $staff->user->first_name.' '.(string) $staff->user->last_name)
                : null,
            'email' => $staff->user?->email,
            'job_title' => $staff->job_title,
            'kind' => $staff->kind,
        ])->values()->all();

        return [
            'tenant_id' => $tenantId,
            'query' => $q,
            'count' => count($items),
            'items' => $items,
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function listAvailableAssets(string $tenantId, array $input): array
    {
        $limit = min(max((int) ($input['limit'] ?? 50), 1), 500);
        $offset = max((int) ($input['offset'] ?? 0), 0);
        $availability = strtolower(trim((string) ($input['availability'] ?? 'active')));

        $query = Asset::query()
            ->where('tenant_id', $tenantId)
            ->with(['category:id,name,slug']);

        $this->applyAssetAvailabilityScope($query, $availability);
        $this->applyAssetCommonFilters($query, $tenantId, $input);
        $this->applyAssetSort($query, (string) ($input['sort'] ?? 'updated_at'), (string) ($input['direction'] ?? 'desc'));

        $page = $this->paginatedAssetRows($query, $offset, $limit);

        return [
            'tenant_id' => $tenantId,
            'availability' => $availability,
            'count' => $page['returned'],
            'items' => $page['items'],
            'offset' => $page['offset'],
            'limit' => $page['limit'],
            'has_more' => $page['has_more'],
            'next_offset' => $page['next_offset'],
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function searchAssets(string $tenantId, array $input): array
    {
        $q = trim((string) ($input['query'] ?? ''));
        if ($q === '') {
            throw new \RuntimeException('Missing required input: query.');
        }

        $limit = min(max((int) ($input['limit'] ?? 50), 1), 500);
        $offset = max((int) ($input['offset'] ?? 0), 0);
        $availability = strtolower(trim((string) ($input['availability'] ?? 'active')));

        $query = Asset::query()
            ->where('tenant_id', $tenantId)
            ->with(['category:id,name,slug']);

        $this->applyAssetAvailabilityScope($query, $availability);
        $this->applyAssetCommonFilters($query, $tenantId, $input);

        $like = '%'.$q.'%';
        $query->where(function ($builder) use ($like): void {
            $builder
                ->where('name', 'like', $like)
                ->orWhere('asset_tag', 'like', $like)
                ->orWhere('serial_number', 'like', $like)
                ->orWhere('description', 'like', $like)
                ->orWhere('location', 'like', $like);
        });

        $this->applyAssetSort($query, (string) ($input['sort'] ?? 'updated_at'), (string) ($input['direction'] ?? 'desc'));

        $page = $this->paginatedAssetRows($query, $offset, $limit);

        return [
            'tenant_id' => $tenantId,
            'query' => $q,
            'availability' => $availability,
            'count' => $page['returned'],
            'items' => $page['items'],
            'offset' => $page['offset'],
            'limit' => $page['limit'],
            'has_more' => $page['has_more'],
            'next_offset' => $page['next_offset'],
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function assetsSummary(string $tenantId, array $input): array
    {
        $availability = strtolower(trim((string) ($input['availability'] ?? 'active')));

        $query = Asset::query()->where('tenant_id', $tenantId);
        $this->applyAssetAvailabilityScope($query, $availability);
        $this->applyAssetCommonFilters($query, $tenantId, $input);

        $byStatus = $query
            ->clone()
            ->selectRaw('status, COUNT(*) as c')
            ->groupBy('status')
            ->pluck('c', 'status')
            ->all();

        $total = array_sum(array_map('intval', $byStatus));

        return [
            'tenant_id' => $tenantId,
            'availability' => $availability,
            'total' => $total,
            'by_status' => $byStatus,
        ];
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\Modules\Assets\Models\Asset>  $query
     * @param  array<string, mixed>  $input
     */
    private function applyAssetCommonFilters($query, string $tenantId, array $input): void
    {
        if (isset($input['asset_category_id'])) {
            $categoryId = (int) $input['asset_category_id'];
            if ($categoryId > 0) {
                $exists = AssetCategory::query()
                    ->where('tenant_id', $tenantId)
                    ->whereKey($categoryId)
                    ->exists();
                if ($exists) {
                    $query->where('asset_category_id', $categoryId);
                }
            }
        }

        $slug = trim((string) ($input['category_slug'] ?? ''));
        if ($slug !== '') {
            $categoryId = AssetCategory::query()
                ->where('tenant_id', $tenantId)
                ->where('slug', $slug)
                ->value('id');
            if ($categoryId !== null) {
                $query->where('asset_category_id', (int) $categoryId);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        $statuses = $input['statuses'] ?? $input['status_in'] ?? null;
        if (is_array($statuses) && $statuses !== []) {
            $allowed = array_keys(Asset::statusOptions());
            $normalized = [];
            foreach ($statuses as $s) {
                $s = is_string($s) ? trim($s) : '';
                if ($s === '' || ! in_array($s, $allowed, true)) {
                    throw new \RuntimeException(sprintf('Invalid status filter: %s', is_string($s) ? $s : json_encode($s)));
                }
                $normalized[] = $s;
            }
            $query->whereIn('status', $normalized);
        }

        $condition = trim((string) ($input['condition'] ?? ''));
        if ($condition !== '') {
            $allowed = array_keys(Asset::conditionOptions());
            if (! in_array($condition, $allowed, true)) {
                throw new \RuntimeException(sprintf('Invalid condition filter: %s', $condition));
            }
            $query->where('condition', $condition);
        }

        $location = trim((string) ($input['location'] ?? ''));
        if ($location !== '') {
            $query->where('location', 'like', '%'.$location.'%');
        }
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\Modules\Assets\Models\Asset>  $query
     */
    private function applyAssetAvailabilityScope($query, string $availability): void
    {
        if ($availability === '' || $availability === 'active') {
            $query->whereIn('status', Asset::activeStatuses());

            return;
        }

        if ($availability === 'not_sold_gifted') {
            $query->whereNotIn('status', [Asset::STATUS_SOLD, Asset::STATUS_GIFTED]);

            return;
        }

        if ($availability === 'all') {
            return;
        }

        throw new \RuntimeException('Invalid availability. Use active, not_sold_gifted, or all.');
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\Modules\Assets\Models\Asset>  $query
     */
    private function applyAssetSort($query, string $sort, string $direction): void
    {
        $allowedSort = ['updated_at', 'created_at', 'name', 'asset_tag', 'status', 'purchase_date'];
        if (! in_array($sort, $allowedSort, true)) {
            throw new \RuntimeException('Invalid sort column.');
        }

        $dir = strtolower($direction) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sort, $dir)->orderBy('id', $dir);
    }

    /**
     * Offset/limit page; fetches one extra row to set has_more without a COUNT query.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<\Modules\Assets\Models\Asset>  $query
     * @return array{items: list<array<string, mixed>>, returned: int, offset: int, limit: int, has_more: bool, next_offset: int|null}
     */
    private function paginatedAssetRows($query, int $offset, int $limit): array
    {
        $take = $limit + 1;
        $rows = $query->offset($offset)->limit($take)->get();
        $hasMore = $rows->count() > $limit;
        $slice = $rows->take($limit);
        $items = $slice->map(fn (Asset $a) => $this->mapAssetRow($a))->values()->all();
        $returned = count($items);

        return [
            'items' => $items,
            'returned' => $returned,
            'offset' => $offset,
            'limit' => $limit,
            'has_more' => $hasMore,
            'next_offset' => $hasMore ? $offset + $returned : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapAssetRow(Asset $asset): array
    {
        return [
            'uuid' => $asset->uuid,
            'asset_tag' => $asset->asset_tag,
            'name' => $asset->name,
            'serial_number' => $asset->serial_number,
            'status' => $asset->status,
            'condition' => $asset->condition,
            'location' => $asset->location,
            'currency' => $asset->currency,
            'purchase_price' => $asset->purchase_price !== null ? (string) $asset->purchase_price : null,
            'purchase_date' => $asset->purchase_date?->toDateString(),
            'asset_category_id' => $asset->asset_category_id,
            'category' => $asset->category !== null
                ? ['id' => $asset->category->id, 'name' => $asset->category->name, 'slug' => $asset->category->slug]
                : null,
            'updated_at' => $asset->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function integrationStub(string $tenantId, string $toolKey): array
    {
        $provider = $this->providerForToolKey($toolKey);
        $integration = OrgMcpIntegration::query()
            ->where('tenant_id', $tenantId)
            ->where('provider', $provider)
            ->where('status', 'active')
            ->first();

        if ($integration === null) {
            throw new \RuntimeException(sprintf('Integration "%s" is not configured for this organization.', $provider));
        }

        return [
            'provider' => $provider,
            'status' => 'connected',
            'message' => 'Connector is configured; concrete data retrieval implementation is next.',
        ];
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    private function sheetsGetValues(string $tenantId, array $input): array
    {
        $spreadsheetId = $this->requiredString($input, 'spreadsheet_id');
        $range = $this->requiredString($input, 'range');
        $integration = $this->activeSheetsIntegration($tenantId);
        $accessToken = $this->googleServiceAccessToken((array) $integration->credentials, [
            'https://www.googleapis.com/auth/spreadsheets.readonly',
        ]);

        $response = Http::withToken($accessToken)
            ->timeout(20)
            ->get('https://sheets.googleapis.com/v4/spreadsheets/'.rawurlencode($spreadsheetId).'/values/'.rawurlencode($range));

        if (! $response->successful()) {
            throw new \RuntimeException('Google Sheets read request failed: '.$this->googleErrorSummary($response));
        }

        return [
            'spreadsheet_id' => $spreadsheetId,
            'range' => (string) $response->json('range', $range),
            'major_dimension' => (string) $response->json('majorDimension', 'ROWS'),
            'values' => $response->json('values', []),
        ];
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    private function sheetsAppendRows(string $tenantId, array $input): array
    {
        $spreadsheetId = $this->requiredString($input, 'spreadsheet_id');
        $range = $this->requiredString($input, 'range');
        $values = $this->validatedValues($input['values'] ?? null);
        $integration = $this->activeSheetsIntegration($tenantId);
        $accessToken = $this->googleServiceAccessToken((array) $integration->credentials, [
            'https://www.googleapis.com/auth/spreadsheets',
        ]);

        $response = Http::withToken($accessToken)
            ->timeout(20)
            ->withQueryParameters([
                'valueInputOption' => 'USER_ENTERED',
                'insertDataOption' => 'INSERT_ROWS',
            ])
            ->post(
                'https://sheets.googleapis.com/v4/spreadsheets/'.rawurlencode($spreadsheetId).'/values/'.rawurlencode($range).':append',
                [
                    'values' => $values,
                ]
            );

        if (! $response->successful()) {
            throw new \RuntimeException('Google Sheets append request failed: '.$this->googleErrorSummary($response));
        }

        return [
            'spreadsheet_id' => $spreadsheetId,
            'range' => $range,
            'rows_appended' => count($values),
            'updates' => $response->json('updates', []),
        ];
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    private function sheetsUpdateRange(string $tenantId, array $input): array
    {
        $spreadsheetId = $this->requiredString($input, 'spreadsheet_id');
        $range = $this->requiredString($input, 'range');
        $values = $this->validatedValues($input['values'] ?? null);
        $integration = $this->activeSheetsIntegration($tenantId);
        $accessToken = $this->googleServiceAccessToken((array) $integration->credentials, [
            'https://www.googleapis.com/auth/spreadsheets',
        ]);

        $response = Http::withToken($accessToken)
            ->timeout(20)
            ->withQueryParameters([
                'valueInputOption' => 'USER_ENTERED',
            ])
            ->put(
                'https://sheets.googleapis.com/v4/spreadsheets/'.rawurlencode($spreadsheetId).'/values/'.rawurlencode($range),
                [
                    'values' => $values,
                ]
            );

        if (! $response->successful()) {
            throw new \RuntimeException('Google Sheets update request failed: '.$this->googleErrorSummary($response));
        }

        return [
            'spreadsheet_id' => $spreadsheetId,
            'range' => $range,
            'rows_written' => count($values),
            'updated' => $response->json([], []),
        ];
    }

    private function activeSheetsIntegration(string $tenantId): OrgMcpIntegration
    {
        $integration = OrgMcpIntegration::query()
            ->where('tenant_id', $tenantId)
            ->where('provider', 'google_sheets')
            ->where('status', 'active')
            ->first();

        if ($integration === null) {
            throw new \RuntimeException('Google Sheets integration is not configured or not active.');
        }

        if (! is_array($integration->credentials) || $integration->credentials === []) {
            throw new \RuntimeException('Google Sheets credentials are missing.');
        }

        return $integration;
    }

    /**
     * @param mixed $value
     */
    private function requiredString(array $input, string $key): string
    {
        $value = $input[$key] ?? null;
        if (! is_string($value) || trim($value) === '') {
            throw new \RuntimeException(sprintf('Input "%s" is required.', $key));
        }

        return trim($value);
    }

    /**
     * @param mixed $values
     * @return array<int, array<int, scalar|null>>
     */
    private function validatedValues(mixed $values): array
    {
        if (! is_array($values) || $values === []) {
            throw new \RuntimeException('Input "values" must be a non-empty 2D array.');
        }

        $normalized = [];
        foreach ($values as $row) {
            if (! is_array($row)) {
                throw new \RuntimeException('Each row in "values" must be an array.');
            }
            $normRow = [];
            foreach ($row as $cell) {
                if (is_scalar($cell) || $cell === null) {
                    $normRow[] = $cell;
                    continue;
                }
                throw new \RuntimeException('Cell values must be scalar or null.');
            }
            $normalized[] = $normRow;
        }

        return $normalized;
    }

    /**
     * @param  array<string, mixed>  $credentials
     */
    private function googleServiceAccessToken(array $credentials, array $scopes): string
    {
        $clientEmail = trim((string) ($credentials['client_email'] ?? ''));
        $privateKey = (string) ($credentials['private_key'] ?? '');
        $tokenUri = trim((string) ($credentials['token_uri'] ?? 'https://oauth2.googleapis.com/token'));

        if ($clientEmail === '' || trim($privateKey) === '') {
            throw new \RuntimeException('Missing Google service account client_email/private_key.');
        }

        $now = time();
        $header = ['alg' => 'RS256', 'typ' => 'JWT'];
        $payload = [
            'iss' => $clientEmail,
            'scope' => implode(' ', $scopes),
            'aud' => $tokenUri,
            'exp' => $now + 3600,
            'iat' => $now,
        ];

        $jwtHeader = rtrim(strtr(base64_encode((string) json_encode($header)), '+/', '-_'), '=');
        $jwtPayload = rtrim(strtr(base64_encode((string) json_encode($payload)), '+/', '-_'), '=');
        $unsignedToken = $jwtHeader.'.'.$jwtPayload;

        $signature = '';
        $signed = openssl_sign($unsignedToken, $signature, $privateKey, OPENSSL_ALGO_SHA256);
        if (! $signed) {
            throw new \RuntimeException('Unable to sign Google service account JWT.');
        }

        $jwtSignature = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
        $assertion = $unsignedToken.'.'.$jwtSignature;

        $response = Http::asForm()
            ->timeout(10)
            ->post($tokenUri, [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $assertion,
            ]);

        if (! $response->successful() || ! is_string($response->json('access_token'))) {
            throw new \RuntimeException('Google token exchange failed.');
        }

        return (string) $response->json('access_token');
    }

    private function googleErrorSummary(\Illuminate\Http\Client\Response $response): string
    {
        $message = (string) ($response->json('error.message') ?? '');
        if ($message !== '') {
            return $message;
        }

        return 'HTTP '.$response->status();
    }

    private function providerForToolKey(string $toolKey): string
    {
        return match (true) {
            str_contains($toolKey, '.gmail.') => 'gmail',
            str_contains($toolKey, '.sheets.') => 'google_sheets',
            str_contains($toolKey, '.slack.') => 'slack',
            str_contains($toolKey, '.notion.') => 'notion',
            str_contains($toolKey, '.hubspot.') => 'hubspot',
            str_contains($toolKey, '.linear.') => 'linear',
            default => throw new \RuntimeException('No integration provider mapping for this tool.'),
        };
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function invokeMirageGenerate(string $tenantId, ?int $profileUserId, array $input): array
    {
        if ($profileUserId === null || $profileUserId <= 0) {
            throw new \RuntimeException(
                'Mirage requires profile_user_id. Create the org-mcp session with profile_user_id set to the user id (same as web Mirage history).'
            );
        }

        return $this->mirageToolService->generate($tenantId, $profileUserId, $input);
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function invokePulseDigestGet(string $tenantId, ?int $profileUserId, array $input): array
    {
        if ($profileUserId === null || $profileUserId <= 0) {
            throw new \RuntimeException(
                'Pulse digest requires profile_user_id. Create the org-mcp session with profile_user_id set to the user id.'
            );
        }

        return $this->pulseToolService->getDigest($tenantId, $profileUserId, $input);
    }
}
