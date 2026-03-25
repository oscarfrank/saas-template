<?php

declare(strict_types=1);

namespace Modules\Cortex\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Cortex\Models\YoutubeDocSetting;
use RuntimeException;

final class YoutubeDocAnalyticsSnapshotService
{
    private const CACHE_TTL_SECONDS = 600;

    /**
     * Build a compact analytics snapshot for the last N days.
     *
     * @return array{
     *   channel: array{id: string|null, title: string|null},
     *   range: array{startDate: string, endDate: string},
     *   totals: array<string, float|int|null>,
     *   daily: array<int, array{day: string, views: float, estimatedMinutesWatched: float, subscribersGained: float|null, subscribersLost: float|null}>,
     *   trafficSources: array<int, array{insightTrafficSourceType: string, insightTrafficSourceDetail: string|null, views: float, estimatedMinutesWatched: float}>,
     *   topVideos: array<int, array{video: string, title: string|null, views: float, likes: float|null, comments: float|null, estimatedMinutesWatched: float|null, averageViewDuration: float|null}>,
     *   meta: array{
     *     analytics_ids: string,
     *     report_errors?: array<string, string|null>,
     *     data_api_channel_stats?: array{view_count: int|null, subscriber_count: int|null, video_count: int|null}|null,
     *     range_note?: string|null
     *   }
     * }
     */
    public function snapshotForLastDays(int $days = 28): array
    {
        $tenantId = tenant('id');
        if (! is_string($tenantId) || $tenantId === '') {
            throw new RuntimeException('Tenant context missing.');
        }

        // YouTube Analytics is often incomplete for the current calendar day; cap end date at yesterday (UTC).
        $yesterdayUtc = Carbon::yesterday('UTC')->toDateString();
        $end = min(Carbon::now('UTC')->toDateString(), $yesterdayUtc);
        $start = Carbon::now('UTC')->subDays(max(1, $days))->toDateString();
        if ($start > $end) {
            $end = $start;
        }

        $setting = YoutubeDocSetting::query()->where('tenant_id', $tenantId)->first();
        $channelKey = $setting !== null && is_string($setting->youtube_channel_id) && $setting->youtube_channel_id !== ''
            ? $setting->youtube_channel_id
            : 'MINE';

        // Include channel id in key so switching channels does not serve stale analytics.
        $cacheKey = 'youtube_doc_snapshot:'.$tenantId.':'.$channelKey.':'.$start.':'.$end;

        $cached = Cache::get($cacheKey);
        if (is_array($cached) && $this->snapshotIsCacheable($cached)) {
            return $cached;
        }

        $snapshot = $this->snapshotFresh(days: $days, startDateYmd: $start, endDateYmd: $end);

        // Do not cache failed Analytics calls — otherwise fixing "API disabled" in GCP still serves stale 403s for 10 minutes.
        if ($this->snapshotIsCacheable($snapshot)) {
            Cache::put($cacheKey, $snapshot, self::CACHE_TTL_SECONDS);
        }

        return $snapshot;
    }

    /**
     * Only cache snapshots where every Analytics report succeeded (no error strings in meta).
     */
    private function snapshotIsCacheable(array $snapshot): bool
    {
        $errs = $snapshot['meta']['report_errors'] ?? null;
        if (! is_array($errs)) {
            return true;
        }

        foreach ($errs as $msg) {
            if (is_string($msg) && $msg !== '') {
                return false;
            }
        }

        return true;
    }

    /**
     * All channels the signed-in Google account can manage (for multi-channel accounts).
     *
     * @return list<array{id: string, title: string}>
     */
    public function listManagedChannels(YoutubeDocSetting $setting): array
    {
        if (! $setting->hasConnectedChannel()) {
            throw new RuntimeException('YouTube Analytics is not connected for this tenant.');
        }

        $accessToken = $this->getValidAccessToken($setting);

        return $this->fetchAllManagedChannels($accessToken);
    }

