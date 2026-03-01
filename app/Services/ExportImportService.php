<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Modules\User\Models\User;
use Modules\Settings\Models\SiteSettings;
use Stancl\Tenancy\Facades\Tenancy;

class ExportImportService
{
    public const EXPORT_VERSION = 1;

    /** Section keys for central (global) data. */
    public const CENTRAL_SECTIONS = ['tenants', 'users', 'tenant_user', 'site_settings'];

    /** Section keys for per-tenant data. */
    public const TENANT_SECTIONS = [
        'scripts', 'script_types', 'assets', 'asset_categories',
        'hr_staff', 'hr_tasks', 'hr_projects', 'loan_packages', 'loans',
    ];

    /**
     * All section keys that can be selected for export/import.
     *
     * @return array<int, array{key: string, label: string, group: 'central'|'tenant'}>
     */
    public static function getAvailableSections(): array
    {
        return [
            ['key' => 'tenants', 'label' => 'Tenants', 'group' => 'central'],
            ['key' => 'users', 'label' => 'Users', 'group' => 'central'],
            ['key' => 'tenant_user', 'label' => 'Tenant–user links', 'group' => 'central'],
            ['key' => 'site_settings', 'label' => 'Site settings', 'group' => 'central'],
            ['key' => 'scripts', 'label' => 'Scripts', 'group' => 'tenant'],
            ['key' => 'script_types', 'label' => 'Script types', 'group' => 'tenant'],
            ['key' => 'assets', 'label' => 'Assets', 'group' => 'tenant'],
            ['key' => 'asset_categories', 'label' => 'Asset categories', 'group' => 'tenant'],
            ['key' => 'hr_staff', 'label' => 'HR staff', 'group' => 'tenant'],
            ['key' => 'hr_tasks', 'label' => 'HR tasks', 'group' => 'tenant'],
            ['key' => 'hr_projects', 'label' => 'HR projects', 'group' => 'tenant'],
            ['key' => 'loan_packages', 'label' => 'Loan packages', 'group' => 'tenant'],
            ['key' => 'loans', 'label' => 'Loans', 'group' => 'tenant'],
        ];
    }

    /**
     * Build export array (central + all tenant data). If $include is null or empty, include all sections.
     *
     * @param  array<string>|null  $include  Section keys to include (e.g. ['tenants', 'users'])
     */
    public function exportToArray(?array $include = null): array
    {
        $include = $this->normalizeInclude($include);
        $central = $this->exportCentral($include);
        $tenantData = $this->exportAllTenantData($include);

        return [
            'version' => self::EXPORT_VERSION,
            'exported_at' => now()->toIso8601String(),
            'central' => $central,
            'tenant_data' => $tenantData,
        ];
    }

    /**
     * @param  array<string>|null  $include
     * @return array<string>|null  Null means “include all”
     */
    protected function normalizeInclude(?array $include): ?array
    {
        if ($include === null || $include === []) {
            return null;
        }
        $valid = array_column(self::getAvailableSections(), 'key');
        $filtered = array_values(array_intersect($include, $valid));
        return $filtered ?: null;
    }

    /**
     * @param  array<string>|null  $include
     */
    protected function exportCentral(?array $include): array
    {
        $all = [
            'tenants' => Tenant::all()->map(fn ($t) => $t->only([
                'id', 'name', 'slug', 'created_by', 'data', 'created_at', 'updated_at',
            ]))->toArray(),
            'users' => User::with('preferences')->get()->map(function ($u) {
                $a = $u->makeVisible(['password'])->toArray();
                unset($a['remember_token']);
                return $a;
            })->toArray(),
            'tenant_user' => DB::table('tenant_user')->get()->map(fn ($r) => (array) $r)->toArray(),
            'site_settings' => (SiteSettings::first())?->toArray() ?? [],
        ];
        if ($include === null) {
            return $all;
        }
        $out = [];
        foreach (self::CENTRAL_SECTIONS as $key) {
            if (in_array($key, $include, true) && array_key_exists($key, $all)) {
                $out[$key] = $all[$key];
            }
        }
        return $out;
    }

