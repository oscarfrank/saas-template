<?php

declare(strict_types=1);

namespace Modules\OrgMcp\Services;

use Modules\OrgMcp\Models\OrgMcpClient;
use Modules\User\Models\User;

final class OrgMcpPolicyService
{
    public function assertToolAllowed(OrgMcpClient $client, string $toolKey): void
    {
        $allowedTools = $client->allowed_tools ?? [];
        if ($allowedTools === [] || $allowedTools === ['*']) {
            return;
        }

        if (! in_array($toolKey, $allowedTools, true)) {
            throw new \RuntimeException('Tool not allowed for this MCP client.');
        }
    }

    public function assertProfileInTenant(string $tenantId, ?int $profileUserId): void
    {
        if ($profileUserId === null) {
            return;
        }

        $exists = User::query()
            ->whereKey($profileUserId)
            ->whereHas('tenants', fn ($q) => $q->where('tenants.id', $tenantId))
            ->exists();

        if (! $exists) {
            throw new \RuntimeException('Profile does not belong to this organization.');
        }
    }
}