    /**
     * @param  array{
     *   channel: array{id: string|null, title: string|null},
     *   range: array{startDate: string, endDate: string},
     *   totals: array<string, float|int|null>,
     *   daily: array<int, array{day: string, views: float, estimatedMinutesWatched: float, subscribersGained: float|null, subscribersLost: float|null}>,
     *   trafficSources: array<int, array{insightTrafficSourceType: string, insightTrafficSourceDetail: string|null, views: float, estimatedMinutesWatched: float}>,
     *   topVideos: array<int, array{video: string, title: string|null, views: float, likes: float|null, comments: float|null, estimatedMinutesWatched: float|null, averageViewDuration: float|null}>,
     *   meta?: array{analytics_ids?: string}
     * }  $snapshot
     */
    public function formatSnapshotForPrompt(array $snapshot): string
    {
        $channelId = $snapshot['channel']['id'] ?? null;
        $channelTitle = $snapshot['channel']['title'] ?? null;
        $rangeStart = $snapshot['range']['startDate'];
        $rangeEnd = $snapshot['range']['endDate'];

        $totals = $snapshot['totals'];

        $daily = $snapshot['daily'];
        $dailyCount = count($daily);
        $dailyLines = [];
        foreach ($daily as $row) {
            $dailyLines[] = sprintf(
                '- %s: %s views, %s watch minutes',
                $row['day'],
                $this->fmtNumber((float) ($row['views'] ?? 0)),
                $this->fmtNumber((float) ($row['estimatedMinutesWatched'] ?? 0)),
            );
        }
        $dailyTrendBlock = $dailyLines ? implode("\n", $dailyLines) : '- (no daily rows returned)';

        $trafficLines = [];
        foreach (array_slice($snapshot['trafficSources'], 0, 10) as $row) {
            $detail = $row['insightTrafficSourceDetail'] ?? null;
            $label = $detail ? ($row['insightTrafficSourceType'].' / '.$detail) : $row['insightTrafficSourceType'];
            $trafficLines[] = sprintf(
                '- %s: %s views, %s watch minutes',
                $label,
                $this->fmtNumber((float) ($row['views'] ?? 0)),
                $this->fmtNumber((float) ($row['estimatedMinutesWatched'] ?? 0)),
            );
        }
        $trafficBlock = $trafficLines ? implode("\n", $trafficLines) : '- (no traffic source rows returned)';

        $videoLines = [];
        foreach (array_slice($snapshot['topVideos'], 0, 10) as $v) {
            $title = $v['title'] ?? null;
            $titleLabel = $title ? $title : $v['video'];
            $videoLines[] = sprintf(
                '- %s (%s): %s views%s%s',
                $titleLabel,
                $v['video'],
                $this->fmtNumber((float) ($v['views'] ?? 0)),
                isset($v['likes']) && $v['likes'] !== null ? ' / '.$this->fmtNumber((float) $v['likes']).' likes' : '',
                isset($v['comments']) && $v['comments'] !== null ? ' / '.$this->fmtNumber((float) $v['comments']).' comments' : '',
            );
        }

        $channelTitleSafe = $channelTitle ?? '(unknown title)';
        $channelIdSafe = $channelId ?? 'unknown id';
        $analyticsIds = isset($snapshot['meta']['analytics_ids']) ? (string) $snapshot['meta']['analytics_ids'] : null;
        $analyticsIdsLine = ($analyticsIds !== null && $analyticsIds !== '')
            ? "\nYouTube Analytics `ids` parameter: `{$analyticsIds}`"
            : '';

        $rangeNote = isset($snapshot['meta']['range_note']) && is_string($snapshot['meta']['range_note'])
            ? trim($snapshot['meta']['range_note'])
            : '';
        $rangeNoteBlock = $rangeNote !== '' ? "\n{$rangeNote}" : '';

        $stats = $snapshot['meta']['data_api_channel_stats'] ?? null;
        $statsBlock = '';
        if (is_array($stats)) {
            $vc = $stats['view_count'] ?? null;
            $sc = $stats['subscriber_count'] ?? null;
            $vidc = $stats['video_count'] ?? null;
            $statsBlock = "\n### YouTube Data API (verification — public channel totals, not period analytics)\n";
            $statsBlock .= '- Lifetime channel views (Data API): '.($vc !== null ? $this->fmtNumber((float) $vc) : 'n/a')."\n";
            $statsBlock .= '- Subscribers (Data API): '.($sc !== null ? $this->fmtNumber((float) $sc) : 'n/a')."\n";
            $statsBlock .= '- Videos published (Data API): '.($vidc !== null ? $this->fmtNumber((float) $vidc) : 'n/a')."\n";
            $statsBlock .= "If lifetime views > 0 but period analytics below are all zero, the problem is usually wrong channel selected, date range, or Analytics processing delay — not “no channel”.\n";
        }

        $errLines = [];
        $reportErrs = $snapshot['meta']['report_errors'] ?? null;
        if (is_array($reportErrs)) {
            foreach ($reportErrs as $label => $msg) {
                if (is_string($msg) && $msg !== '') {
                    $errLines[] = '- `'.$label.'`: '.$msg;
                }
            }
        }
        $errorsBlock = $errLines !== []
            ? "\n### YouTube Analytics API errors (non-empty means the report failed; zeros may be misleading)\n".implode("\n", $errLines)."\n"
            : '';

        $viewsTotal = $this->fmtNumber((float) ($totals['views'] ?? 0));
        $watchMinutesTotal = $this->fmtNumber((float) ($totals['estimatedMinutesWatched'] ?? 0));
        $likesTotal = $this->fmtNumber((float) ($totals['likes'] ?? 0));
        $commentsTotal = $this->fmtNumber((float) ($totals['comments'] ?? 0));
        $subsGainedTotal = $totals['subscribersGained'] !== null ? $this->fmtNumber((float) $totals['subscribersGained']) : 'n/a';
        $subsLostTotal = $totals['subscribersLost'] !== null ? $this->fmtNumber((float) $totals['subscribersLost']) : 'n/a';
        $videoBlock = $videoLines ? implode("\n", $videoLines) : '- (no top video rows returned)';

        return <<<MD
### Youtube Doc: Connected channel
{$channelTitleSafe} ({$channelIdSafe}){$analyticsIdsLine}{$rangeNoteBlock}{$statsBlock}{$errorsBlock}

### Analytics window
{$rangeStart} to {$rangeEnd}

### Period totals (channel-level)
- Views: {$viewsTotal}
- Watch time (minutes): {$watchMinutesTotal}
- Likes: {$likesTotal}
- Comments: {$commentsTotal}
- Subscribers gained: {$subsGainedTotal}
- Subscribers lost: {$subsLostTotal}

### Daily trend (last {$dailyCount} days in response)
{$dailyTrendBlock}

### Traffic sources (by views)
{$trafficBlock}

### Top videos (by views)
{$videoBlock}
MD;
    }

