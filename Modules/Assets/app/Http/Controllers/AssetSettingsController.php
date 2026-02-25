<?php

namespace Modules\Assets\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Assets\Models\Asset;
use Modules\Assets\Models\AssetSettings;

class AssetSettingsController extends Controller
{
    public function index(): Response
    {
        $tenantId = tenant('id');
        $settings = AssetSettings::getForTenant($tenantId);
        $statusOptions = Asset::statusOptions();
        $defaultStatusFilter = $settings->default_status_filter ?? null;
        $totalAssets = Asset::where('tenant_id', $tenantId)->count();

        return Inertia::render('assets/settings/index', [
            'settings' => [
                'asset_tag_prefix' => $settings->asset_tag_prefix ?? 'AST',
                'default_currency' => $settings->default_currency ?? 'USD',
                'default_sold_currency' => $settings->default_sold_currency ?? $settings->default_currency ?? 'USD',
                'default_status_filter' => $defaultStatusFilter === null || $defaultStatusFilter === '' ? 'all' : $defaultStatusFilter,
                'default_asset_status' => $settings->default_asset_status ?? 'available',
                'items_per_page' => $settings->items_per_page ?? 15,
            ],
            'currencyOptions' => Asset::currencyOptions(),
            'statusOptions' => $statusOptions,
            'total_assets' => $totalAssets,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $tenantId = tenant('id');
        $validStatuses = array_keys(Asset::statusOptions());
        $validated = $request->validate([
            'asset_tag_prefix' => 'required|string|max:32',
            'default_currency' => 'required|string|in:USD,GBP,EUR,NGN',
            'default_sold_currency' => 'nullable|string|in:USD,GBP,EUR,NGN',
            'default_status_filter' => ['nullable', 'string', Rule::in(array_merge(['', 'all'], $validStatuses))],
            'default_asset_status' => ['nullable', 'string', Rule::in($validStatuses)],
            'items_per_page' => 'nullable|integer|in:15,25,50',
        ]);
        $settings = AssetSettings::getForTenant($tenantId);
        $defaultStatusFilter = $validated['default_status_filter'] ?? '';
        $settings->update([
            'asset_tag_prefix' => trim($validated['asset_tag_prefix']),
            'default_currency' => $validated['default_currency'],
            'default_sold_currency' => $validated['default_sold_currency'] ?? null,
            'default_status_filter' => ($defaultStatusFilter === '' || $defaultStatusFilter === 'all') ? null : $defaultStatusFilter,
            'default_asset_status' => $validated['default_asset_status'] ?? 'available',
            'items_per_page' => isset($validated['items_per_page']) ? (int) $validated['items_per_page'] : 15,
        ]);
        return redirect()->route('assets.settings.index', ['tenant' => tenant('slug')])
            ->with('success', 'Asset settings saved.');
    }
}
