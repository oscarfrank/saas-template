<?php

declare(strict_types=1);

namespace Modules\OrgMcp\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Modules\OrgMcp\Models\OrgMcpClient;

final class OrgMcpAuthService
{
    private const SESSION_TTL_SECONDS = 3600;

    /**
     * @return array{token: string, expires_in: int, session_id: string}
     */
    public function issueSession(string $tenantId, string $clientKey, string $clientSecret, ?int $profileUserId): array
    {
        $client = OrgMcpClient::query()
            ->where('tenant_id', $tenantId)
            ->where('client_key', $clientKey)
            ->where('is_active', true)
            ->first();

        if ($client === null || ! Hash::check($clientSecret, (string) $client->client_secret_hash)) {
            throw new \RuntimeException('Invalid MCP client credentials.');
        }

        $sessionId = (string) Str::uuid();
        $plainToken = Str::random(64);
        $tokenHash = hash('sha256', $plainToken);

        Cache::put(
            $this->cacheKey($tokenHash),
            [
                'session_id' => $sessionId,
                'tenant_id' => $tenantId,
                'client_id' => $client->id,
                'profile_user_id' => $profileUserId,
            ],
            self::SESSION_TTL_SECONDS
        );

        $client->forceFill(['last_used_at' => now()])->save();

        return [
            'token' => $plainToken,
            'expires_in' => self::SESSION_TTL_SECONDS,
            'session_id' => $sessionId,
        ];
    }

    /**
     * @return array{session_id: string, tenant_id: string, client_id: int, profile_user_id: int|null}|null
     */
    public function resolveSessionFromBearer(?string $bearerToken): ?array
    {
        if ($bearerToken === null || $bearerToken === '') {
            return null;
        }

        $tokenHash = hash('sha256', $bearerToken);
        $payload = Cache::get($this->cacheKey($tokenHash));

        if (! is_array($payload)) {
            return null;
        }

        return $payload;
    }

    private function cacheKey(string $tokenHash): string
    {
        return 'org_mcp_session:'.$tokenHash;
    }
}
