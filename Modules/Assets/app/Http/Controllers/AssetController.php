<?php

namespace Modules\Assets\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Assets\Models\Asset;
use Modules\Assets\Models\AssetCategory;
use Modules\Assets\Models\AssetSettings;
use Modules\User\Models\User;

class AssetController extends Controller
{
    public function index(Request $request): Response
    {
        $tenantId = tenant('id');
        $settings = AssetSettings::getForTenant($tenantId);
        $statusFilter = null;
        if ($request->filled('status')) {
            if ($request->input('status') === 'all') {
                $statusFilter = null;
            } else {
                $statusFilter = $request->status;
            }
        } else {
            $statusFilter = $settings->default_status_filter ?? null;
        }
        $perPage = $request->input('per_page');
        if ($perPage === null || ! in_array((int) $perPage, [15, 25, 50], true)) {
            $perPage = $settings->items_per_page ?? 15;
        }
        $perPage = (int) $perPage;

        $query = Asset::query()
            ->with(['category:id,name,slug', 'assignedToUser:id,first_name,last_name,email'])
            ->where('tenant_id', $tenantId);

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('asset_tag', 'like', '%' . $search . '%')
                    ->orWhere('serial_number', 'like', '%' . $search . '%');
            });
        }
        if ($request->filled('category')) {
            $query->where('asset_category_id', $request->category);
        }
        if ($statusFilter) {
            $query->where('status', $statusFilter);
        }

        $sortColumns = ['name', 'asset_tag', 'category', 'status', 'purchase_price', 'assigned_to'];
        $sort = $request->input('sort', 'name');
        $dir = strtoupper(strtolower($request->input('dir', 'asc')) === 'desc' ? 'DESC' : 'ASC');
        if (! in_array($sort, $sortColumns, true)) {
            $sort = 'name';
        }
        if ($sort === 'category') {
            $query->orderByRaw(
                '(SELECT name FROM asset_categories WHERE asset_categories.id = assets.asset_category_id) ' . $dir
            );
        } elseif ($sort === 'assigned_to') {
            $query->orderByRaw(
                'CASE WHEN assets.assigned_to_user_id IS NULL THEN 1 ELSE 0 END, ' .
                '(SELECT COALESCE(users.last_name, users.first_name, users.email) FROM users WHERE users.id = assets.assigned_to_user_id) ' . $dir
            );
        } else {
            $query->orderBy($sort, $dir);
        }

        $assets = $query->paginate($perPage)->withQueryString();

        $categories = AssetCategory::where('tenant_id', $tenantId)->ordered()->get(['id', 'name']);
        $tenantUserIds = DB::table('tenant_user')->where('tenant_id', $tenantId)->pluck('user_id');
        $users = User::whereIn('id', $tenantUserIds)->orderBy('first_name')->orderBy('last_name')->get(['id', 'first_name', 'last_name', 'email']);

        $disposedStatuses = Asset::disposedStatuses();
        $summary = [
            'total_assets' => Asset::where('tenant_id', $tenantId)->whereNotIn('status', $disposedStatuses)->count(),
            'total_categories' => AssetCategory::where('tenant_id', $tenantId)->count(),
            'totals_by_currency' => Asset::query()
                ->where('tenant_id', $tenantId)
                ->whereNotIn('status', $disposedStatuses)
                ->selectRaw('currency, COALESCE(SUM(purchase_price), 0) as total')
                ->groupBy('currency')
                ->pluck('total', 'currency')
                ->toArray(),
            'available_for_sale_count' => Asset::where('tenant_id', $tenantId)->where('status', Asset::STATUS_AVAILABLE_FOR_SALE)->count(),
            'available_for_sale_by_currency' => Asset::query()
                ->where('tenant_id', $tenantId)
                ->where('status', Asset::STATUS_AVAILABLE_FOR_SALE)
                ->selectRaw('currency, COALESCE(SUM(purchase_price), 0) as total')
                ->groupBy('currency')
                ->pluck('total', 'currency')
                ->toArray(),
        ];

        $filters = $request->only(['search', 'category']);
        $filters['status'] = $request->filled('status') ? $request->input('status') : ($statusFilter ?? 'all');
        $filters['sort'] = $sort;
        $filters['dir'] = strtolower($dir);

        return Inertia::render('assets/index', [
            'assets' => $assets,
            'categories' => $categories,
            'users' => $users,
            'filters' => $filters,
            'statusOptions' => Asset::statusOptions(),
            'summary' => $summary,
            'items_per_page' => $perPage,
        ]);
    }

    public function create(): Response
    {
        $tenantId = tenant('id');
        $categories = AssetCategory::where('tenant_id', $tenantId)->ordered()->get(['id', 'name']);
        $tenantUserIds = DB::table('tenant_user')->where('tenant_id', $tenantId)->pluck('user_id');
        $users = User::whereIn('id', $tenantUserIds)->orderBy('first_name')->orderBy('last_name')->get(['id', 'first_name', 'last_name', 'email']);
        $settings = AssetSettings::getForTenant($tenantId);
        return Inertia::render('assets/create', [
            'categories' => $categories,
            'users' => $users,
            'statusOptions' => Asset::statusOptions(),
            'conditionOptions' => Asset::conditionOptions(),
            'currencyOptions' => Asset::currencyOptions(),
            'default_currency' => $settings->default_currency ?? 'USD',
            'default_sold_currency' => $settings->default_sold_currency ?? $settings->default_currency ?? 'USD',
            'default_asset_status' => $settings->default_asset_status ?? 'available',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $tenantId = tenant('id');
        if (! $request->filled('asset_tag')) {
            $request->merge(['asset_tag' => Asset::generateAssetTag($tenantId)]);
        }
        $request->merge([
            'asset_category_id' => $request->input('asset_category_id') ?: null,
            'assigned_to_user_id' => $request->input('assigned_to_user_id') ?: null,
            'depreciation_useful_life_years' => $request->filled('depreciation_useful_life_years') ? $request->input('depreciation_useful_life_years') : null,
            'depreciation_salvage_value' => $request->filled('depreciation_salvage_value') ? $request->input('depreciation_salvage_value') : null,
        ]);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'asset_tag' => [
                'required',
                'string',
                'max:64',
                Rule::unique('assets', 'asset_tag')->where('tenant_id', $tenantId),
            ],
            'asset_category_id' => 'nullable|exists:asset_categories,id',
            'serial_number' => 'nullable|string|max:128',
            'description' => 'nullable|string',
            'status' => 'required|string|in:available,assigned,in_use,in_maintenance,available_for_sale,sold,gifted,lost,damaged,retired,disposed',
            'assigned_to_user_id' => 'nullable|exists:users,id',
            'purchase_date' => 'nullable|date',
            'purchase_price' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|in:USD,GBP,EUR,NGN',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'condition' => 'nullable|string|in:excellent,good,fair,poor',
            'sold_at' => 'nullable|date',
            'sold_price' => 'nullable|numeric|min:0',
            'sold_currency' => 'nullable|string|in:USD,GBP,EUR,NGN',
            'depreciation_useful_life_years' => 'nullable|integer|min:1|max:100',
            'depreciation_salvage_value' => 'nullable|numeric|min:0',
            'depreciation_method' => 'nullable|string|in:straight_line',
            'receipt' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'photo' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
        ]);
        $validated['tenant_id'] = $tenantId;
        $validated['currency'] = $validated['currency'] ?? 'USD';
        $validated['assigned_to_user_id'] = $validated['assigned_to_user_id'] ?? null;
        $validated['asset_category_id'] = $validated['asset_category_id'] ?? null;
        $validated['depreciation_useful_life_years'] = $request->filled('depreciation_useful_life_years') ? $validated['depreciation_useful_life_years'] ?? null : null;
        $validated['depreciation_salvage_value'] = $request->filled('depreciation_salvage_value') ? $validated['depreciation_salvage_value'] ?? null : null;
        $validated['depreciation_method'] = $validated['depreciation_method'] ?? null;
        if (! empty($validated['status']) && in_array($validated['status'], Asset::disposedStatuses(), true)) {
            $validated['disposed_at'] = now();
            $validated['disposed_reason'] = $request->input('disposed_reason');
            if ($validated['status'] === 'sold') {
                $validated['sold_at'] = $request->filled('sold_at') ? $request->input('sold_at') : now()->toDateString();
                $validated['sold_price'] = $request->filled('sold_price') ? $request->input('sold_price') : null;
                $settings = AssetSettings::getForTenant($tenantId);
                $validated['sold_currency'] = $request->filled('sold_currency') ? $request->input('sold_currency') : ($settings->default_sold_currency ?? $validated['currency']);
            }
        }
        if (empty($validated['status']) || $validated['status'] !== 'sold') {
            $validated['sold_currency'] = null;
        }
        $asset = Asset::create($validated);
        if ($request->hasFile('receipt')) {
            $path = $request->file('receipt')->store('assets/receipts/' . $tenantId . '/' . $asset->id, 'local');
            $asset->update(['receipt_path' => $path]);
        }
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('assets/photos/' . $tenantId . '/' . $asset->id, 'local');
            $asset->update(['photo_path' => $path]);
        }
        return redirect()->route('assets.index', ['tenant' => tenant('slug')])
            ->with('success', 'Asset created.');
    }

    public function show(Asset $asset): Response|RedirectResponse
    {
        if ($asset->tenant_id !== tenant('id')) {
            abort(404);
        }
        $asset->load(['category', 'assignedToUser:id,first_name,last_name,email']);
        $receiptUrl = $asset->receipt_path ? route('assets.receipt', ['tenant' => tenant('slug'), 'asset' => $asset->uuid]) : null;
        $receiptIsImage = $receiptUrl && in_array(strtolower(pathinfo($asset->receipt_path, PATHINFO_EXTENSION)), ['jpg', 'jpeg', 'png', 'gif', 'webp'], true);
        $photoUrl = $asset->photo_path ? route('assets.photo', ['tenant' => tenant('slug'), 'asset' => $asset->uuid]) : null;

        $depreciationSettings = $asset->getEffectiveDepreciationSettings();
        $assetData = $asset->toArray();
        if ($depreciationSettings !== null) {
            $assetData['book_value'] = $asset->bookValue();
            $assetData['accumulated_depreciation'] = $asset->accumulatedDepreciation();
            $assetData['effective_depreciation'] = $depreciationSettings;
        } else {
            $assetData['book_value'] = null;
            $assetData['accumulated_depreciation'] = null;
            $assetData['effective_depreciation'] = null;
        }

        return Inertia::render('assets/show', [
            'asset' => $assetData,
            'statusOptions' => Asset::statusOptions(),
            'conditionOptions' => Asset::conditionOptions(),
            'currencyOptions' => Asset::currencyOptions(),
            'receipt_url' => $receiptUrl,
            'receipt_is_image' => $receiptIsImage,
            'photo_url' => $photoUrl,
        ]);
    }

    public function receipt(Asset $asset): StreamedResponse
    {
        if ($asset->tenant_id !== tenant('id') || ! $asset->receipt_path) {
            abort(404);
        }
        if (! Storage::disk('local')->exists($asset->receipt_path)) {
            abort(404);
        }
        return Storage::disk('local')->response($asset->receipt_path);
    }

    public function photo(Asset $asset): StreamedResponse
    {
        if ($asset->tenant_id !== tenant('id') || ! $asset->photo_path) {
            abort(404);
        }
        if (! Storage::disk('local')->exists($asset->photo_path)) {
            abort(404);
        }
        return Storage::disk('local')->response($asset->photo_path);
    }

    public function edit(Asset $asset): Response|RedirectResponse
    {
        if ($asset->tenant_id !== tenant('id')) {
            abort(404);
        }
        $tenantId = tenant('id');
        $asset->load(['category', 'assignedToUser:id,first_name,last_name,email']);
        $categories = AssetCategory::where('tenant_id', $tenantId)->ordered()->get(['id', 'name']);
        $tenantUserIds = DB::table('tenant_user')->where('tenant_id', $tenantId)->pluck('user_id');
        $users = User::whereIn('id', $tenantUserIds)->orderBy('first_name')->orderBy('last_name')->get(['id', 'first_name', 'last_name', 'email']);
        $receiptUrl = $asset->receipt_path ? route('assets.receipt', ['tenant' => tenant('slug'), 'asset' => $asset->uuid]) : null;
        $receiptIsImage = $receiptUrl && in_array(strtolower(pathinfo($asset->receipt_path, PATHINFO_EXTENSION)), ['jpg', 'jpeg', 'png', 'gif', 'webp'], true);
        $photoUrl = $asset->photo_path ? route('assets.photo', ['tenant' => tenant('slug'), 'asset' => $asset->uuid]) : null;

        $settings = AssetSettings::getForTenant($tenantId);
        $depreciationSettings = $asset->getEffectiveDepreciationSettings();
        $assetData = $asset->toArray();
        if ($depreciationSettings !== null) {
            $assetData['book_value'] = $asset->bookValue();
            $assetData['accumulated_depreciation'] = $asset->accumulatedDepreciation();
            $assetData['effective_depreciation'] = $depreciationSettings;
        } else {
            $assetData['book_value'] = null;
            $assetData['accumulated_depreciation'] = null;
            $assetData['effective_depreciation'] = null;
        }
        return Inertia::render('assets/edit', [
            'asset' => $assetData,
            'categories' => $categories,
            'users' => $users,
            'statusOptions' => Asset::statusOptions(),
            'conditionOptions' => Asset::conditionOptions(),
            'currencyOptions' => Asset::currencyOptions(),
            'receipt_url' => $receiptUrl,
            'receipt_is_image' => $receiptIsImage,
            'photo_url' => $photoUrl,
            'default_sold_currency' => $settings->default_sold_currency ?? $settings->default_currency ?? 'USD',
        ]);
    }

    public function update(Request $request, Asset $asset): RedirectResponse
    {
        if ($asset->tenant_id !== tenant('id')) {
            abort(404);
        }
        $request->merge([
            'asset_category_id' => $request->input('asset_category_id') ?: null,
            'assigned_to_user_id' => $request->input('assigned_to_user_id') ?: null,
            'purchase_date' => $request->filled('purchase_date') ? $request->input('purchase_date') : null,
            'purchase_price' => $request->filled('purchase_price') ? $request->input('purchase_price') : null,
            'sold_at' => $request->filled('sold_at') ? $request->input('sold_at') : null,
            'sold_price' => $request->filled('sold_price') ? $request->input('sold_price') : null,
            'condition' => $request->filled('condition') ? $request->input('condition') : null,
            'depreciation_useful_life_years' => $request->filled('depreciation_useful_life_years') ? $request->input('depreciation_useful_life_years') : null,
            'depreciation_salvage_value' => $request->filled('depreciation_salvage_value') ? $request->input('depreciation_salvage_value') : null,
        ]);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'asset_tag' => [
                'required',
                'string',
                'max:64',
                Rule::unique('assets', 'asset_tag')->where('tenant_id', tenant('id'))->ignore($asset->id),
            ],
            'asset_category_id' => 'nullable|exists:asset_categories,id',
            'serial_number' => 'nullable|string|max:128',
            'description' => 'nullable|string',
            'status' => 'required|string|in:available,assigned,in_use,in_maintenance,available_for_sale,sold,gifted,lost,damaged,retired,disposed',
            'assigned_to_user_id' => 'nullable|exists:users,id',
            'purchase_date' => 'nullable|date',
            'purchase_price' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|in:USD,GBP,EUR,NGN',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'condition' => 'nullable|string|in:excellent,good,fair,poor',
            'disposed_reason' => 'nullable|string|max:255',
            'sold_at' => 'nullable|date',
            'sold_price' => 'nullable|numeric|min:0',
            'sold_currency' => 'nullable|string|in:USD,GBP,EUR,NGN',
            'depreciation_useful_life_years' => 'nullable|integer|min:1|max:100',
            'depreciation_salvage_value' => 'nullable|numeric|min:0',
            'depreciation_method' => 'nullable|string|in:straight_line',
            'receipt' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'photo' => 'nullable|file|mimes:jpg,jpeg,png|max:5120',
        ]);
        $validated['assigned_to_user_id'] = $request->filled('assigned_to_user_id') ? $request->input('assigned_to_user_id') : null;
        $validated['depreciation_useful_life_years'] = $request->filled('depreciation_useful_life_years') ? $validated['depreciation_useful_life_years'] ?? null : null;
        $validated['depreciation_salvage_value'] = $request->filled('depreciation_salvage_value') ? $validated['depreciation_salvage_value'] ?? null : null;
        $validated['depreciation_method'] = $validated['depreciation_method'] ?? null;
        if (! empty($validated['status']) && in_array($validated['status'], Asset::disposedStatuses(), true)) {
            $validated['disposed_at'] = $asset->disposed_at ?? now();
            $validated['disposed_reason'] = $request->input('disposed_reason');
            if ($validated['status'] === 'sold') {
                $validated['sold_at'] = $request->filled('sold_at') ? $request->input('sold_at') : ($asset->sold_at ?? now()->toDateString());
                $validated['sold_price'] = $request->filled('sold_price') ? $request->input('sold_price') : null;
                $settings = AssetSettings::getForTenant(tenant('id'));
                $validated['sold_currency'] = $request->filled('sold_currency') ? $request->input('sold_currency') : ($asset->sold_currency ?? $settings->default_sold_currency ?? $asset->currency);
            } else {
                $validated['sold_at'] = null;
                $validated['sold_price'] = null;
                $validated['sold_currency'] = null;
            }
        } else {
            $validated['disposed_at'] = null;
            $validated['disposed_reason'] = null;
            $validated['sold_at'] = null;
            $validated['sold_price'] = null;
            $validated['sold_currency'] = null;
        }
        if ($request->hasFile('receipt')) {
            if ($asset->receipt_path && Storage::disk('local')->exists($asset->receipt_path)) {
                Storage::disk('local')->delete($asset->receipt_path);
            }
            $path = $request->file('receipt')->store('assets/receipts/' . tenant('id') . '/' . $asset->id, 'local');
            $validated['receipt_path'] = $path;
        } elseif ($request->boolean('remove_receipt') && $asset->receipt_path) {
            if (Storage::disk('local')->exists($asset->receipt_path)) {
                Storage::disk('local')->delete($asset->receipt_path);
            }
            $validated['receipt_path'] = null;
        }
        if ($request->hasFile('photo')) {
            if ($asset->photo_path && Storage::disk('local')->exists($asset->photo_path)) {
                Storage::disk('local')->delete($asset->photo_path);
            }
            $path = $request->file('photo')->store('assets/photos/' . tenant('id') . '/' . $asset->id, 'local');
            $validated['photo_path'] = $path;
        } elseif ($request->boolean('remove_photo') && $asset->photo_path) {
            if (Storage::disk('local')->exists($asset->photo_path)) {
                Storage::disk('local')->delete($asset->photo_path);
            }
            $validated['photo_path'] = null;
        }
        unset($validated['receipt'], $validated['photo']);
        $asset->update($validated);
        return redirect()->route('assets.show', ['tenant' => tenant('slug'), 'asset' => $asset->uuid])
            ->with('success', 'Asset updated.');
    }

    public function destroy(Asset $asset): RedirectResponse
    {
        if ($asset->tenant_id !== tenant('id')) {
            abort(404);
        }
        $asset->delete();
        return redirect()->route('assets.index', ['tenant' => tenant('slug')])
            ->with('success', 'Asset deleted.');
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $tenantId = tenant('id');
        $uuids = $request->input('uuids', []);
        if (! is_array($uuids)) {
            $uuids = [];
        }
        $uuids = array_values(array_unique(array_filter(array_map('strval', $uuids))));
        $deleted = Asset::where('tenant_id', $tenantId)->whereIn('uuid', $uuids)->delete();
        $message = $deleted === 1
            ? '1 asset deleted.'
            : $deleted . ' assets deleted.';
        return redirect()->back()
            ->with('success', $message);
    }

    public function clearAll(Request $request): RedirectResponse
    {
        $request->validate(['confirm' => 'required|string|in:DELETE']);
        $tenantId = tenant('id');
        $assets = Asset::where('tenant_id', $tenantId)->get();
        DB::transaction(function () use ($assets, $tenantId) {
            foreach ($assets as $asset) {
                if ($asset->receipt_path && Storage::disk('local')->exists($asset->receipt_path)) {
                    Storage::disk('local')->delete($asset->receipt_path);
                }
                if ($asset->photo_path && Storage::disk('local')->exists($asset->photo_path)) {
                    Storage::disk('local')->delete($asset->photo_path);
                }
                $asset->delete();
            }
        });
        $count = $assets->count();
        return redirect()->route('assets.index', ['tenant' => tenant('slug')])
            ->with('success', $count === 1 ? '1 asset deleted.' : $count . ' assets deleted.');
    }

    public function bulkUpdateCategory(Request $request): RedirectResponse
    {
        $tenantId = tenant('id');
        $uuids = $request->input('uuids', []);
        if (! is_array($uuids)) {
            $uuids = [];
        }
        $uuids = array_values(array_unique(array_filter(array_map('strval', $uuids))));
        $categoryId = $request->input('asset_category_id');
        if ($categoryId !== null && $categoryId !== '') {
            $categoryId = (int) $categoryId;
            $exists = AssetCategory::where('tenant_id', $tenantId)->where('id', $categoryId)->exists();
            if (! $exists) {
                return redirect()->back()->with('error', 'Invalid category.');
            }
        } else {
            $categoryId = null;
        }

        $updated = Asset::where('tenant_id', $tenantId)->whereIn('uuid', $uuids)->update(['asset_category_id' => $categoryId]);
        $message = $updated === 1
            ? '1 asset updated.'
            : $updated . ' assets updated.';
        return redirect()->back()
            ->with('success', $message);
    }

    public function bulkUpdateStatus(Request $request): RedirectResponse
    {
        $tenantId = tenant('id');
        $validStatuses = array_keys(Asset::statusOptions());
        $request->validate([
            'uuids' => 'required|array',
            'uuids.*' => 'string',
            'status' => ['required', 'string', Rule::in($validStatuses)],
        ]);
        $uuids = array_values(array_unique(array_filter(array_map('strval', $request->input('uuids', [])))));
        $status = $request->input('status');
        $updated = Asset::where('tenant_id', $tenantId)->whereIn('uuid', $uuids)->update(['status' => $status]);
        $message = $updated === 1
            ? '1 asset updated.'
            : $updated . ' assets updated.';
        return redirect()->back()
            ->with('success', $message);
    }

    public function bulkUpdateAssignedTo(Request $request): RedirectResponse
    {
        $tenantId = tenant('id');
        $request->validate([
            'uuids' => 'required|array',
            'uuids.*' => 'string',
            'assigned_to_user_id' => 'nullable',
        ]);
        $uuids = array_values(array_unique(array_filter(array_map('strval', $request->input('uuids', [])))));
        $userId = $request->input('assigned_to_user_id');
        if ($userId !== null && $userId !== '') {
            $userId = (int) $userId;
            $tenantUserIds = DB::table('tenant_user')->where('tenant_id', $tenantId)->pluck('user_id');
            if (! in_array($userId, $tenantUserIds->all(), true)) {
                return redirect()->back()->with('error', 'Invalid user.');
            }
        } else {
            $userId = null;
        }
        $updated = Asset::where('tenant_id', $tenantId)->whereIn('uuid', $uuids)->update(['assigned_to_user_id' => $userId]);
        $message = $updated === 1
            ? '1 asset updated.'
            : $updated . ' assets updated.';
        return redirect()->back()
            ->with('success', $message);
    }

    public function import(): Response
    {
        return Inertia::render('assets/import', [
            'statusOptions' => Asset::statusOptions(),
            'currencyOptions' => Asset::currencyOptions(),
            'flash' => [
                'success' => session('success'),
                'warning' => session('warning'),
                'error' => session('error'),
            ],
            'import_errors' => session('import_errors'),
        ]);
    }

    public function importTemplate(): StreamedResponse
    {
        $filename = 'assets-import-template.csv';
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];
        $callback = function () {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Name', 'Asset tag', 'Serial number', 'Category', 'Status', 'Purchase price', 'Currency', 'Purchase date', 'Location', 'Condition']);
            fputcsv($out, ['Office Laptop', 'LAP-0001', 'SN12345', 'IT Equipment', 'available', '999.00', 'USD', '2024-01-15', 'Building A', 'good']);
            fclose($out);
        };
        return response()->stream($callback, 200, $headers);
    }

    public function importProcess(Request $request): RedirectResponse
    {
        $request->validate(['file' => 'required|file|mimes:csv,txt,json|max:2048']);
        $tenantId = tenant('id');
        $settings = AssetSettings::getForTenant($tenantId);
        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        if ($extension === 'json') {
            return $this->importProcessJson($file->getRealPath(), $tenantId, $settings);
        }
        return $this->importProcessCsv($file->getRealPath(), $tenantId, $settings);
    }

    protected function importProcessJson(string $path, $tenantId, AssetSettings $settings): RedirectResponse
    {
        $validStatuses = array_keys(Asset::statusOptions());
        $validCurrencies = array_keys(Asset::currencyOptions());
        $validConditions = array_keys(Asset::conditionOptions());
        $json = json_decode(file_get_contents($path), true);
        if (! is_array($json)) {
            return redirect()->route('assets.import', ['tenant' => tenant('slug')])
                ->with('error', 'Invalid JSON file.');
        }
        $categoriesPayload = $json['categories'] ?? null;
        $assetsPayload = $json['assets'] ?? null;
        if ($assetsPayload === null && isset($json[0]) && is_array($json[0])) {
            $assetsPayload = $json;
            $categoriesPayload = null;
        }
        if (! is_array($assetsPayload)) {
            return redirect()->route('assets.import', ['tenant' => tenant('slug')])
                ->with('error', 'JSON must contain "assets" array or be an array of asset objects.');
        }
        $slugToCategoryId = AssetCategory::where('tenant_id', $tenantId)->get()->keyBy('slug')->map->id->all();
        $nameToCategoryId = AssetCategory::where('tenant_id', $tenantId)->get()->keyBy(fn ($c) => strtolower(trim($c->name)))->map->id->all();
        if (is_array($categoriesPayload) && count($categoriesPayload) > 0) {
            $slugToCategoryId = $this->importCategoriesFromPayload($categoriesPayload, $tenantId, $slugToCategoryId);
            $nameToCategoryId = AssetCategory::where('tenant_id', $tenantId)->get()->keyBy(fn ($c) => strtolower(trim($c->name)))->map->id->all();
        }
        $created = 0;
        $errors = [];
        $index = 0;
        foreach ($assetsPayload as $data) {
            $index++;
            $name = isset($data['name']) ? trim((string) $data['name']) : '';
            $assetTag = isset($data['asset_tag']) ? trim((string) $data['asset_tag']) : '';
            if ($name === '' && $assetTag === '') {
                continue;
            }
            if ($name === '') {
                $errors[] = "Asset #{$index}: Name is required.";
                continue;
            }
            $assetTag = $assetTag !== '' ? $assetTag : Asset::generateAssetTag($tenantId);
            if (Asset::where('tenant_id', $tenantId)->where('asset_tag', $assetTag)->exists()) {
                $errors[] = "Asset #{$index}: Asset tag \"{$assetTag}\" already exists.";
                continue;
            }
            $status = isset($data['status']) ? strtolower(trim((string) $data['status'])) : 'available';
            $status = str_replace(' ', '_', $status);
            if (! in_array($status, $validStatuses, true)) {
                $errors[] = "Asset #{$index}: Invalid status \"{$status}\".";
                continue;
            }
            $currency = isset($data['currency']) ? strtoupper(trim((string) $data['currency'])) : ($settings->default_currency ?? 'USD');
            if (! in_array($currency, $validCurrencies, true)) {
                $currency = $settings->default_currency ?? 'USD';
            }
            $categoryId = null;
            $categorySlug = isset($data['category_slug']) ? trim((string) $data['category_slug']) : null;
            $categoryName = isset($data['category']) ? trim((string) $data['category']) : null;
            if ($categorySlug !== null && $categorySlug !== '') {
                $categoryId = $slugToCategoryId[$categorySlug] ?? $slugToCategoryId[Str::slug($categorySlug)] ?? null;
            }
            if ($categoryId === null && $categoryName !== null && $categoryName !== '') {
                $categoryId = $nameToCategoryId[strtolower($categoryName)] ?? null;
            }
            $purchasePrice = $data['purchase_price'] ?? null;
            $purchasePrice = $purchasePrice !== null && $purchasePrice !== '' ? (is_numeric($purchasePrice) ? (float) $purchasePrice : null) : null;
            $purchaseDate = isset($data['purchase_date']) ? trim((string) $data['purchase_date']) : null;
            $purchaseDate = ($purchaseDate !== null && $purchaseDate !== '' && strtotime($purchaseDate)) ? date('Y-m-d', strtotime($purchaseDate)) : null;
            $condition = isset($data['condition']) ? strtolower(trim((string) $data['condition'])) : null;
            if ($condition !== null && $condition !== '' && ! in_array($condition, $validConditions, true)) {
                $condition = null;
            }
            $payload = [
                'tenant_id' => $tenantId,
                'name' => $name,
                'asset_tag' => $assetTag,
                'serial_number' => isset($data['serial_number']) ? trim((string) $data['serial_number']) : null,
                'asset_category_id' => $categoryId,
                'status' => $status,
                'purchase_price' => $purchasePrice,
                'currency' => $currency,
                'purchase_date' => $purchaseDate,
                'location' => isset($data['location']) ? trim((string) $data['location']) : null,
                'condition' => $condition,
            ];
            if (in_array($status, Asset::disposedStatuses(), true)) {
                $payload['disposed_at'] = now();
            }
            try {
                Asset::create($payload);
                $created++;
            } catch (\Throwable $e) {
                $errors[] = "Asset #{$index}: " . $e->getMessage();
            }
        }
        $message = $created . ' asset(s) imported.';
        if (count($errors) > 0) {
            $message .= ' ' . count($errors) . ' had errors.';
        }
        return redirect()->route('assets.import', ['tenant' => tenant('slug')])
            ->with(count($errors) > 0 ? 'warning' : 'success', $message)
            ->with('import_errors', count($errors) > 0 ? $errors : null);
    }

    /**
     * Create categories from full-export payload. Returns slug => id map (including existing + newly created).
     */
    protected function importCategoriesFromPayload(array $categoriesPayload, $tenantId, array $slugToCategoryId): array
    {
        $categories = $categoriesPayload;
        $maxPasses = count($categories) + 1;
        $pass = 0;
        while ($pass < $maxPasses) {
            $created = 0;
            foreach ($categories as $c) {
                $slug = isset($c['slug']) ? trim((string) $c['slug']) : Str::slug($c['name'] ?? '');
                if ($slug === '' || isset($slugToCategoryId[$slug])) {
                    continue;
                }
                $parentSlug = isset($c['parent_slug']) ? trim((string) $c['parent_slug']) : null;
                $parentId = null;
                if ($parentSlug !== null && $parentSlug !== '') {
                    $parentId = $slugToCategoryId[$parentSlug] ?? null;
                    if ($parentId === null) {
                        continue;
                    }
                }
                $category = AssetCategory::create([
                    'tenant_id' => $tenantId,
                    'name' => $c['name'] ?? $slug,
                    'slug' => $slug,
                    'description' => $c['description'] ?? null,
                    'parent_id' => $parentId,
                    'sort_order' => $c['sort_order'] ?? 0,
                    'depreciation_useful_life_years' => $c['depreciation_useful_life_years'] ?? null,
                    'depreciation_salvage_value' => $c['depreciation_salvage_value'] ?? null,
                    'depreciation_method' => $c['depreciation_method'] ?? null,
                ]);
                $slugToCategoryId[$slug] = $category->id;
                $created++;
            }
            if ($created === 0) {
                break;
            }
            $pass++;
        }
        return $slugToCategoryId;
    }

    protected function importProcessCsv(string $path, $tenantId, AssetSettings $settings): RedirectResponse
    {
        $validStatuses = array_keys(Asset::statusOptions());
        $validCurrencies = array_keys(Asset::currencyOptions());
        $validConditions = array_keys(Asset::conditionOptions());
        $categoriesByName = AssetCategory::where('tenant_id', $tenantId)->get()->keyBy(fn ($c) => strtolower(trim($c->name)));
        $handle = fopen($path, 'r');
        $header = fgetcsv($handle);
        if ($header === false) {
            fclose($handle);
            return redirect()->route('assets.import', ['tenant' => tenant('slug')])
                ->with('error', 'CSV file is empty.');
        }
        $created = 0;
        $errors = [];
        $rowNum = 1;
        while (($row = fgetcsv($handle)) !== false) {
            $rowNum++;
            $data = array_combine($header, array_pad($row, count($header), null));
            if ($data === false) {
                $data = array_combine(['Name', 'Asset tag', 'Serial number', 'Category', 'Status', 'Purchase price', 'Currency', 'Purchase date', 'Location', 'Condition'], array_pad($row, 10, null));
            }
            $name = isset($data['Name']) ? trim((string) $data['Name']) : (isset($data['name']) ? trim((string) $data['name']) : '');
            $assetTag = isset($data['Asset tag']) ? trim((string) $data['Asset tag']) : (isset($data['asset_tag']) ? trim((string) $data['asset_tag']) : '');
            if ($name === '' && $assetTag === '') {
                continue;
            }
            if ($name === '') {
                $errors[] = "Row {$rowNum}: Name is required.";
                continue;
            }
            $assetTag = $assetTag !== '' ? $assetTag : Asset::generateAssetTag($tenantId);
            if (Asset::where('tenant_id', $tenantId)->where('asset_tag', $assetTag)->exists()) {
                $errors[] = "Row {$rowNum}: Asset tag \"{$assetTag}\" already exists.";
                continue;
            }
            $status = isset($data['Status']) ? strtolower(trim((string) $data['Status'])) : (isset($data['status']) ? strtolower(trim((string) $data['status'])) : 'available');
            $status = str_replace(' ', '_', $status);
            if (! in_array($status, $validStatuses, true)) {
                $errors[] = "Row {$rowNum}: Invalid status \"{$status}\".";
                continue;
            }
            $currency = isset($data['Currency']) ? strtoupper(trim((string) $data['Currency'])) : (isset($data['currency']) ? strtoupper(trim((string) $data['currency'])) : ($settings->default_currency ?? 'USD'));
            if (! in_array($currency, $validCurrencies, true)) {
                $currency = $settings->default_currency ?? 'USD';
            }
            $categoryName = isset($data['Category']) ? trim((string) $data['Category']) : (isset($data['category']) ? trim((string) $data['category']) : '');
            $categoryId = null;
            if ($categoryName !== '') {
                $categoryId = $categoriesByName->get(strtolower($categoryName))?->id ?? null;
            }
            $purchasePrice = isset($data['Purchase price']) ? $data['Purchase price'] : (isset($data['purchase_price']) ? $data['purchase_price'] : null);
            $purchasePrice = $purchasePrice !== null && $purchasePrice !== '' ? (is_numeric($purchasePrice) ? (float) $purchasePrice : null) : null;
            $purchaseDate = isset($data['Purchase date']) ? trim((string) $data['Purchase date']) : (isset($data['purchase_date']) ? trim((string) $data['purchase_date']) : null);
            $purchaseDate = ($purchaseDate !== null && $purchaseDate !== '' && strtotime($purchaseDate)) ? date('Y-m-d', strtotime($purchaseDate)) : null;
            $condition = isset($data['Condition']) ? strtolower(trim((string) $data['Condition'])) : (isset($data['condition']) ? strtolower(trim((string) $data['condition'])) : null);
            if ($condition !== null && $condition !== '' && ! in_array($condition, $validConditions, true)) {
                $condition = null;
            }
            $payload = [
                'tenant_id' => $tenantId,
                'name' => $name,
                'asset_tag' => $assetTag,
                'serial_number' => isset($data['Serial number']) ? trim((string) $data['Serial number']) : (isset($data['serial_number']) ? trim((string) $data['serial_number']) : null),
                'asset_category_id' => $categoryId,
                'status' => $status,
                'purchase_price' => $purchasePrice,
                'currency' => $currency,
                'purchase_date' => $purchaseDate,
                'location' => isset($data['Location']) ? trim((string) $data['location']) : (isset($data['location']) ? trim((string) $data['location']) : null),
                'condition' => $condition,
            ];
            if (in_array($status, Asset::disposedStatuses(), true)) {
                $payload['disposed_at'] = now();
            }
            try {
                Asset::create($payload);
                $created++;
            } catch (\Throwable $e) {
                $errors[] = "Row {$rowNum}: " . $e->getMessage();
            }
        }
        fclose($handle);
        $message = $created . ' asset(s) imported.';
        if (count($errors) > 0) {
            $message .= ' ' . count($errors) . ' row(s) had errors.';
        }
        return redirect()->route('assets.import', ['tenant' => tenant('slug')])
            ->with(count($errors) > 0 ? 'warning' : 'success', $message)
            ->with('import_errors', count($errors) > 0 ? $errors : null);
    }

    public function export(Request $request): StreamedResponse|HttpResponse
    {
        $tenantId = tenant('id');
        $settings = AssetSettings::getForTenant($tenantId);
        $exportAll = $request->boolean('all');
        $format = $request->input('format', 'csv');
        if (! in_array($format, ['csv', 'json'], true)) {
            $format = 'csv';
        }

        $query = Asset::query()
            ->with(['category:id,name,slug', 'assignedToUser:id,first_name,last_name,email'])
            ->where('tenant_id', $tenantId);

        $uuids = $request->input('uuids', []);
        if (is_array($uuids) && count($uuids) > 0) {
            $uuids = array_values(array_unique(array_filter(array_map('strval', $uuids))));
            $query->whereIn('uuid', $uuids);
        } elseif ($exportAll && $request->boolean('available_only')) {
            $query->whereNotIn('status', Asset::disposedStatuses());
        } elseif (! $exportAll) {
            if ($request->filled('search')) {
                $search = trim($request->search);
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                        ->orWhere('asset_tag', 'like', '%' . $search . '%')
                        ->orWhere('serial_number', 'like', '%' . $search . '%');
                });
            }
            if ($request->filled('category')) {
                $query->where('asset_category_id', $request->category);
            }
            $statusFilter = $request->filled('status') ? $request->status : ($settings->default_status_filter ?? null);
            if ($statusFilter) {
                $query->where('status', $statusFilter);
            }
        }

        $assets = $query->orderBy('name')->get();

        if ($format === 'json') {
            $categories = AssetCategory::where('tenant_id', $tenantId)
                ->with('parent:id,slug')
                ->ordered()
                ->get()
                ->map(function (AssetCategory $c) {
                    return [
                        'name' => $c->name,
                        'slug' => $c->slug,
                        'description' => $c->description,
                        'sort_order' => $c->sort_order,
                        'parent_slug' => $c->parent?->slug,
                        'depreciation_useful_life_years' => $c->depreciation_useful_life_years,
                        'depreciation_salvage_value' => $c->depreciation_salvage_value !== null ? (float) $c->depreciation_salvage_value : null,
                        'depreciation_method' => $c->depreciation_method,
                    ];
                })
                ->values()
                ->all();

            $assetsData = $assets->map(function (Asset $a) {
                return [
                    'uuid' => $a->uuid,
                    'name' => $a->name,
                    'asset_tag' => $a->asset_tag,
                    'serial_number' => $a->serial_number,
                    'category' => $a->category?->name,
                    'category_slug' => $a->category?->slug,
                    'status' => $a->status,
                    'assigned_to' => $a->assignedToUser ? trim($a->assignedToUser->first_name . ' ' . $a->assignedToUser->last_name) ?: $a->assignedToUser->email : null,
                    'purchase_price' => $a->purchase_price !== null ? (float) $a->purchase_price : null,
                    'currency' => $a->currency,
                    'purchase_date' => $a->purchase_date?->format('Y-m-d'),
                    'location' => $a->location,
                    'condition' => $a->condition,
                ];
            })->values()->all();

            $payload = [
                'categories' => $categories,
                'assets' => $assetsData,
            ];
            return response()->json($payload, 200, [
                'Content-Disposition' => 'attachment; filename="assets-' . date('Y-m-d-His') . '.json"',
            ], JSON_UNESCAPED_UNICODE);
        }

        $filename = 'assets-' . date('Y-m-d-His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];
        $callback = function () use ($assets) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Name', 'Asset tag', 'Serial number', 'Category', 'Status', 'Assigned to', 'Purchase price', 'Currency', 'Purchase date', 'Location', 'Condition']);
            foreach ($assets as $a) {
                $assigned = $a->assignedToUser
                    ? (trim($a->assignedToUser->first_name . ' ' . $a->assignedToUser->last_name) ?: $a->assignedToUser->email)
                    : '';
                fputcsv($out, [
                    $a->name,
                    $a->asset_tag,
                    $a->serial_number ?? '',
                    $a->category?->name ?? '',
                    $a->status,
                    $assigned,
                    $a->purchase_price ?? '',
                    $a->currency ?? '',
                    $a->purchase_date?->format('Y-m-d') ?? '',
                    $a->location ?? '',
                    $a->condition ?? '',
                ]);
            }
            fclose($out);
        };
        return response()->stream($callback, 200, $headers);
    }

    public function accountant(Request $request): Response
    {
        $tenantId = tenant('id');
        $settings = AssetSettings::getForTenant($tenantId);
        $statusFilter = $request->filled('status') ? $request->status : ($settings->default_status_filter ?? null);

        $query = Asset::query()
            ->with(['category:id,name,slug,depreciation_useful_life_years,depreciation_salvage_value,depreciation_method'])
            ->where('tenant_id', $tenantId);

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('asset_tag', 'like', '%' . $search . '%')
                    ->orWhere('serial_number', 'like', '%' . $search . '%');
            });
        }
        if ($request->filled('category')) {
            $query->where('asset_category_id', $request->category);
        }
        if ($statusFilter) {
            $query->where('status', $statusFilter);
        }

        $assets = $query->orderBy('name')->get();

        $rows = $assets->map(function (Asset $a) {
            $settings = $a->getEffectiveDepreciationSettings();
            $bookValue = $a->bookValue();
            $accumulated = $a->accumulatedDepreciation();
            $usefulLife = $settings['useful_life_years'] ?? null;
            return [
                'id' => $a->id,
                'uuid' => $a->uuid,
                'name' => $a->name,
                'asset_tag' => $a->asset_tag,
                'category' => $a->category ? ['id' => $a->category->id, 'name' => $a->category->name] : null,
                'purchase_date' => $a->purchase_date?->format('Y-m-d'),
                'purchase_price' => $a->purchase_price !== null ? (float) $a->purchase_price : null,
                'currency' => $a->currency,
                'useful_life_years' => $usefulLife,
                'accumulated_depreciation' => $accumulated,
                'book_value' => $bookValue,
                'status' => $a->status,
            ];
        });

        $categorySummary = $rows->groupBy(function ($r) {
            return $r['category']['name'] ?? 'Uncategorized';
        })->map(function ($group) {
            $totalBook = $group->sum(fn ($r) => $r['book_value'] ?? 0);
            $totalAccumulated = $group->sum(fn ($r) => $r['accumulated_depreciation'] ?? 0);
            return ['total_book_value' => round($totalBook, 2), 'total_accumulated_depreciation' => round($totalAccumulated, 2), 'count' => $group->count()];
        })->all();

        $categories = AssetCategory::where('tenant_id', $tenantId)->ordered()->get(['id', 'name']);

        $filters = $request->only(['search', 'category']);
        $filters['status'] = $request->filled('status') ? $request->status : $statusFilter;

        return Inertia::render('assets/accountant', [
            'assets' => $rows->values()->all(),
            'categories' => $categories,
            'filters' => $filters,
            'statusOptions' => Asset::statusOptions(),
            'categorySummary' => $categorySummary,
        ]);
    }

    public function accountantExport(Request $request): StreamedResponse|HttpResponse
    {
        $tenantId = tenant('id');
        $settings = AssetSettings::getForTenant($tenantId);
        $statusFilter = $request->filled('status') ? $request->status : ($settings->default_status_filter ?? null);
        $format = $request->input('format', 'csv');
        if (! in_array($format, ['csv', 'json'], true)) {
            $format = 'csv';
        }

        $query = Asset::query()
            ->with(['category:id,name,slug,depreciation_useful_life_years,depreciation_salvage_value,depreciation_method'])
            ->where('tenant_id', $tenantId);

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('asset_tag', 'like', '%' . $search . '%')
                    ->orWhere('serial_number', 'like', '%' . $search . '%');
            });
        }
        if ($request->filled('category')) {
            $query->where('asset_category_id', $request->category);
        }
        if ($statusFilter) {
            $query->where('status', $statusFilter);
        }

        $assets = $query->orderBy('name')->get();

        $rows = $assets->map(function (Asset $a) {
            $settings = $a->getEffectiveDepreciationSettings();
            return [
                'name' => $a->name,
                'asset_tag' => $a->asset_tag,
                'category' => $a->category?->name,
                'purchase_date' => $a->purchase_date?->format('Y-m-d'),
                'purchase_price' => $a->purchase_price !== null ? (float) $a->purchase_price : null,
                'currency' => $a->currency,
                'useful_life_years' => $settings['useful_life_years'] ?? null,
                'accumulated_depreciation' => $a->accumulatedDepreciation(),
                'book_value' => $a->bookValue(),
                'status' => $a->status,
            ];
        })->values()->all();

        if ($format === 'json') {
            return response()->json($rows, 200, [
                'Content-Disposition' => 'attachment; filename="assets-depreciation-' . date('Y-m-d-His') . '.json"',
            ], JSON_UNESCAPED_UNICODE);
        }

        $filename = 'assets-depreciation-' . date('Y-m-d-His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];
        $callback = function () use ($rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Name', 'Asset tag', 'Category', 'Purchase date', 'Purchase price', 'Currency', 'Useful life (years)', 'Accumulated depreciation', 'Book value', 'Status']);
            foreach ($rows as $r) {
                fputcsv($out, [
                    $r['name'],
                    $r['asset_tag'],
                    $r['category'] ?? '',
                    $r['purchase_date'] ?? '',
                    $r['purchase_price'] ?? '',
                    $r['currency'] ?? '',
                    $r['useful_life_years'] ?? '',
                    $r['accumulated_depreciation'] ?? '',
                    $r['book_value'] ?? '',
                    $r['status'] ?? '',
                ]);
            }
            fclose($out);
        };
        return response()->stream($callback, 200, $headers);
    }
}
