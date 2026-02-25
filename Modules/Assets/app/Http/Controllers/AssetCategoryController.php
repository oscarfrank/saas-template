<?php

namespace Modules\Assets\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Assets\Models\Asset;
use Modules\Assets\Models\AssetCategory;
use Modules\User\Models\User;

class AssetCategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $tenantId = tenant('id');
        $disposedStatuses = Asset::disposedStatuses();
        $query = AssetCategory::query()
            ->withCount(['assets as assets_count' => function ($q) use ($disposedStatuses) {
                $q->whereNotIn('status', $disposedStatuses);
            }])
            ->where('tenant_id', $tenantId)
            ->ordered();

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('slug', 'like', '%' . $search . '%');
            });
        }

        $categories = $query->get();
        $totalsByCategory = Asset::query()
            ->where('tenant_id', $tenantId)
            ->whereNotIn('status', $disposedStatuses)
            ->whereNotNull('asset_category_id')
            ->selectRaw('asset_category_id, currency, COALESCE(SUM(purchase_price), 0) as total')
            ->groupBy('asset_category_id', 'currency')
            ->get()
            ->groupBy('asset_category_id');
        $availableForSaleByCategory = Asset::query()
            ->where('tenant_id', $tenantId)
            ->where('status', Asset::STATUS_AVAILABLE_FOR_SALE)
            ->whereNotNull('asset_category_id')
            ->selectRaw('asset_category_id, currency, COALESCE(SUM(purchase_price), 0) as total')
            ->groupBy('asset_category_id', 'currency')
            ->get();
        $availableForSaleCountByCategory = Asset::query()
            ->where('tenant_id', $tenantId)
            ->where('status', Asset::STATUS_AVAILABLE_FOR_SALE)
            ->whereNotNull('asset_category_id')
            ->selectRaw('asset_category_id, COUNT(*) as total')
            ->groupBy('asset_category_id')
            ->pluck('total', 'asset_category_id');
        foreach ($categories as $cat) {
            $cat->totals_by_currency = $totalsByCategory->get($cat->id, collect())
                ->pluck('total', 'currency')
                ->toArray();
            $cat->available_for_sale_count = (int) ($availableForSaleCountByCategory[$cat->id] ?? 0);
            $cat->available_for_sale_by_currency = $availableForSaleByCategory
                ->where('asset_category_id', $cat->id)
                ->pluck('total', 'currency')
                ->toArray();
        }
        $uncategorized = Asset::query()
            ->where('tenant_id', $tenantId)
            ->whereNotIn('status', $disposedStatuses)
            ->whereNull('asset_category_id')
            ->selectRaw('currency, COALESCE(SUM(purchase_price), 0) as total')
            ->groupBy('currency')
            ->pluck('total', 'currency')
            ->toArray();

        return Inertia::render('assets/categories/index', [
            'categories' => $categories,
            'uncategorized_totals' => $uncategorized,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        $tenantId = tenant('id');
        $parentCategories = AssetCategory::where('tenant_id', $tenantId)->ordered()->get(['id', 'name']);
        return Inertia::render('assets/categories/create', ['parentCategories' => $parentCategories]);
    }

    public function store(Request $request): RedirectResponse
    {
        $tenantId = tenant('id');
        $request->merge([
            'parent_id' => $request->input('parent_id') ?: null,
            'depreciation_useful_life_years' => $request->filled('depreciation_useful_life_years') ? $request->input('depreciation_useful_life_years') : null,
            'depreciation_salvage_value' => $request->filled('depreciation_salvage_value') ? $request->input('depreciation_salvage_value') : null,
        ]);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:128',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:asset_categories,id',
            'sort_order' => 'nullable|integer|min:0',
            'depreciation_useful_life_years' => 'nullable|integer|min:1|max:100',
            'depreciation_salvage_value' => 'nullable|numeric|min:0',
            'depreciation_method' => 'nullable|string|in:straight_line',
        ]);
        $validated['tenant_id'] = $tenantId;
        $validated['sort_order'] = $validated['sort_order'] ?? 0;
        $validated['parent_id'] = $validated['parent_id'] ?? null;
        $validated['depreciation_useful_life_years'] = $validated['depreciation_useful_life_years'] ?? null;
        $validated['depreciation_salvage_value'] = $validated['depreciation_salvage_value'] ?? null;
        $validated['depreciation_method'] = $validated['depreciation_method'] ?? 'straight_line';
        $category = AssetCategory::create($validated);
        return redirect()->route('assets.categories.show', ['tenant' => tenant('slug'), 'category' => $category->id])
            ->with('success', 'Category created.');
    }

    public function show(Request $request, AssetCategory $category): Response|RedirectResponse
    {
        if ($category->tenant_id !== tenant('id')) {
            abort(404);
        }
        $disposedStatuses = Asset::disposedStatuses();
        $category->totals_by_currency = Asset::query()
            ->where('asset_category_id', $category->id)
            ->whereNotIn('status', $disposedStatuses)
            ->selectRaw('currency, COALESCE(SUM(purchase_price), 0) as total')
            ->groupBy('currency')
            ->pluck('total', 'currency')
            ->toArray();
        $available_count = Asset::query()
            ->where('asset_category_id', $category->id)
            ->whereNotIn('status', $disposedStatuses)
            ->count();
        $available_for_sale_count = Asset::query()
            ->where('asset_category_id', $category->id)
            ->where('status', Asset::STATUS_AVAILABLE_FOR_SALE)
            ->count();
        $available_for_sale_by_currency = Asset::query()
            ->where('asset_category_id', $category->id)
            ->where('status', Asset::STATUS_AVAILABLE_FOR_SALE)
            ->selectRaw('currency, COALESCE(SUM(purchase_price), 0) as total')
            ->groupBy('currency')
            ->pluck('total', 'currency')
            ->toArray();
        $sold_count = Asset::query()
            ->where('asset_category_id', $category->id)
            ->where('status', Asset::STATUS_SOLD)
            ->count();
        $total_in_category = Asset::query()
            ->where('asset_category_id', $category->id)
            ->count();
        $assetsQuery = Asset::query()
            ->where('asset_category_id', $category->id)
            ->with('assignedToUser:id,first_name,last_name,email');
        if ($request->filled('search')) {
            $search = trim($request->search);
            $assetsQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('asset_tag', 'like', '%' . $search . '%')
                    ->orWhere('serial_number', 'like', '%' . $search . '%');
            });
        }
        $statusFilter = $request->input('status');
        if ($statusFilter !== null && $statusFilter !== '' && $statusFilter !== 'all') {
            $assetsQuery->where('status', $statusFilter);
        }
        $sortColumns = ['name', 'asset_tag', 'status', 'purchase_price', 'assigned_to'];
        $sort = $request->input('sort', 'name');
        $dir = strtoupper(strtolower($request->input('dir', 'asc')) === 'desc' ? 'DESC' : 'ASC');
        if (! in_array($sort, $sortColumns, true)) {
            $sort = 'name';
        }
        if ($sort === 'assigned_to') {
            $assetsQuery->orderByRaw(
                'CASE WHEN assets.assigned_to_user_id IS NULL THEN 1 ELSE 0 END, ' .
                '(SELECT COALESCE(users.last_name, users.first_name, users.email) FROM users WHERE users.id = assets.assigned_to_user_id) ' . $dir
            );
        } else {
            $assetsQuery->orderBy($sort, $dir);
        }
        $assets = $assetsQuery->paginate(15)->withQueryString();
        $categories = AssetCategory::where('tenant_id', tenant('id'))->ordered()->get(['id', 'name']);
        $tenantUserIds = DB::table('tenant_user')->where('tenant_id', $category->tenant_id)->pluck('user_id');
        $users = User::whereIn('id', $tenantUserIds)->orderBy('first_name')->orderBy('last_name')->get(['id', 'first_name', 'last_name', 'email']);
        return Inertia::render('assets/categories/show', [
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'totals_by_currency' => $category->totals_by_currency,
                'available_assets_count' => $available_count,
                'available_for_sale_count' => $available_for_sale_count,
                'available_for_sale_by_currency' => $available_for_sale_by_currency,
                'sold_count' => $sold_count,
                'total_in_category' => $total_in_category,
            ],
            'assets' => $assets,
            'categories' => $categories,
            'users' => $users,
            'statusOptions' => Asset::statusOptions(),
            'filters' => [
                'search' => $request->input('search'),
                'status' => $statusFilter === null || $statusFilter === '' || $statusFilter === 'all' ? 'all' : $statusFilter,
                'sort' => $sort,
                'dir' => strtolower($dir),
            ],
        ]);
    }

    public function edit(Request $request, AssetCategory $category): Response|RedirectResponse
    {
        if ($category->tenant_id !== tenant('id')) {
            abort(404);
        }
        $tenantId = tenant('id');
        $parentCategories = AssetCategory::where('tenant_id', $tenantId)->where('id', '!=', $category->id)->ordered()->get(['id', 'name']);
        return Inertia::render('assets/categories/edit', ['category' => $category, 'parentCategories' => $parentCategories]);
    }

    public function update(Request $request, AssetCategory $category): RedirectResponse
    {
        if ($category->tenant_id !== tenant('id')) {
            abort(404);
        }
        $request->merge([
            'parent_id' => $request->input('parent_id') ?: null,
            'depreciation_useful_life_years' => $request->filled('depreciation_useful_life_years') ? $request->input('depreciation_useful_life_years') : null,
            'depreciation_salvage_value' => $request->filled('depreciation_salvage_value') ? $request->input('depreciation_salvage_value') : null,
        ]);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:128',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:asset_categories,id',
            'sort_order' => 'nullable|integer|min:0',
            'depreciation_useful_life_years' => 'nullable|integer|min:1|max:100',
            'depreciation_salvage_value' => 'nullable|numeric|min:0',
            'depreciation_method' => 'nullable|string|in:straight_line',
        ]);
        $validated['sort_order'] = $validated['sort_order'] ?? $category->sort_order;
        $validated['parent_id'] = $validated['parent_id'] ?? null;
        $validated['depreciation_useful_life_years'] = $validated['depreciation_useful_life_years'] ?? null;
        $validated['depreciation_salvage_value'] = $validated['depreciation_salvage_value'] ?? null;
        $validated['depreciation_method'] = $validated['depreciation_method'] ?? 'straight_line';
        $category->update($validated);
        return redirect()->route('assets.categories.show', ['tenant' => tenant('slug'), 'category' => $category->id])
            ->with('success', 'Category updated.');
    }

    public function destroy(AssetCategory $category): RedirectResponse
    {
        if ($category->tenant_id !== tenant('id')) {
            abort(404);
        }
        if ($category->assets()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete category that has assets. Reassign or delete assets first.');
        }
        $category->delete();
        return redirect()->route('assets.categories.index', ['tenant' => tenant('slug')])
            ->with('success', 'Category deleted.');
    }
}
