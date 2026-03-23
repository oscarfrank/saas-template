<?php

declare(strict_types=1);

namespace Modules\Cortex\Services;

use Modules\Cortex\Models\PulseFeed;
use Modules\Cortex\Models\PulseSetting;

final class PulseFeedRefresher
{
    public function __construct(
        private readonly PulseRssFetcher $rssFetcher,
    ) {}

    public function refreshSnapshot(PulseFeed $feed): void
    {
        $max = PulseSetting::maxItemsForTenant((string) $feed->tenant_id);
        $result = $this->rssFetcher->fetch($feed->feed_url, $max);
        $snapshot = [
            'fetched_at' => now()->toIso8601String(),
            'items' => $result['items'],
            'error' => $result['error'] ?? null,
        ];
        $feed->cached_snapshot = $snapshot;
        $feed->last_fetched_at = now();
        $feed->save();
    }

    public function refreshAllForTenant(string $tenantId): void
    {
        $feeds = PulseFeed::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('name')
            ->get();

        foreach ($feeds as $feed) {
            $this->refreshSnapshot($feed);
        }
    }
}