    /**
     * @return array{
     *   channel: array{id: string|null, title: string|null},
     *   range: array{startDate: string, endDate: string},
     *   totals: array<string, float|int|null>,
     *   daily: array<int, array{day: string, views: float, estimatedMinutesWatched: float, subscribersGained: float|null, subscribersLost: float|null}>,
     *   trafficSources: array<int, array{insightTrafficSourceType: string, insightTrafficSourceDetail: string|null, views: float, estimatedMinutesWatched: float}>,
     *   topVideos: array<int, array{video: string, title: string|null, views: float, likes: float|null, comments: float|null, estimatedMinutesWatched: float|null, averageViewDuration: float|null}>,
     *   meta: array{
     *     analytics_ids: string,
     *     report_errors?: array<string, string|null>,
     *     data_api_channel_stats?: array{view_count: int|null, subscriber_count: int|null, video_count: int|null}|null,
     *     range_note?: string|null
     *   }
     * }
     */
    private function snapshotFresh(int $days, string $startDateYmd, string $endDateYmd): array
    {
        $setting = YoutubeDocSetting::query()
            ->where('tenant_id', (string) tenant('id'))
            ->first();

        if ($setting === null || ! $setting->hasConnectedChannel()) {
            throw new RuntimeException('YouTube Analytics is not connected for this tenant.');
        }

        $accessToken = $this->getValidAccessToken($setting);

        $idsParam = $this->analyticsIdsForSetting($setting);

        $storedId = trim((string) ($setting->youtube_channel_id ?? ''));
        if ($storedId !== '') {
            $storedTitle = trim((string) ($setting->youtube_channel_title ?? ''));
            $title = $storedTitle !== '' ? $storedTitle : ($this->fetchChannelTitleForId($accessToken, $storedId) ?? '(unknown title)');
            $channel = ['id' => $storedId, 'title' => $title];
        } else {
            $channel = $this->fetchMineChannel($accessToken);
        }

        $reportErrors = [];
        $rangeNote = null;
        if (Carbon::now('UTC')->toDateString() !== $endDateYmd) {
            $rangeNote = 'End date is capped at yesterday (UTC) because same-day YouTube Analytics data is often incomplete.';
        }

        $channelIdForStats = is_string($channel['id']) && $channel['id'] !== '' ? $channel['id'] : null;
        $dataApiStats = $channelIdForStats !== null
            ? $this->fetchChannelStatistics($accessToken, $channelIdForStats)
            : null;

        // 1) Daily: split core metrics from engagement so a bad metric combo cannot zero out views.
        $dailyCore = $this->queryAnalyticsReport(
            accessToken: $accessToken,
            ids: $idsParam,
            startDateYmd: $startDateYmd,
            endDateYmd: $endDateYmd,
            metrics: 'views,estimatedMinutesWatched',
            dimensions: 'day',
            sort: 'day',
            maxResults: 50,
        );
        $reportErrors['daily_core'] = $dailyCore['error'];

        $dailyEngagement = $this->queryAnalyticsReport(
            accessToken: $accessToken,
            ids: $idsParam,
            startDateYmd: $startDateYmd,
            endDateYmd: $endDateYmd,
            metrics: 'likes,comments,subscribersGained,subscribersLost',
            dimensions: 'day',
            sort: 'day',
            maxResults: 50,
        );
        $reportErrors['daily_engagement'] = $dailyEngagement['error'];

        $dailyRows = $this->mergeDailyRows($dailyCore['rows'], $dailyEngagement['rows']);

        // 2) Traffic sources — prefer type+detail; fall back to type-only if the API rejects the query.
        $traffic = $this->queryAnalyticsReport(
            accessToken: $accessToken,
            ids: $idsParam,
            startDateYmd: $startDateYmd,
            endDateYmd: $endDateYmd,
            metrics: 'views,estimatedMinutesWatched',
            dimensions: 'insightTrafficSourceType,insightTrafficSourceDetail',
            sort: '-views',
            maxResults: 10,
        );
        $reportErrors['traffic'] = $traffic['error'];
        $trafficRows = $traffic['rows'];

        if ($traffic['error'] !== null) {
            $trafficSimple = $this->queryAnalyticsReport(
                accessToken: $accessToken,
                ids: $idsParam,
                startDateYmd: $startDateYmd,
                endDateYmd: $endDateYmd,
                metrics: 'views,estimatedMinutesWatched',
                dimensions: 'insightTrafficSourceType',
                sort: '-views',
                maxResults: 10,
            );
            if ($trafficSimple['error'] === null) {
                $trafficRows = array_map(static function (array $row): array {
                    return $row + ['insightTrafficSourceDetail' => null];
                }, $trafficSimple['rows']);
                $reportErrors['traffic'] = $traffic['error'].' — recovered using traffic type only (no detail dimension).';
            } else {
                $reportErrors['traffic'] = $traffic['error'].'; fallback failed: '.$trafficSimple['error'];
            }
        }

        // 3) Top videos by views.
        $topVideosResult = $this->queryAnalyticsReport(
            accessToken: $accessToken,
            ids: $idsParam,
            startDateYmd: $startDateYmd,
            endDateYmd: $endDateYmd,
            metrics: 'views,likes,comments,estimatedMinutesWatched,averageViewDuration',
            dimensions: 'video',
            sort: '-views',
            maxResults: 10,
        );
        $reportErrors['top_videos'] = $topVideosResult['error'];
        $topVideoRows = $topVideosResult['rows'];

        $daily = [];
        $totals = [
            'views' => 0.0,
            'estimatedMinutesWatched' => 0.0,
            'likes' => 0.0,
            'comments' => 0.0,
            'subscribersGained' => null,
            'subscribersLost' => null,
        ];

        foreach ($dailyRows as $row) {
            $day = (string) ($row['day'] ?? '');
            if ($day === '') {
                continue;
            }

            $views = (float) ($row['views'] ?? 0);
            $watchMinutes = (float) ($row['estimatedMinutesWatched'] ?? 0);
            $likes = isset($row['likes']) ? (float) $row['likes'] : null;
            $comments = isset($row['comments']) ? (float) $row['comments'] : null;
            $subsGained = isset($row['subscribersGained']) ? (float) $row['subscribersGained'] : null;
            $subsLost = isset($row['subscribersLost']) ? (float) $row['subscribersLost'] : null;

            $daily[] = [
                'day' => $day,
                'views' => $views,
                'estimatedMinutesWatched' => $watchMinutes,
                'subscribersGained' => $subsGained,
                'subscribersLost' => $subsLost,
            ];

            $totals['views'] += $views;
            $totals['estimatedMinutesWatched'] += $watchMinutes;
            $totals['likes'] += ($likes ?? 0);
            $totals['comments'] += ($comments ?? 0);
            if ($subsGained !== null) {
                $totals['subscribersGained'] = ($totals['subscribersGained'] ?? 0) + $subsGained;
            }
            if ($subsLost !== null) {
                $totals['subscribersLost'] = ($totals['subscribersLost'] ?? 0) + $subsLost;
            }
        }

        // Keep the last up-to-14 rows for prompt compactness.
        usort($daily, fn ($a, $b) => strcmp($a['day'], $b['day']));
        $dailyCompact = array_slice($daily, max(0, count($daily) - 14));

        $trafficSources = [];
        foreach ($trafficRows as $row) {
            $trafficSources[] = [
                'insightTrafficSourceType' => (string) ($row['insightTrafficSourceType'] ?? ''),
                'insightTrafficSourceDetail' => isset($row['insightTrafficSourceDetail']) ? (string) $row['insightTrafficSourceDetail'] : null,
                'views' => (float) ($row['views'] ?? 0),
                'estimatedMinutesWatched' => (float) ($row['estimatedMinutesWatched'] ?? 0),
            ];
        }

        $videoIds = array_map(fn ($r) => (string) ($r['video'] ?? ''), $topVideoRows);
        $videoTitlesById = $videoIds !== [] ? $this->fetchVideoTitles($videoIds, $accessToken) : [];

        $topVideos = [];
        foreach ($topVideoRows as $row) {
            $videoId = (string) ($row['video'] ?? '');
            if ($videoId === '') {
                continue;
            }

            $topVideos[] = [
                'video' => $videoId,
                'title' => $videoTitlesById[$videoId] ?? null,
                'views' => (float) ($row['views'] ?? 0),
                'likes' => isset($row['likes']) ? (float) $row['likes'] : null,
                'comments' => isset($row['comments']) ? (float) $row['comments'] : null,
                'estimatedMinutesWatched' => isset($row['estimatedMinutesWatched']) ? (float) $row['estimatedMinutesWatched'] : null,
                'averageViewDuration' => isset($row['averageViewDuration']) ? (float) $row['averageViewDuration'] : null,
            ];
        }

        $meta = [
            'analytics_ids' => $idsParam,
            'report_errors' => array_filter($reportErrors, static fn (?string $e): bool => $e !== null && $e !== ''),
            'data_api_channel_stats' => $dataApiStats,
            'range_note' => $rangeNote,
        ];

        return [
            'channel' => [
                'id' => $channel['id'],
                'title' => $channel['title'],
            ],
            'range' => [
                'startDate' => $startDateYmd,
                'endDate' => $endDateYmd,
            ],
            'totals' => $totals,
            'daily' => $dailyCompact,
            'trafficSources' => $trafficSources,
            'topVideos' => $topVideos,
            'meta' => $meta,
        ];
    }

