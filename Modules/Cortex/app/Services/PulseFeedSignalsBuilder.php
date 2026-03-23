<?php

declare(strict_types=1);

namespace Modules\Cortex\Services;

use Modules\Cortex\Models\PulseFeed;

/**
 * Builds a Markdown block of cached RSS items for LLM context (same rules as Pulse chat signals).
 */
final class PulseFeedSignalsBuilder
{
    private const MAX_SIGNAL_CHARS = 28_000;

    /**
     * @param  list<int>|null  $feedIds  null = all enabled feeds; [] = none
     */
    public function build(string $tenantId, ?array $feedIds): string
    {
        if (is_array($feedIds) && $feedIds === []) {
            return '';
        }

        $q = PulseFeed::query()
            ->where('tenant_id', $tenantId)
            ->where('enabled', true);

        if (is_array($feedIds) && $feedIds !== []) {
            $q->whereIn('id', $feedIds);
        }

        $feeds = $q->orderBy('name')->get();
        if ($feeds->isEmpty()) {
            return '';
        }

        $out = '';
        foreach ($feeds as $feed) {
            $snap = $feed->cached_snapshot ?? [];
            $items = is_array($snap['items'] ?? null) ? $snap['items'] : [];
            $fetched = $snap['fetched_at'] ?? ($feed->last_fetched_at?->toIso8601String() ?? 'never');
            $err = $snap['error'] ?? null;

            $out .= "### {$feed->name}\n";
            $out .= '- URL: '.$feed->feed_url."\n";
            $out .= '- Last fetch: '.$fetched."\n";
            if (is_string($err) && $err !== '') {
                $out .= '- Fetch note: '.$err."\n";
            }
            if ($items === []) {
                $out .= "- (No items cached — refresh feeds in Pulse.)\n\n";

                continue;
            }
            $out .= "\n";
            foreach ($items as $i => $row) {
                if (! is_array($row)) {
                    continue;
                }
                $title = (string) ($row['title'] ?? '');
                $link = (string) ($row['link'] ?? '');
                $summary = (string) ($row['summary'] ?? '');
                $n = $i + 1;
                $line = "{$n}. **{$title}**";
                if ($link !== '') {
                    $line .= " — {$link}";
                }
                if ($summary !== '') {
                    $line .= "\n   ".$summary;
                }
                $out .= $line."\n";
            }
            $out .= "\n";
        }

        $out = trim($out);
        if (strlen($out) > self::MAX_SIGNAL_CHARS) {
            return substr($out, 0, self::MAX_SIGNAL_CHARS)."\n\n…(truncated for model context)";
        }

        return $out;
    }
}
