import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AssetStatusBadge } from '@/components/asset-status-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, FolderTree, Package, ChevronLeft, ChevronRight, UserPlus, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface Asset {
    id: number;
    uuid: string;
    name: string;
    asset_tag: string;
    status: string;
    purchase_price: string | null;
    currency: string;
    assigned_to_user?: User | null;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    totals_by_currency?: Record<string, string | number>;
    available_assets_count?: number;
    available_for_sale_count?: number;
    available_for_sale_by_currency?: Record<string, string | number>;
    sold_count?: number;
    total_in_category?: number;
}

interface CategoryOption {
    id: number;
    name: string;
}

interface Props {
    category: Category;
    assets: { data: Asset[]; current_page: number; last_page: number; per_page: number; total: number };
    categories?: CategoryOption[];
    users?: User[];
    statusOptions?: Record<string, string>;
    filters?: { search?: string; status?: string; sort?: string; dir?: string };
}

function formatCurrency(amount: string | null, currency: string): string {
    if (amount == null || amount === '') return '—';
    const n = parseFloat(amount);
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(n);
}

export default function AssetCategoriesShow({ category, assets, categories = [], users = [], statusOptions = {}, filters = {} }: Props) {
    const tenantRouter = useTenantRouter();
    const [selectedUuids, setSelectedUuids] = useState<Set<string>>(new Set());
    const [bulkCategoryId, setBulkCategoryId] = useState<string>('');
    const [bulkStatus, setBulkStatus] = useState<string>('');
    const [bulkAssignedToId, setBulkAssignedToId] = useState<string>('');
    const [deleteSingleUuid, setDeleteSingleUuid] = useState<string | null>(null);
    const [deleteBulkOpen, setDeleteBulkOpen] = useState(false);
    const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const pageUuids = assets.data.map((a) => a.uuid);
    const allOnPageSelected = pageUuids.length > 0 && pageUuids.every((u) => selectedUuids.has(u));
    const someSelected = selectedUuids.size > 0;

    const toggleOne = useCallback((uuid: string) => {
        setSelectedUuids((prev) => {
            const next = new Set(prev);
            if (next.has(uuid)) next.delete(uuid);
            else next.add(uuid);
            return next;
        });
    }, []);

    const toggleAllOnPage = useCallback(() => {
        if (allOnPageSelected) {
            setSelectedUuids((prev) => {
                const next = new Set(prev);
                pageUuids.forEach((u) => next.delete(u));
                return next;
            });
        } else {
            setSelectedUuids((prev) => {
                const next = new Set(prev);
                pageUuids.forEach((u) => next.add(u));
                return next;
            });
        }
    }, [allOnPageSelected, pageUuids]);

    const clearSelection = useCallback(() => {
        setSelectedUuids(new Set());
        setBulkCategoryId('');
        setBulkStatus('');
        setBulkAssignedToId('');
    }, []);

    const handleBulkDelete = useCallback(() => {
        if (selectedUuids.size === 0) return;
        setDeleteBulkOpen(true);
    }, [selectedUuids.size]);

    const confirmBulkDelete = useCallback(() => {
        router.post(tenantRouter.route('assets.bulk-destroy'), { uuids: Array.from(selectedUuids) }, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedUuids(new Set());
                setDeleteBulkOpen(false);
            },
        });
    }, [selectedUuids, tenantRouter]);

    const handleBulkStatus = useCallback(() => {
        if (selectedUuids.size === 0 || !bulkStatus) return;
        router.post(tenantRouter.route('assets.bulk-update-status'), { uuids: Array.from(selectedUuids), status: bulkStatus }, {
            preserveScroll: true,
            onSuccess: () => { setSelectedUuids(new Set()); setBulkStatus(''); },
        });
    }, [selectedUuids, bulkStatus, tenantRouter]);

    const handleBulkAssignTo = useCallback(() => {
        if (selectedUuids.size === 0) return;
        const userId = (bulkAssignedToId === '' || bulkAssignedToId === '__none__') ? '' : bulkAssignedToId;
        router.post(tenantRouter.route('assets.bulk-update-assigned-to'), { uuids: Array.from(selectedUuids), assigned_to_user_id: userId || null }, {
            preserveScroll: true,
            onSuccess: () => { setSelectedUuids(new Set()); setBulkAssignedToId(''); },
        });
    }, [selectedUuids, bulkAssignedToId, tenantRouter]);

    const handleBulkAssignCategory = useCallback(() => {
        if (selectedUuids.size === 0) return;
        const categoryId = (bulkCategoryId === '' || bulkCategoryId === '__uncategorized__') ? null : bulkCategoryId;
        router.post(tenantRouter.route('assets.bulk-update-category'), {
            uuids: Array.from(selectedUuids),
            asset_category_id: categoryId,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedUuids(new Set());
                setBulkCategoryId('');
            },
        });
    }, [selectedUuids, bulkCategoryId, tenantRouter]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Assets', href: tenantRouter.route('assets.index') },
        { title: 'Categories', href: tenantRouter.route('assets.categories.index') },
        { title: category.name, href: tenantRouter.route('assets.categories.show', { category: category.id }) },
    ];
    const formatTotalsByCurrency = (totals: Record<string, string | number> | undefined) => {
        if (!totals || Object.keys(totals).length === 0) return '—';
        return Object.entries(totals)
            .filter(([, v]) => Number(v) > 0)
            .map(([currency, total]) => formatCurrency(String(total), currency))
            .join(' · ');
    };
    const assignedName = (u: User) => [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email;

    const confirmDeleteCategory = useCallback(() => {
        router.delete(tenantRouter.route('assets.categories.destroy', { category: category.id }), {
            preserveScroll: true,
            onSuccess: () => router.visit(tenantRouter.route('assets.categories.index')),
        });
    }, [category.id, tenantRouter]);

    const applySearch = useCallback(() => {
        const search = searchInputRef.current?.value?.trim();
        tenantRouter.get('assets.categories.show', {
            category: category.id,
            search: search || undefined,
            status: filters.status === 'all' ? undefined : filters.status,
            sort: filters.sort || undefined,
            dir: filters.dir || undefined,
            page: undefined,
        }, { preserveScroll: true });
    }, [category.id, filters.status, filters.sort, filters.dir, tenantRouter]);

    const sortDir = ((filters.dir ?? 'asc') as string).toLowerCase() as 'asc' | 'desc';
    const currentSort = filters.sort ?? 'name';
    const toggleSort = useCallback((column: string) => {
        const nextDir = currentSort === column && sortDir === 'asc' ? 'desc' : 'asc';
        tenantRouter.get('assets.categories.show', {
            category: category.id,
            search: filters.search || undefined,
            status: filters.status === 'all' ? undefined : filters.status,
            sort: column,
            dir: nextDir,
            page: undefined,
        }, { preserveScroll: true });
    }, [category.id, currentSort, sortDir, filters.search, filters.status, tenantRouter]);

    const setStatusFilter = useCallback((status: string) => {
        tenantRouter.get('assets.categories.show', {
            category: category.id,
            search: filters.search || undefined,
            status: status === 'all' ? undefined : status,
            sort: filters.sort || undefined,
            dir: filters.dir || undefined,
            page: undefined,
        }, { preserveScroll: true });
    }, [category.id, filters.search, filters.sort, filters.dir, tenantRouter]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={category.name} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <FolderTree className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold">{category.name}</h1>
                                {category.description && (
                                    <p className="text-muted-foreground text-sm">{category.description}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={tenantRouter.route('assets.categories.edit', { category: category.id })}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setDeleteCategoryOpen(true)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </div>

                    {someSelected && (
                        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 px-4 py-2">
                            <span className="text-sm font-medium">{selectedUuids.size} selected</span>
                            <div className="flex flex-wrap items-center gap-2">
                                <Select value={bulkCategoryId || '__none__'} onValueChange={(v) => setBulkCategoryId(v === '__none__' ? '' : v)}>
                                    <SelectTrigger className="h-9 w-[200px]">
                                        <SelectValue placeholder="Category..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__uncategorized__">Uncategorized</SelectItem>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button variant="secondary" size="sm" onClick={handleBulkAssignCategory}>
                                    Assign category
                                </Button>
                                <Select value={bulkStatus || '__none__'} onValueChange={(v) => setBulkStatus(v === '__none__' ? '' : v)}>
                                    <SelectTrigger className="h-9 w-[180px]">
                                        <SelectValue placeholder="Status..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(statusOptions).map(([code, label]) => (
                                            <SelectItem key={code} value={code}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button variant="secondary" size="sm" onClick={handleBulkStatus} disabled={!bulkStatus}>
                                    Assign status
                                </Button>
                                <Select value={bulkAssignedToId || '__none__'} onValueChange={(v) => setBulkAssignedToId(v === '__none__' ? '' : v)}>
                                    <SelectTrigger className="h-9 w-[200px]">
                                        <SelectValue placeholder="Assigned to..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Unassigned</SelectItem>
                                        {users.map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>
                                                {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button variant="secondary" size="sm" onClick={handleBulkAssignTo}>
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    Assign to
                                </Button>
                            </div>
                            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete selected
                            </Button>
                            <Button variant="ghost" size="sm" onClick={clearSelection}>
                                Clear selection
                            </Button>
                        </div>
                    )}

                    {/* Bulk delete confirmation */}
                    <AlertDialog open={deleteBulkOpen} onOpenChange={setDeleteBulkOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete selected assets?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete {selectedUuids.size} asset{selectedUuids.size !== 1 ? 's' : ''}. This cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Single asset delete confirmation */}
                    <AlertDialog open={!!deleteSingleUuid} onOpenChange={(open) => !open && setDeleteSingleUuid(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete this asset?</AlertDialogTitle>
                                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => {
                                        if (deleteSingleUuid) {
                                            router.delete(tenantRouter.route('assets.destroy', { asset: deleteSingleUuid }), {
                                                preserveScroll: true,
                                                onSuccess: () => setDeleteSingleUuid(null),
                                            });
                                        }
                                    }}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Category delete confirmation */}
                    <AlertDialog open={deleteCategoryOpen} onOpenChange={setDeleteCategoryOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete this category?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Assets in this category will become uncategorized. This cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Category summary — two boxes like dashboard */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="overflow-hidden rounded-2xl border shadow-sm">
                            <CardContent className="pt-5 pb-5">
                                <p className="text-muted-foreground text-sm font-medium mb-4">Summary</p>
                                <dl className="space-y-3">
                                    <div className="flex justify-between items-baseline gap-2">
                                        <dt className="text-muted-foreground text-sm">Total items</dt>
                                        <dd className="text-xl font-semibold tabular-nums">{category.total_in_category ?? 0}</dd>
                                    </div>
                                    <div className="flex justify-between items-baseline gap-2">
                                        <dt className="text-muted-foreground text-sm">Available</dt>
                                        <dd className="text-xl font-semibold tabular-nums">{category.available_assets_count ?? 0}</dd>
                                    </div>
                                    <div className="flex justify-between items-baseline gap-2">
                                        <dt className="text-muted-foreground text-sm">Available for sale</dt>
                                        <dd className="text-xl font-semibold tabular-nums">{category.available_for_sale_count ?? 0}</dd>
                                    </div>
                                    <div className="flex justify-between items-baseline gap-2">
                                        <dt className="text-muted-foreground text-sm">Sold</dt>
                                        <dd className="text-xl font-semibold tabular-nums">{category.sold_count ?? 0}</dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>
                        <Card className="overflow-hidden rounded-2xl border shadow-sm">
                            <CardContent className="pt-5 pb-5">
                                <p className="text-muted-foreground text-sm font-medium mb-4">Currency totals</p>
                                <dl className="space-y-3">
                                    <div className="flex justify-between items-baseline gap-2">
                                        <dt className="text-muted-foreground text-sm">Available value</dt>
                                        <dd className="text-xl font-semibold tabular-nums">
                                            {category.totals_by_currency && Object.keys(category.totals_by_currency).length > 0
                                                ? formatTotalsByCurrency(category.totals_by_currency)
                                                : '—'}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between items-baseline gap-2">
                                        <dt className="text-muted-foreground text-sm">Available for sale</dt>
                                        <dd className="text-xl font-semibold tabular-nums">
                                            {category.available_for_sale_by_currency && Object.keys(category.available_for_sale_by_currency).length > 0
                                                ? formatTotalsByCurrency(category.available_for_sale_by_currency)
                                                : '—'}
                                        </dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-medium">Assets in this category</h2>
                                    <div className="text-muted-foreground text-sm tabular-nums flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                        {category.available_assets_count != null && (
                                            <span>{category.available_assets_count} available item{category.available_assets_count !== 1 ? 's' : ''}</span>
                                        )}
                                        <span>Value: {formatTotalsByCurrency(category.totals_by_currency)}</span>
                                        {(category.available_for_sale_count ?? 0) > 0 && (
                                            <span className="text-primary/90">
                                                {category.available_for_sale_count} for sale · {formatTotalsByCurrency(category.available_for_sale_by_currency)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <form
                                    className="flex items-center gap-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        applySearch();
                                    }}
                                >
                                    <Input
                                        ref={searchInputRef}
                                        name="search"
                                        placeholder="Search in category..."
                                        defaultValue={filters.search}
                                        className="h-10 w-[180px] sm:w-[200px]"
                                    />
                                    <Button type="submit" variant="secondary" size="sm" className="h-10 px-3">
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                                <span className="text-muted-foreground text-sm mr-1">View:</span>
                                <Button
                                    variant={filters.status === 'all' || !filters.status ? 'secondary' : 'outline'}
                                    size="sm"
                                    className="h-8"
                                    onClick={() => setStatusFilter('all')}
                                >
                                    All
                                </Button>
                                <Button
                                    variant={filters.status === 'available' ? 'secondary' : 'outline'}
                                    size="sm"
                                    className="h-8"
                                    onClick={() => setStatusFilter('available')}
                                >
                                    Available
                                </Button>
                                <Button
                                    variant={filters.status === 'available_for_sale' ? 'secondary' : 'outline'}
                                    size="sm"
                                    className="h-8"
                                    onClick={() => setStatusFilter('available_for_sale')}
                                >
                                    Available for sale
                                </Button>
                                <Button
                                    variant={filters.status === 'sold' ? 'secondary' : 'outline'}
                                    size="sm"
                                    className="h-8"
                                    onClick={() => setStatusFilter('sold')}
                                >
                                    Sold
                                </Button>
                                <Button
                                    variant={filters.status === 'in_use' ? 'secondary' : 'outline'}
                                    size="sm"
                                    className="h-8"
                                    onClick={() => setStatusFilter('in_use')}
                                >
                                    In use
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {assets.data.length === 0 ? (
                                <p className="py-8 text-center text-muted-foreground">No assets in this category.</p>
                            ) : (
                                <>
                                    <div className="overflow-x-auto rounded-md border">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted/50">
                                                    <th className="w-10 p-3">
                                                        {assets.data.length > 0 && (
                                                            <Checkbox
                                                                checked={allOnPageSelected}
                                                                onCheckedChange={toggleAllOnPage}
                                                                aria-label="Select all on page"
                                                            />
                                                        )}
                                                    </th>
                                                    <th className="p-3 text-left font-medium">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSort('name')}
                                                            className="inline-flex items-center gap-1 hover:text-foreground focus:outline-none focus:underline"
                                                        >
                                                            Name / Tag
                                                            {currentSort === 'name' ? (sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />}
                                                        </button>
                                                    </th>
                                                    <th className="p-3 text-left font-medium">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSort('status')}
                                                            className="inline-flex items-center gap-1 hover:text-foreground focus:outline-none focus:underline"
                                                        >
                                                            Status
                                                            {currentSort === 'status' ? (sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />}
                                                        </button>
                                                    </th>
                                                    <th className="p-3 text-left font-medium">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSort('assigned_to')}
                                                            className="inline-flex items-center gap-1 hover:text-foreground focus:outline-none focus:underline"
                                                        >
                                                            Assigned to
                                                            {currentSort === 'assigned_to' ? (sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />}
                                                        </button>
                                                    </th>
                                                    <th className="p-3 text-right font-medium">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSort('purchase_price')}
                                                            className="inline-flex items-center gap-1 hover:text-foreground focus:outline-none focus:underline ml-auto"
                                                        >
                                                            Value
                                                            {currentSort === 'purchase_price' ? (sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />}
                                                        </button>
                                                    </th>
                                                    <th className="w-20 p-3 text-right font-medium"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {assets.data.map((a) => (
                                                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                                            <Checkbox
                                                                checked={selectedUuids.has(a.uuid)}
                                                                onCheckedChange={() => toggleOne(a.uuid)}
                                                                aria-label={`Select ${a.name}`}
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <Link
                                                                href={tenantRouter.route('assets.show', { asset: a.uuid })}
                                                                className="font-medium text-primary hover:underline focus:outline-none focus:underline"
                                                            >
                                                                {a.name}
                                                            </Link>
                                                            <div className="text-muted-foreground text-xs">{a.asset_tag}</div>
                                                        </td>
                                                        <td className="p-3">
                                                            <AssetStatusBadge status={a.status} label={statusOptions[a.status]} />
                                                        </td>
                                                        <td className="p-3">
                                                            {a.assigned_to_user ? assignedName(a.assigned_to_user) : '—'}
                                                        </td>
                                                        <td className="p-3 text-right tabular-nums">
                                                            {formatCurrency(a.purchase_price, a.currency)}
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                                    <Link href={tenantRouter.route('assets.edit', { asset: a.uuid })} title="Edit">
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                                    title="Delete"
                                                                    onClick={() => setDeleteSingleUuid(a.uuid)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {assets.last_page > 1 && (
                                        <div className="mt-4 flex items-center justify-between">
                                            <p className="text-sm text-muted-foreground">
                                                Page {assets.current_page} of {assets.last_page} ({assets.total} total)
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={assets.current_page <= 1}
                                                    asChild
                                                >
                                                    <Link href={tenantRouter.route('assets.categories.show', { category: category.id, page: assets.current_page - 1, search: filters.search, status: filters.status === 'all' ? undefined : filters.status, sort: filters.sort, dir: filters.dir })}>
                                                        <ChevronLeft className="h-4 w-4" /> Previous
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={assets.current_page >= assets.last_page}
                                                    asChild
                                                >
                                                    <Link href={tenantRouter.route('assets.categories.show', { category: category.id, page: assets.current_page + 1, search: filters.search, status: filters.status === 'all' ? undefined : filters.status, sort: filters.sort, dir: filters.dir })}>
                                                        Next <ChevronRight className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={tenantRouter.route('assets.categories.index')}>← Categories</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={tenantRouter.route('assets.create')}>
                                <Package className="h-4 w-4 mr-2" />
                                Add asset
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