    /**
     * Merge daily core rows with engagement-only rows (same `day` dimension).
     *
     * @param  list<array<string, mixed>>  $core
     * @param  list<array<string, mixed>>  $engagement
     * @return list<array<string, mixed>>
     */
    private function mergeDailyRows(array $core, array $engagement): array
    {
        $byDay = [];
        foreach ($core as $row) {
            $day = (string) ($row['day'] ?? '');
            if ($day === '') {
                continue;
            }
            $byDay[$day] = $row;
        }
        foreach ($engagement as $row) {
            $day = (string) ($row['day'] ?? '');
            if ($day === '') {
                continue;
            }
            if (! isset($byDay[$day])) {
                $byDay[$day] = [
                    'day' => $day,
                    'views' => 0.0,
                    'estimatedMinutesWatched' => 0.0,
                ];
            }
            foreach (['likes', 'comments', 'subscribersGained', 'subscribersLost'] as $k) {
                if (array_key_exists($k, $row)) {
                    $byDay[$day][$k] = $row[$k];
                }
            }
        }
        ksort($byDay);

        return array_values($byDay);
    }

    /**
     * Public channel totals from Data API (lifetime) — cross-check when Analytics returns empty rows.
     *
     * @return array{view_count: int|null, subscriber_count: int|null, video_count: int|null}|null
     */
    private function fetchChannelStatistics(string $accessToken, string $channelId): ?array
    {
        try {
            $resp = Http::withToken($accessToken)
                ->timeout(30)
                ->get('https://www.googleapis.com/youtube/v3/channels', [
                    'part' => 'statistics',
                    'id' => $channelId,
                ]);

            if ($resp->failed()) {
                return null;
            }

            $json = $resp->json();
            $item = $json['items'][0] ?? null;
            if (! is_array($item)) {
                return null;
            }

            $stats = $item['statistics'] ?? [];

            return [
                'view_count' => isset($stats['viewCount']) ? (int) $stats['viewCount'] : null,
                'subscriber_count' => isset($stats['subscriberCount']) ? (int) $stats['subscriberCount'] : null,
                'video_count' => isset($stats['videoCount']) ? (int) $stats['videoCount'] : null,
            ];
        } catch (\Throwable $e) {
            Log::warning('YoutubeDocAnalyticsSnapshotService::fetchChannelStatistics failed', [
                'error' => $e->getMessage(),
                'channel_id' => $channelId,
            ]);

            return null;
        }
    }