    /**
     * @param  array<string>|null  $include
     */
    protected function exportAllTenantData(?array $include): array
    {
        $out = [];
        $tenants = Tenant::all();
        foreach ($tenants as $tenant) {
            Tenancy::initialize($tenant);
            $out[$tenant->id] = $this->exportCurrentTenantData($include);
        }
        Tenancy::end();
        return $out;
    }

    /**
     * @param  array<string>|null  $include
     */
    protected function exportCurrentTenantData(?array $include): array
    {
        $data = [];
        if ($include !== null && ! array_intersect(self::TENANT_SECTIONS, $include)) {
            return $data;
        }

        if (($include === null || in_array('scripts', $include, true)) && class_exists(\Modules\Script\Models\Script::class)) {
            $data['scripts'] = \Modules\Script\Models\Script::withTrashed()->get()->toArray();
        }
        if (($include === null || in_array('script_types', $include, true)) && class_exists(\Modules\Script\Models\ScriptType::class)) {
            $data['script_types'] = \Modules\Script\Models\ScriptType::all()->toArray();
        }
        if (($include === null || in_array('assets', $include, true)) && class_exists(\Modules\Assets\Models\Asset::class)) {
            $data['assets'] = \Modules\Assets\Models\Asset::all()->toArray();
        }
        if (($include === null || in_array('asset_categories', $include, true)) && class_exists(\Modules\Assets\Models\AssetCategory::class)) {
            $data['asset_categories'] = \Modules\Assets\Models\AssetCategory::all()->toArray();
        }
        if (($include === null || in_array('hr_staff', $include, true)) && class_exists(\Modules\HR\Models\Staff::class)) {
            $data['hr_staff'] = \Modules\HR\Models\Staff::all()->toArray();
        }
        if (($include === null || in_array('hr_tasks', $include, true)) && class_exists(\Modules\HR\Models\Task::class)) {
            $data['hr_tasks'] = \Modules\HR\Models\Task::all()->toArray();
        }
        if (($include === null || in_array('hr_projects', $include, true)) && class_exists(\Modules\HR\Models\Project::class)) {
            $data['hr_projects'] = \Modules\HR\Models\Project::all()->toArray();
        }
        if (($include === null || in_array('loan_packages', $include, true)) && class_exists(\Modules\Loan\Models\LoanPackage::class)) {
            $data['loan_packages'] = \Modules\Loan\Models\LoanPackage::all()->toArray();
        }
        if (($include === null || in_array('loans', $include, true)) && class_exists(\Modules\Loan\Models\Loan::class)) {
            $data['loans'] = \Modules\Loan\Models\Loan::all()->toArray();
        }
        return $data;
    }

    /**
     * Convert array to XML string (simple implementation).
     */
    public function arrayToXml(array $data, string $root = 'export'): string
    {
        $xml = new \SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><' . $root . '/>');
        $this->arrayToXmlRecursive($data, $xml);
        return $xml->asXML();
    }

    protected function arrayToXmlRecursive(array $data, \SimpleXMLElement $xml): void
    {
        foreach ($data as $key => $value) {
            $key = is_numeric($key) ? 'item' : $key;
            $key = preg_replace('/[^a-z0-9_-]/i', '_', $key);
            if (is_array($value)) {
                $child = $xml->addChild($key);
                $this->arrayToXmlRecursive($value, $child);
            } else {
                $xml->addChild($key, htmlspecialchars((string) $value, ENT_XML1, 'UTF-8'));
            }
        }
    }

