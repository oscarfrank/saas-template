<?php

declare(strict_types=1);

namespace Modules\OrgMcp\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Modules\OrgMcp\Models\OrgMcpClient;
use Modules\OrgMcp\Models\OrgMcpIntegration;
use Modules\OrgMcp\Services\OrgMcpToolRegistryService;

final class OrgMcpOrganizationSettingsController extends Controller
{
    public function __construct(
        private readonly OrgMcpToolRegistryService $toolRegistry,
    ) {}

    public function index(Request $request): Response
    {
        $tenant = tenant();
        if (! $tenant instanceof Tenant) {
            abort(404);
        }

        $user = $request->user();
        $canManage = $this->userCanManageOrgMcp($user, $tenant);

        $clients = OrgMcpClient::query()
            ->where('tenant_id', (string) $tenant->id)
            ->orderByDesc('id')
            ->get()
            ->map(fn (OrgMcpClient $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'client_key' => $c->client_key,
                'is_active' => (bool) $c->is_active,
                'allowed_tools' => $c->allowed_tools,
                'last_used_at' => $c->last_used_at?->toIso8601String(),
                'created_at' => $c->created_at?->toIso8601String(),
            ])
            ->values()
            ->all();

        $integrations = OrgMcpIntegration::query()
            ->where('tenant_id', (string) $tenant->id)
            ->orderBy('provider')
            ->get()
            ->map(fn (OrgMcpIntegration $i) => [
                'id' => $i->id,
                'provider' => $i->provider,
                'status' => $i->status,
                'scopes' => $i->scopes ?? [],
                'has_credentials' => is_array($i->credentials) && $i->credentials !== [],
                'last_sync_at' => $i->last_sync_at?->toIso8601String(),
                'updated_at' => $i->updated_at?->toIso8601String(),
            ])
            ->values()
            ->all();

        $toolCatalog = $this->toolRegistry->all();

        $sessionBaseUrl = url('/api/v1/org-mcp');

        return Inertia::render('settings/organization/mcp', [
            'can_manage_org_mcp' => $canManage,
            'tenant_id' => (string) $tenant->id,
            'clients' => $clients,
            'integrations' => $integrations,
            'tool_catalog' => $toolCatalog,
            'session_base_url' => $sessionBaseUrl,
        ]);
    }