    /**
     * YouTube Analytics API `ids` filter: prefer explicit UC… id so it matches the Data API channel
     * (multi-channel Google accounts: `channel==MINE` may not match `channels.list` item 0).
     */
    private function analyticsIdsForSetting(YoutubeDocSetting $setting): string
    {
        $id = trim((string) ($setting->youtube_channel_id ?? ''));
        if ($id !== '' && str_starts_with($id, 'UC') && strlen($id) >= 22) {
            return 'channel=='.$id;
        }

        return 'channel==MINE';
    }

    /**
     * @return list<array{id: string, title: string}>
     */
    private function fetchAllManagedChannels(string $accessToken): array
    {
        $out = [];
        $pageToken = null;
        do {
            $params = [
                'part' => 'snippet',
                'mine' => 'true',
                'maxResults' => 50,
            ];
            if ($pageToken !== null) {
                $params['pageToken'] = $pageToken;
            }

            $resp = Http::withToken($accessToken)
                ->timeout(30)
                ->get('https://www.googleapis.com/youtube/v3/channels', $params)
                ->throw()
                ->json();

            $items = $resp['items'] ?? [];
            if (! is_array($items)) {
                break;
            }

            foreach ($items as $item) {
                if (! is_array($item) || ! isset($item['id'])) {
                    continue;
                }

                $out[] = [
                    'id' => (string) $item['id'],
                    'title' => isset($item['snippet']['title']) ? (string) $item['snippet']['title'] : '',
                ];
            }

            $next = $resp['nextPageToken'] ?? null;
            $pageToken = is_string($next) && $next !== '' ? $next : null;
        } while ($pageToken !== null);

        return $out;
    }