    /**
     * Parse XML export back to array (simple).
     */
    public function xmlToArray(string $xml): array
    {
        $sx = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOCDATA);
        if ($sx === false) {
            throw new \InvalidArgumentException('Invalid XML');
        }
        return json_decode(json_encode($sx), true) ?? [];
    }

    /**
     * Import from full export array. If $include is null or empty, import all sections present in $data.
     *
     * @param  array<string>|null  $include  Section keys to import (e.g. ['tenants', 'users'])
     */
    public function importFromArray(array $data, ?array $include = null): void
    {
        if (($data['version'] ?? 0) != self::EXPORT_VERSION) {
            throw new \InvalidArgumentException('Unsupported export version');
        }
        $include = $this->normalizeInclude($include);

        $central = $data['central'] ?? [];
        $tenantData = $data['tenant_data'] ?? [];
        $userIdMap = [];

        if ($include === null || in_array('tenants', $include, true)) {
            foreach ($central['tenants'] ?? [] as $t) {
                Tenant::firstOrCreate(
                    ['id' => $t['id']],
                    [
                        'name' => $t['name'],
                        'slug' => $t['slug'],
                        'created_by' => $t['created_by'] ?? null,
                        'data' => $t['data'] ?? [],
                    ]
                );
            }
        }

        if ($include === null || in_array('users', $include, true)) {
            foreach ($central['users'] ?? [] as $u) {
                $oldId = $u['id'];
                $attrs = collect($u)->except(['id', 'created_at', 'updated_at', 'preferences'])->toArray();
                $existing = User::where('email', $attrs['email'])->first();
                if ($existing) {
                    $userIdMap[$oldId] = $existing->id;
                    continue;
                }
                $user = User::create($attrs);
                $userIdMap[$oldId] = $user->id;
            }
        }

        if ($include === null || in_array('tenant_user', $include, true)) {
            foreach ($central['tenant_user'] ?? [] as $pivot) {
                $newUserId = $userIdMap[$pivot['user_id']] ?? null;
                if (! $newUserId) {
                    continue;
                }
                DB::table('tenant_user')->insertOrIgnore([
                    'tenant_id' => $pivot['tenant_id'],
                    'user_id' => $newUserId,
                    'role' => $pivot['role'] ?? null,
                    'created_at' => $pivot['created_at'] ?? now(),
                    'updated_at' => $pivot['updated_at'] ?? now(),
                ]);
            }
        }

        if ($include === null || in_array('site_settings', $include, true)) {
            if (! empty($central['site_settings']['id'])) {
                SiteSettings::updateOrCreate(
                    ['id' => $central['site_settings']['id']],
                    collect($central['site_settings'])->except('id')->toArray()
                );
            } elseif (! empty($central['site_settings'])) {
                SiteSettings::updateOrCreate([], collect($central['site_settings'])->except('id')->toArray());
            }
        }

        $tenantSections = $include === null ? null : array_intersect(self::TENANT_SECTIONS, $include);
        foreach ($tenantData as $tenantId => $payload) {
            $tenant = Tenant::find($tenantId);
            if (! $tenant) {
                continue;
            }
            Tenancy::initialize($tenant);
            $this->importTenantData($payload, $userIdMap, $tenantSections);
        }

        Tenancy::end();
    }

    /**
     * @param  array<string>|null  $include  Tenant section keys to import; null = all
     */
    protected function importTenantData(array $payload, array $userIdMap, ?array $include = null): void
    {
        $run = fn (string $key) => $include === null || in_array($key, $include, true);

        if ($run('script_types') && ! empty($payload['script_types']) && class_exists(\Modules\Script\Models\ScriptType::class)) {
            foreach ($payload['script_types'] as $row) {
                \Modules\Script\Models\ScriptType::firstOrCreate(
                    ['id' => $row['id'], 'tenant_id' => $row['tenant_id']],
                    collect($row)->except('id')->toArray()
                );
            }
        }
        if ($run('scripts') && ! empty($payload['scripts']) && class_exists(\Modules\Script\Models\Script::class)) {
            foreach ($payload['scripts'] as $row) {
                $attrs = collect($row)->except('id')->toArray();
                if (isset($attrs['created_by']) && isset($userIdMap[$attrs['created_by']])) {
                    $attrs['created_by'] = $userIdMap[$attrs['created_by']];
                }
                if (isset($attrs['updated_by']) && isset($userIdMap[$attrs['updated_by']])) {
                    $attrs['updated_by'] = $userIdMap[$attrs['updated_by']];
                }
                \Modules\Script\Models\Script::withTrashed()->firstOrCreate(
                    ['id' => $row['id'], 'tenant_id' => $row['tenant_id']],
                    $attrs
                );
            }
        }

        if ($run('asset_categories') && ! empty($payload['asset_categories']) && class_exists(\Modules\Assets\Models\AssetCategory::class)) {
            foreach ($payload['asset_categories'] as $row) {
                \Modules\Assets\Models\AssetCategory::firstOrCreate(
                    ['id' => $row['id'], 'tenant_id' => $row['tenant_id']],
                    collect($row)->except('id')->toArray()
                );
            }
        }
        if ($run('assets') && ! empty($payload['assets']) && class_exists(\Modules\Assets\Models\Asset::class)) {
            foreach ($payload['assets'] as $row) {
                $attrs = collect($row)->except('id')->toArray();
                if (!empty($attrs['assigned_to_user_id']) && isset($userIdMap[$attrs['assigned_to_user_id']])) {
                    $attrs['assigned_to_user_id'] = $userIdMap[$attrs['assigned_to_user_id']];
                }
                \Modules\Assets\Models\Asset::firstOrCreate(
                    ['id' => $row['id'], 'tenant_id' => $row['tenant_id']],
                    $attrs
                );
            }
        }

        if ($run('hr_staff') && ! empty($payload['hr_staff']) && class_exists(\Modules\HR\Models\Staff::class)) {
            foreach ($payload['hr_staff'] as $row) {
                $attrs = collect($row)->except('id')->toArray();
                if (!empty($attrs['user_id']) && isset($userIdMap[$attrs['user_id']])) {
                    $attrs['user_id'] = $userIdMap[$attrs['user_id']];
                }
                \Modules\HR\Models\Staff::firstOrCreate(
                    ['id' => $row['id'], 'tenant_id' => $row['tenant_id']],
                    $attrs
                );
            }
        }
        if ($run('hr_projects') && ! empty($payload['hr_projects']) && class_exists(\Modules\HR\Models\Project::class)) {
            foreach ($payload['hr_projects'] as $row) {
                \Modules\HR\Models\Project::firstOrCreate(
                    ['id' => $row['id'], 'tenant_id' => $row['tenant_id']],
                    collect($row)->except('id')->toArray()
                );
            }
        }
        if ($run('hr_tasks') && ! empty($payload['hr_tasks']) && class_exists(\Modules\HR\Models\Task::class)) {
            foreach ($payload['hr_tasks'] as $row) {
                $attrs = collect($row)->except('id')->toArray();
                if (!empty($attrs['assignee_id'])) {
                    $attrs['assignee_id'] = $userIdMap[$attrs['assignee_id']] ?? $attrs['assignee_id'];
                }
                \Modules\HR\Models\Task::firstOrCreate(
                    ['id' => $row['id'], 'tenant_id' => $row['tenant_id']],
                    $attrs
                );
            }
        }

        if ($run('loan_packages') && ! empty($payload['loan_packages']) && class_exists(\Modules\Loan\Models\LoanPackage::class)) {
            foreach ($payload['loan_packages'] as $row) {
                $attrs = collect($row)->except('id')->toArray();
                if (!empty($attrs['created_by']) && isset($userIdMap[$attrs['created_by']])) {
                    $attrs['created_by'] = $userIdMap[$attrs['created_by']];
                }
                \Modules\Loan\Models\LoanPackage::firstOrCreate(
                    ['id' => $row['id'], 'tenant_id' => $row['tenant_id']],
                    $attrs
                );
            }
        }
        if ($run('loans') && ! empty($payload['loans']) && class_exists(\Modules\Loan\Models\Loan::class)) {
            foreach ($payload['loans'] as $row) {
                $attrs = collect($row)->except('id')->toArray();
                if (!empty($attrs['user_id']) && isset($userIdMap[$attrs['user_id']])) {
                    $attrs['user_id'] = $userIdMap[$attrs['user_id']];
                }
                \Modules\Loan\Models\Loan::firstOrCreate(
                    ['id' => $row['id'], 'tenant_id' => $row['tenant_id']],
                    $attrs
                );
            }
        }
    }
}
