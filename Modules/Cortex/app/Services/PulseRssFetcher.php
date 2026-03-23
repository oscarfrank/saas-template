<?php

declare(strict_types=1);

namespace Modules\Cortex\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use SimpleXMLElement;

/**
 * Fetches and parses RSS 2.0 and Atom feeds into a normalized item list.
 */
final class PulseRssFetcher
{
    private const DEFAULT_MAX_ITEMS = 25;

    private const TIMEOUT_SECONDS = 22;

    /**
     * @return array{items: list<array{title: string, link: string, summary: string}>, error?: string}
     */
    public function fetch(string $url, ?int $maxItems = null): array
    {
        $limit = $maxItems ?? self::DEFAULT_MAX_ITEMS;
        $limit = max(1, min(100, $limit));

        $url = trim($url);
        if ($url === '' || ! filter_var($url, FILTER_VALIDATE_URL)) {
            return ['items' => [], 'error' => 'Invalid URL.'];
        }

        if (! Str::startsWith(strtolower($url), ['http://', 'https://'])) {
            return ['items' => [], 'error' => 'URL must start with http:// or https://'];
        }

        try {
            $response = Http::timeout(self::TIMEOUT_SECONDS)
                ->withHeaders([
                    'User-Agent' => 'CortexPulse/1.0 (+https://laravel.com)',
                    'Accept' => 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
                ])
                ->get($url);
        } catch (\Throwable $e) {
            return ['items' => [], 'error' => 'Request failed: '.$e->getMessage()];
        }

        if (! $response->successful()) {
            return ['items' => [], 'error' => 'HTTP '.$response->status()];
        }

        $body = $response->body();
        if ($body === '') {
            return ['items' => [], 'error' => 'Empty response body.'];
        }

        return $this->parseXml($body, $limit);
    }

    /**
     * @return array{items: list<array{title: string, link: string, summary: string}>, error?: string}
     */
    private function parseXml(string $xml, int $maxItems): array
    {
        $prev = libxml_use_internal_errors(true);
        $root = simplexml_load_string($xml, SimpleXMLElement::class, LIBXML_NONET | LIBXML_NOCDATA);
        libxml_clear_errors();
        libxml_use_internal_errors($prev);

        if ($root === false) {
            return ['items' => [], 'error' => 'Could not parse XML (invalid feed).'];
        }

        $name = $root->getName();

        if ($name === 'feed') {
            return $this->parseAtom($root, $maxItems);
        }

        return $this->parseRss($root, $maxItems);
    }

    /**
     * @return array{items: list<array{title: string, link: string, summary: string}>, error?: string}
     */
    private function parseAtom(SimpleXMLElement $root, int $maxItems): array
    {
        $atomNs = 'http://www.w3.org/2005/Atom';
        $entries = $root->children($atomNs)->entry;
        if (count($entries) === 0) {
            $entries = $root->entry;
        }

        $items = [];
        foreach ($entries as $entry) {
            $title = trim((string) ($entry->children($atomNs)->title ?: $entry->title));
            $link = '';
            $linkNodes = $entry->children($atomNs)->link;
            if (count($linkNodes) === 0) {
                $linkNodes = $entry->link;
            }
            foreach ($linkNodes as $l) {
                $attrs = $l->attributes();
                if ($attrs !== null && isset($attrs['href'])) {
                    $rel = isset($attrs['rel']) ? (string) $attrs['rel'] : 'alternate';
                    if ($rel === 'alternate' || $rel === '') {
                        $link = (string) $attrs['href'];
                        break;
                    }
                }
            }
            $summary = '';
            $sum = $entry->children($atomNs)->summary;
            if (count($sum) > 0) {
                $summary = $this->cleanSummary((string) $sum[0]);
            } elseif (isset($entry->summary)) {
                $summary = $this->cleanSummary((string) $entry->summary);
            } elseif (count($entry->children($atomNs)->content) > 0) {
                $summary = $this->cleanSummary((string) $entry->children($atomNs)->content[0]);
            } elseif (isset($entry->content)) {
                $summary = $this->cleanSummary((string) $entry->content);
            }
            $items[] = [
                'title' => $title !== '' ? $title : '(untitled)',
                'link' => $link,
                'summary' => Str::limit($summary, 400),
            ];
            if (count($items) >= $maxItems) {
                break;
            }
        }

        return ['items' => $items];
    }

    /**
     * @return array{items: list<array{title: string, link: string, summary: string}>, error?: string}
     */
    private function parseRss(SimpleXMLElement $root, int $maxItems): array
    {
        $items = [];
        if (! isset($root->channel->item)) {
            return ['items' => [], 'error' => 'No items found (not a valid RSS channel).'];
        }

        foreach ($root->channel->item as $item) {
            $title = trim((string) $item->title);
            $link = trim((string) $item->link);
            $desc = isset($item->description) ? $this->cleanSummary((string) $item->description) : '';
            if (isset($item->children('content', true)->encoded)) {
                $desc = $this->cleanSummary((string) $item->children('content', true)->encoded);
            }
            $items[] = [
                'title' => $title !== '' ? $title : '(untitled)',
                'link' => $link,
                'summary' => Str::limit($desc, 400),
            ];
            if (count($items) >= $maxItems) {
                break;
            }
        }

        return ['items' => $items];
    }

    private function cleanSummary(string $html): string
    {
        $plain = strip_tags($html);
        $plain = html_entity_decode($plain, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return preg_replace('/\s+/u', ' ', trim($plain)) ?? '';
    }
}