    private function fetchChannelTitleForId(string $accessToken, string $channelId): ?string
    {
        try {
            $resp = Http::withToken($accessToken)
                ->timeout(30)
                ->get('https://www.googleapis.com/youtube/v3/channels', [
                    'part' => 'snippet',
                    'id' => $channelId,
                ])
                ->throw()
                ->json();

            $item = $resp['items'][0] ?? null;
            if (! is_array($item)) {
                return null;
            }

            return isset($item['snippet']['title']) ? (string) $item['snippet']['title'] : null;
        } catch (\Throwable $e) {
            Log::warning('YoutubeDocAnalyticsSnapshotService::fetchChannelTitleForId failed', [
                'error' => $e->getMessage(),
                'channel_id' => $channelId,
            ]);

            return null;
        }
    }

    private function getValidAccessToken(YoutubeDocSetting $setting): string
    {
        $accessTokenEncrypted = $setting->google_access_token_encrypted;
        $expiresAt = $setting->google_access_token_expires_at;

        if (is_string($accessTokenEncrypted) && $accessTokenEncrypted !== '' && $expiresAt instanceof Carbon) {
            if ($expiresAt->greaterThan(Carbon::now()->addSeconds(60))) {
                return Crypt::decryptString($accessTokenEncrypted);
            }
        }

        if (! is_string($setting->google_refresh_token_encrypted) || $setting->google_refresh_token_encrypted === '') {
            throw new RuntimeException('Missing Google refresh token.');
        }

        $refreshToken = Crypt::decryptString($setting->google_refresh_token_encrypted);

        $clientId = (string) config('services.google.client_id', '');
        $clientSecret = (string) config('services.google.client_secret', '');
        if ($clientId === '' || $clientSecret === '') {
            throw new RuntimeException('Google OAuth client is not configured.');
        }

        $token = Http::asForm()->timeout(30)->post('https://oauth2.googleapis.com/token', [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'refresh_token' => $refreshToken,
            'grant_type' => 'refresh_token',
        ])->throw()->json();

        $newAccessToken = (string) ($token['access_token'] ?? '');
        $expiresIn = (int) ($token['expires_in'] ?? 3600);
        if ($newAccessToken === '') {
            throw new RuntimeException('Google token refresh did not return an access_token.');
        }

        $setting->google_access_token_encrypted = Crypt::encryptString($newAccessToken);
        $setting->google_access_token_expires_at = Carbon::now()->addSeconds($expiresIn);
        $setting->save();

        return $newAccessToken;
    }