    public function storeClient(Request $request): RedirectResponse
    {
        $tenant = tenant();
        if (! $tenant instanceof Tenant) {
            abort(404);
        }
        $user = $request->user();
        if (! $this->userCanManageOrgMcp($user, $tenant)) {
            abort(403);
        }

        $toolKeys = array_column($this->toolRegistry->all(), 'key');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'allowed_tools' => ['nullable', 'array'],
            'allowed_tools.*' => ['string', Rule::in($toolKeys)],
        ]);

        $allowed = $validated['allowed_tools'] ?? null;
        if (is_array($allowed) && $allowed === []) {
            $allowed = null;
        }

        $clientKeyBase = Str::slug($validated['name']) ?: 'mcp';
        $clientKey = $clientKeyBase.'-'.Str::lower(Str::random(6));
        while (OrgMcpClient::query()->where('tenant_id', (string) $tenant->id)->where('client_key', $clientKey)->exists()) {
            $clientKey = $clientKeyBase.'-'.Str::lower(Str::random(6));
        }

        $plainSecret = Str::password(48, symbols: false);

        OrgMcpClient::query()->create([
            'tenant_id' => (string) $tenant->id,
            'name' => $validated['name'],
            'client_key' => $clientKey,
            'client_secret_hash' => Hash::make($plainSecret),
            'allowed_tools' => $allowed,
            'is_active' => true,
        ]);

        return back()
            ->with('success', 'MCP client created. Copy the secret now — it is shown only once.')
            ->with('org_mcp_client_secret', $plainSecret)
            ->with('org_mcp_client_key', $clientKey);
    }

    public function updateClient(Request $request, OrgMcpClient $client): RedirectResponse
    {
        $tenantModel = tenant();
        if (! $tenantModel instanceof Tenant) {
            abort(404);
        }
        $user = $request->user();
        if (! $this->userCanManageOrgMcp($user, $tenantModel)) {
            abort(403);
        }

        if ($client->tenant_id !== (string) $tenantModel->id) {
            abort(404);
        }

        $toolKeys = array_column($this->toolRegistry->all(), 'key');

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'allowed_tools' => ['sometimes', 'nullable', 'array'],
            'allowed_tools.*' => ['string', Rule::in($toolKeys)],
        ]);

        if (array_key_exists('allowed_tools', $validated)) {
            $allowed = $validated['allowed_tools'];
            if (is_array($allowed) && $allowed === []) {
                $allowed = null;
            }
            $client->allowed_tools = $allowed;
        }
        if (array_key_exists('name', $validated)) {
            $client->name = $validated['name'];
        }
        if (array_key_exists('is_active', $validated)) {
            $client->is_active = $validated['is_active'];
        }
        $client->save();

        return back()->with('success', 'MCP client updated.');
    }

    public function destroyClient(Request $request, OrgMcpClient $client): RedirectResponse
    {
        $tenantModel = tenant();
        if (! $tenantModel instanceof Tenant) {
            abort(404);
        }
        $user = $request->user();
        if (! $this->userCanManageOrgMcp($user, $tenantModel)) {
            abort(403);
        }

        if ($client->tenant_id !== (string) $tenantModel->id) {
            abort(404);
        }

        $client->delete();

        return back()->with('success', 'MCP client removed.');
    }

    public function storeIntegration(Request $request): RedirectResponse
    {
        $tenant = tenant();
        if (! $tenant instanceof Tenant) {
            abort(404);
        }
        $user = $request->user();
        if (! $this->userCanManageOrgMcp($user, $tenant)) {
            abort(403);
        }

        $validated = $request->validate([
            'provider' => ['required', 'string', Rule::in($this->supportedProviders())],
            'status' => ['required', 'string', Rule::in(['active', 'inactive'])],
            'credentials_json' => ['nullable', 'string', 'max:100000'],
            'scopes' => ['nullable', 'array'],
            'scopes.*' => ['string', 'max:255'],
        ]);

        $credentials = $this->parseCredentialsJson($validated['credentials_json'] ?? null);

        OrgMcpIntegration::query()->updateOrCreate(
            [
                'tenant_id' => (string) $tenant->id,
                'provider' => $validated['provider'],
            ],
            [
                'status' => $validated['status'],
                'scopes' => $validated['scopes'] ?? null,
                'credentials' => $credentials ?? [],
            ]
        );

        return back()->with('success', 'Data source saved.');
    }

    public function updateIntegration(Request $request, OrgMcpIntegration $integration): RedirectResponse
    {
        $tenantModel = tenant();
        if (! $tenantModel instanceof Tenant) {
            abort(404);
        }
        $user = $request->user();
        if (! $this->userCanManageOrgMcp($user, $tenantModel)) {
            abort(403);
        }

        if ($integration->tenant_id !== (string) $tenantModel->id) {
            abort(404);
        }

        $validated = $request->validate([
            'status' => ['sometimes', 'string', Rule::in(['active', 'inactive'])],
            'credentials_json' => ['nullable', 'string', 'max:100000'],
            'clear_credentials' => ['sometimes', 'boolean'],
            'scopes' => ['nullable', 'array'],
            'scopes.*' => ['string', 'max:255'],
        ]);

        if (array_key_exists('status', $validated)) {
            $integration->status = $validated['status'];
        }
        if (array_key_exists('scopes', $validated)) {
            $integration->scopes = $validated['scopes'];
        }
        if (! empty($validated['clear_credentials'])) {
            $integration->credentials = [];
        } elseif (array_key_exists('credentials_json', $validated) && $validated['credentials_json'] !== null && trim($validated['credentials_json']) !== '') {
            $parsed = $this->parseCredentialsJson($validated['credentials_json']);
            if ($parsed !== null) {
                $integration->credentials = $parsed;
            }
        }

        $integration->save();

        return back()->with('success', 'Data source updated.');
    }

    public function destroyIntegration(Request $request, OrgMcpIntegration $integration): RedirectResponse
    {
        $tenantModel = tenant();
        if (! $tenantModel instanceof Tenant) {
            abort(404);
        }
        $user = $request->user();
        if (! $this->userCanManageOrgMcp($user, $tenantModel)) {
            abort(403);
        }

        if ($integration->tenant_id !== (string) $tenantModel->id) {
            abort(404);
        }

        $integration->delete();

        return back()->with('success', 'Data source removed.');
    }

    public function testIntegration(Request $request, string $tenantOrIntegration, ?string $integration = null): RedirectResponse
    {
        $integrationId = $integration ?? $tenantOrIntegration;
        $tenantModel = tenant();
        if (! $tenantModel instanceof Tenant) {
            abort(404);
        }
        $user = $request->user();
        if (! $this->userCanManageOrgMcp($user, $tenantModel)) {
            abort(403);
        }

        $integrationModel = OrgMcpIntegration::query()
            ->whereKey($integrationId)
            ->where('tenant_id', (string) $tenantModel->id)
            ->first();

        if ($integrationModel === null) {
            abort(404);
        }

        try {
            $this->runIntegrationConnectionTest($integrationModel);
        } catch (\Throwable $e) {
            return back()->with('error', 'Connection failed: '.$e->getMessage());
        }

        return back()->with('success', sprintf('Connection to %s is valid.', $integrationModel->provider));
    }

    /**
     * @return array<string, mixed>|null
     */
    private function parseCredentialsJson(?string $raw): ?array
    {
        if ($raw === null || trim($raw) === '') {
            return null;
        }

        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'credentials_json' => ['Credentials must be valid JSON object.'],
            ]);
        }

        return $decoded;
    }

    private function userCanManageOrgMcp(?Authenticatable $user, Tenant $tenant): bool
    {
        if (! $user) {
            return false;
        }

        if (method_exists($user, 'hasRole') && ($user->hasRole('superadmin') || $user->hasRole('super-admin'))) {
            return true;
        }

        $pivot = $user->tenants()->where('tenants.id', $tenant->id)->first()?->pivot;

        return $pivot && in_array($pivot->role, ['owner', 'admin'], true);
    }

    /**
     * @return list<string>
     */
    private function supportedProviders(): array
    {
        return [
            'gmail',
            'google_sheets',
            'slack',
            'notion',
            'hubspot',
            'linear',
        ];
    }

    private function runIntegrationConnectionTest(OrgMcpIntegration $integration): void
    {
        $credentials = is_array($integration->credentials) ? $integration->credentials : [];
        if ($credentials === []) {
            throw new \RuntimeException('No credentials stored for this integration.');
        }

        match ($integration->provider) {
            'google_sheets' => $this->testGoogleSheetsConnection($credentials),
            'gmail' => $this->testGmailConnection($credentials),
            'slack' => $this->testSlackConnection($credentials),
            'notion' => $this->testNotionConnection($credentials),
            'hubspot' => $this->testHubspotConnection($credentials),
            'linear' => $this->testLinearConnection($credentials),
            default => throw new \RuntimeException('No test strategy defined for this provider.'),
        };
    }

    /**
     * @param  array<string, mixed>  $credentials
     */
    private function testGoogleSheetsConnection(array $credentials): void
    {
        $accessToken = $this->googleServiceAccessToken($credentials, [
            'https://www.googleapis.com/auth/spreadsheets.readonly',
        ]);

        $spreadsheetId = isset($credentials['spreadsheet_id']) ? trim((string) $credentials['spreadsheet_id']) : '';
        if ($spreadsheetId === '') {
            return;
        }

        $response = Http::withToken($accessToken)
            ->timeout(10)
            ->get('https://sheets.googleapis.com/v4/spreadsheets/'.rawurlencode($spreadsheetId), [
                'fields' => 'spreadsheetId,properties.title',
            ]);

        if (! $response->successful()) {
            throw new \RuntimeException('Sheets API rejected credentials or sheet access.');
        }
    }

    /**
     * @param  array<string, mixed>  $credentials
     */
    private function testGmailConnection(array $credentials): void
    {
        $accessToken = $this->googleServiceAccessToken($credentials, [
            'https://www.googleapis.com/auth/gmail.readonly',
        ]);

        $userId = isset($credentials['gmail_user_id']) ? trim((string) $credentials['gmail_user_id']) : 'me';
        $response = Http::withToken($accessToken)
            ->timeout(10)
            ->get('https://gmail.googleapis.com/gmail/v1/users/'.rawurlencode($userId).'/profile');

        if (! $response->successful()) {
            throw new \RuntimeException('Gmail API rejected credentials or mailbox access.');
        }
    }

    /**
     * @param  array<string, mixed>  $credentials
     */
    private function testSlackConnection(array $credentials): void
    {
        $token = trim((string) ($credentials['bot_token'] ?? $credentials['access_token'] ?? ''));
        if ($token === '') {
            throw new \RuntimeException('Missing bot_token or access_token.');
        }

        $response = Http::withToken($token)
            ->timeout(10)
            ->asForm()
            ->post('https://slack.com/api/auth.test');

        if (! $response->successful() || ! (bool) $response->json('ok')) {
            throw new \RuntimeException('Slack auth.test failed.');
        }
    }

    /**
     * @param  array<string, mixed>  $credentials
     */
    private function testNotionConnection(array $credentials): void
    {
        $token = trim((string) ($credentials['integration_token'] ?? $credentials['access_token'] ?? ''));
        if ($token === '') {
            throw new \RuntimeException('Missing integration_token or access_token.');
        }

        $response = Http::withToken($token)
            ->withHeaders(['Notion-Version' => '2022-06-28'])
            ->timeout(10)
            ->get('https://api.notion.com/v1/users/me');

        if (! $response->successful()) {
            throw new \RuntimeException('Notion API rejected credentials.');
        }
    }

    /**
     * @param  array<string, mixed>  $credentials
     */
    private function testHubspotConnection(array $credentials): void
    {
        $token = trim((string) ($credentials['private_app_token'] ?? $credentials['access_token'] ?? ''));
        if ($token === '') {
            throw new \RuntimeException('Missing private_app_token or access_token.');
        }

        $response = Http::withToken($token)
            ->timeout(10)
            ->get('https://api.hubapi.com/crm/v3/objects/contacts', ['limit' => 1]);

        if (! $response->successful()) {
            throw new \RuntimeException('HubSpot API rejected credentials.');
        }
    }

    /**
     * @param  array<string, mixed>  $credentials
     */
    private function testLinearConnection(array $credentials): void
    {
        $token = trim((string) ($credentials['api_key'] ?? $credentials['access_token'] ?? ''));
        if ($token === '') {
            throw new \RuntimeException('Missing api_key or access_token.');
        }

        $response = Http::withToken($token)
            ->timeout(10)
            ->post('https://api.linear.app/graphql', [
                'query' => 'query { viewer { id name } }',
            ]);

        if (! $response->successful() || $response->json('errors')) {
            throw new \RuntimeException('Linear API rejected credentials.');
        }
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
}
