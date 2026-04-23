<?php

declare(strict_types=1);

namespace Modules\OrgMcp\Services;

final class OrgMcpToolRegistryService
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function all(): array
    {
        return [
            [
                'key' => 'org.summary',
                'label' => 'Organization summary',
                'description' => 'Returns high-level organization metrics from internal systems.',
                'integration' => null,
            ],
            [
                'key' => 'org.projects.list_open',
                'label' => 'List open projects',
                'description' => 'Returns open and in-progress HR projects.',
                'integration' => null,
            ],
            [
                'key' => 'org.contacts.search',
                'label' => 'Search contacts',
                'description' => 'Searches internal staff records by name or title.',
                'integration' => null,
            ],
            [
                'key' => 'org.assets.list_available',
                'label' => 'List available assets',
                'description' => 'Lists assets in active statuses by default (available, assigned, in use, in maintenance, available for sale). Pass availability=not_sold_gifted to exclude only sold/gifted, or availability=all. Paginate with offset and limit (max 500); response includes has_more and next_offset.',
                'integration' => null,
            ],
            [
                'key' => 'org.assets.search',
                'label' => 'Search assets',
                'description' => 'Search assets by name, tag, serial, description, or location. Same availability modes as list; optional category/status/condition filters. Paginate with offset and limit (max 500); response includes has_more and next_offset.',
                'integration' => null,
            ],
            [
                'key' => 'org.assets.summary',
                'label' => 'Asset summary',
                'description' => 'Counts assets grouped by status. Same availability modes as list/search.',
                'integration' => null,
            ],
            [
                'key' => 'org.gmail.recent_threads',
                'label' => 'Recent Gmail threads',
                'description' => 'Connector stub for recent organization inbox threads.',
                'integration' => 'gmail',
            ],
            [
                'key' => 'org.sheets.query_range',
                'label' => 'Google Sheets range query',
                'description' => 'Reads values from a Google Sheet range.',
                'integration' => 'google_sheets',
            ],
            [
                'key' => 'org.sheets.get_values',
                'label' => 'Google Sheets get values',
                'description' => 'Reads values from a Google Sheet range.',
                'integration' => 'google_sheets',
            ],
            [
                'key' => 'org.sheets.append_rows',
                'label' => 'Google Sheets append rows',
                'description' => 'Appends rows to a Google Sheet range.',
                'integration' => 'google_sheets',
            ],
            [
                'key' => 'org.sheets.update_range',
                'label' => 'Google Sheets update range',
                'description' => 'Updates an exact range in Google Sheets.',
                'integration' => 'google_sheets',
            ],
            [
                'key' => 'org.slack.search_messages',
                'label' => 'Slack message search',
                'description' => 'Connector stub for searching workspace messages.',
                'integration' => 'slack',
            ],
            [
                'key' => 'org.notion.search_pages',
                'label' => 'Notion page search',
                'description' => 'Connector stub for organization knowledge pages.',
                'integration' => 'notion',
            ],
            [
                'key' => 'org.hubspot.search_contacts',
                'label' => 'HubSpot contact search',
                'description' => 'Connector stub for CRM contact lookup.',
                'integration' => 'hubspot',
            ],
            [
                'key' => 'org.linear.list_issues',
                'label' => 'Linear issue list',
                'description' => 'Connector stub for issue and project workflows.',
                'integration' => 'linear',
            ],
        ];
    }

    public function find(string $toolKey): ?array
    {
        foreach ($this->all() as $tool) {
            if ($tool['key'] === $toolKey) {
                return $tool;
            }
        }

        return null;
    }
}