    /**
     * @return array{id: string|null, title: string|null}
     */
    private function fetchMineChannel(string $accessToken): array
    {
        try {
            $resp = Http::withToken($accessToken)
                ->timeout(30)
                ->get('https://www.googleapis.com/youtube/v3/channels', [
                    'part' => 'snippet',
                    'mine' => 'true',
                ])
                ->throw()
                ->json();

            $item = $resp['items'][0] ?? null;
            if (! is_array($item)) {
                return ['id' => null, 'title' => null];
            }

            return [
                'id' => isset($item['id']) ? (string) $item['id'] : null,
                'title' => isset($item['snippet']['title']) ? (string) $item['snippet']['title'] : null,
            ];
        } catch (\Throwable $e) {
            Log::warning('YoutubeDocAnalyticsSnapshotService::fetchMineChannel failed', [
                'error' => $e->getMessage(),
            ]);

            return ['id' => null, 'title' => null];
        }
    }

    /**
     * YouTube Analytics `reports.query` — does not throw; returns API error text when the request fails.
     *
     * @return array{rows: list<array<string, mixed>>, error: string|null}
     */
    private function queryAnalyticsReport(
        string $accessToken,
        string $ids,
        string $startDateYmd,
        string $endDateYmd,
        string $metrics,
        string $dimensions,
        string $sort,
        int $maxResults,
    ): array {
        $response = Http::withToken($accessToken)
            ->timeout(60)
            ->get('https://youtubeanalytics.googleapis.com/v2/reports', [
                'ids' => $ids,
                'startDate' => $startDateYmd,
                'endDate' => $endDateYmd,
                'metrics' => $metrics,
                'dimensions' => $dimensions,
                'sort' => $sort,
                'maxResults' => $maxResults,
            ]);

        if ($response->failed()) {
            $json = $response->json();
            $message = 'HTTP '.$response->status();
            if (is_array($json) && isset($json['error']['message'])) {
                $message .= ': '.(string) $json['error']['message'];
            } else {
                $body = $response->body();
                $message .= $body !== '' ? ': '.$body : '';
            }

            Log::warning('YouTube Analytics API request failed', [
                'ids' => $ids,
                'metrics' => $metrics,
                'dimensions' => $dimensions,
                'message' => $message,
            ]);

            return ['rows' => [], 'error' => $message];
        }

        $resp = $response->json();
        if (! is_array($resp)) {
            return ['rows' => [], 'error' => 'Invalid JSON from YouTube Analytics API.'];
        }

        $rows = $resp['rows'] ?? [];
        $headers = $resp['columnHeaders'] ?? [];

        if (! is_array($rows) || ! is_array($headers) || $headers === []) {
            return ['rows' => [], 'error' => null];
        }

        if ($rows === []) {
            return ['rows' => [], 'error' => null];
        }

        $names = [];
        foreach ($headers as $h) {
            if (is_array($h) && isset($h['name'])) {
                $names[] = (string) $h['name'];
            }
        }

        if ($names === []) {
            return ['rows' => [], 'error' => null];
        }

        $out = [];
        foreach ($rows as $r) {
            if (! is_array($r)) {
                continue;
            }
            $assoc = [];
            foreach ($names as $i => $name) {
                $assoc[$name] = $r[$i] ?? null;
            }
            $out[] = $assoc;
        }

        return ['rows' => $out, 'error' => null];
    }

    /**
     * @param  array<int, string>  $videoIds
     * @return array<string, string> videoId => title
     */
    private function fetchVideoTitles(array $videoIds, string $accessToken): array
    {
        $videoIds = array_values(array_filter($videoIds, fn (string $id) => $id !== ''));
        if ($videoIds === []) {
            return [];
        }

        $resp = Http::withToken($accessToken)
            ->timeout(30)
            ->get('https://www.googleapis.com/youtube/v3/videos', [
                'part' => 'snippet',
                'id' => implode(',', array_slice($videoIds, 0, 50)),
            ])
            ->throw()
            ->json();

        $items = $resp['items'] ?? [];
        if (! is_array($items)) {
            return [];
        }

        $out = [];
        foreach ($items as $item) {
            if (! is_array($item) || ! isset($item['id'])) {
                continue;
            }
            $out[(string) $item['id']] = isset($item['snippet']['title']) ? (string) $item['snippet']['title'] : '';
        }

        return $out;
    }

    private function fmtNumber(float $n): string
    {
        // Keep numbers readable in prompt (avoid scientific notation).
        if (! is_finite($n)) {
            return '0';
        }

        // For big counts, use 0 decimals; otherwise 1-2 decimals.
        $abs = abs($n);
        if ($abs >= 1000) {
            return number_format($n, 0, '.', ',');
        }

        if ($abs >= 10) {
            return number_format($n, 1, '.', ',');
        }

        return number_format($n, 2, '.', ',');
    }
}
