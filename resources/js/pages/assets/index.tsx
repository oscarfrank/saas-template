import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AssetStatusBadge } from '@/components/asset-status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, Search, ChevronLeft, ChevronRight, Package, FolderTree, Settings, Download, FileJson, FileSpreadsheet, Calculator, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Upload, UserPlus } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';

interface Category {
    id: number;
    name: string;
}

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

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
    serial_number: string | null;
    status: string;
    purchase_price: string | null;
    currency: string;
    category?: { id: number; name: string; slug: string } | null;
    assigned_to_user?: User | null;
}

interface Props {
    assets: { data: Asset[]; current_page: number; last_page: number; per_page: number; total: number };
    categories: Category[];
    users: User[];
    filters: { search?: string; category?: string; status?: string; sort?: string; dir?: 'asc' | 'desc' };
    statusOptions: Record<string, string>;
    summary: {
        total_assets: number;
        total_categories: number;
        totals_by_currency: Record<string, string | number>;
        available_for_sale_count: number;
        available_for_sale_by_currency: Record<string, string | number>;
    };
}

function formatCurrency(amount: string | null, currency: string): string {
    if (amount == null || amount === '') return '—';
    const n = parseFloat(amount);
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(n);
}

function buildExportUrl(
    baseUrl: string,
    format: 'csv' | 'json',
    filters: Props['filters'],
    all: boolean,
    selectedUuids?: string[],
    availableOnly?: boolean
): string {
    const params = new URLSearchParams();
    params.set('format', format);
    if (selectedUuids && selectedUuids.length > 0) {
        selectedUuids.forEach((uuid) => params.append('uuids[]', uuid));
    } else if (all) {
        params.set('all', '1');
        if (availableOnly) params.set('available_only', '1');
    } else {
        if (filters.search) params.set('search', filters.search);
        if (filters.category) params.set('category', filters.category);
        if (filters.status) params.set('status', filters.status);
        if (filters.sort) params.set('sort', filters.sort);
        if (filters.dir) params.set('dir', filters.dir);
    }
    return `${baseUrl}?${params.toString()}`;
}

export default function AssetsIndex({ assets, categories, users = [], filters, statusOptions, summary }: Props) {
    const tenantRouter = useTenantRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUuids, setSelectedUuids] = useState<Set<string>>(new Set());
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

    const [bulkCategoryId, setBulkCategoryId] = useState<string>('');
    const [bulkStatus, setBulkStatus] = useState<string>('');
    const [bulkAssignedToId, setBulkAssignedToId] = useState<string>('');
    const [deleteSingleUuid, setDeleteSingleUuid] = useState<string | null>(null);
    const [deleteBulkOpen, setDeleteBulkOpen] = useState(false);

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
    ];
    const currencyEntries = Object.entries(summary.totals_by_currency || {}).filter(([, v]) => Number(v) > 0);
    const availableForSaleCurrencyEntries = Object.entries(summary.available_for_sale_by_currency || {}).filter(([, v]) => Number(v) > 0);
    const formatTotalsByCurrency = (totals: Record<string, string | number>) =>
        Object.entries(totals)
            .filter(([, v]) => Number(v) > 0)
            .map(([currency, total]) => formatCurrency(String(total), currency))
            .join(' · ');

    const sortDir = ((filters.dir ?? 'asc') as string).toLowerCase() as 'asc' | 'desc';
    const currentSort = filters.sort ?? 'name';
    const toggleSort = (column: string) => {
        const nextDir = currentSort === column && sortDir === 'asc' ? 'desc' : 'asc';
        applyFilters({ sort: column, dir: nextDir, page: undefined });
    };
    const SortHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
        <th className="p-3 text-left font-medium">
            <button
                type="button"
                onClick={() => toggleSort(column)}
                className="inline-flex items-center gap-1 hover:text-foreground focus:outline-none focus:underline"
            >
                {children}
                {currentSort === column ? (sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />}
            </button>
        </th>
    );
    const exportBaseUrl = tenantRouter.route('assets.export');

    const applyFilters = (extra: Record<string, string | number | undefined> = {}) => {
        const search = searchInputRef.current?.value?.trim();
        tenantRouter.get(
            'assets.index',
            {
                search: search || undefined,
                category: filters.category || undefined,
                status: filters.status || undefined,
                sort: filters.sort || undefined,
                dir: filters.dir || undefined,
                ...extra,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onStart: () => setIsLoading(true),
                onFinish: () => setIsLoading(false),
            }
        );
    };

    const handleExport = (format: 'csv' | 'json', all: boolean, selected?: string[], availableOnly?: boolean) => {
        const url = buildExportUrl(exportBaseUrl, format, filters, all, selected, availableOnly);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Assets" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header: title + Add asset, Categories, Depreciation, Settings */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">Assets</h1>
                            <p className="text-muted-foreground text-sm">Manage your inventory and track value.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button asChild size="sm">
                            <Link href={tenantRouter.route('assets.create')}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add asset
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={tenantRouter.route('assets.categories.index')}>
                                <FolderTree className="h-4 w-4 mr-2" />
                                Categories
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={tenantRouter.route('assets.accountant')}>
                                <Calculator className="h-4 w-4 mr-2" />
                                Depreciation & P&L
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={tenantRouter.route('assets.settings.index')}>
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Two boxes: left = summary counters, right = currency totals */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="overflow-hidden rounded-2xl border shadow-sm">
                        <CardContent className="pt-5 pb-5">
                            <p className="text-muted-foreground text-sm font-medium mb-4">Summary</p>
                            <dl className="space-y-3">
                                <div className="flex justify-between items-baseline gap-2">
                                    <dt className="text-muted-foreground text-sm">Available items</dt>
                                    <dd className="text-xl font-semibold tabular-nums">{summary.total_assets}</dd>
                                </div>
                                <div className="flex justify-between items-baseline gap-2">
                                    <dt className="text-muted-foreground text-sm">Categories</dt>
                                    <dd className="text-xl font-semibold tabular-nums">{summary.total_categories}</dd>
                                </div>
                                <div className="flex justify-between items-baseline gap-2">
                                    <dt className="text-muted-foreground text-sm">Available for sale</dt>
                                    <dd className="text-xl font-semibold tabular-nums">{summary.available_for_sale_count}</dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                    <Card className="overflow-hidden rounded-2xl border shadow-sm">
                        <CardContent className="pt-5 pb-5">
                            <p className="text-muted-foreground text-sm font-medium mb-4">Currency totals</p>
                            <dl className="space-y-3">
                                <div className="flex justify-between items-baseline gap-2">
                                    <dt className="text-muted-foreground text-sm">Available for sale</dt>
                                    <dd className="text-xl font-semibold tabular-nums">
                                        {availableForSaleCurrencyEntries.length > 0
                                            ? formatTotalsByCurrency(summary.available_for_sale_by_currency || {})
                                            : '—'}
                                    </dd>
                                </div>
                                {currencyEntries.length > 0 ? (
                                    currencyEntries.map(([currency, total]) => (
                                        <div key={currency} className="flex justify-between items-baseline gap-2">
                                            <dt className="text-muted-foreground text-sm">Available value ({currency})</dt>
                                            <dd className="text-xl font-semibold tabular-nums">{formatCurrency(String(total), currency)}</dd>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex justify-between items-baseline gap-2">
                                        <dt className="text-muted-foreground text-sm">Available value</dt>
                                        <dd className="text-xl font-semibold text-muted-foreground tabular-nums">—</dd>
                                    </div>
                                )}
                            </dl>
                        </CardContent>
                    </Card>
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
                            <AlertDialogDescription>
                                This cannot be undone.
                            </AlertDialogDescription>
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

                {/* Table: search + filters and Import/Export in one row */}
                <Card className="overflow-hidden rounded-2xl border shadow-sm">
                    <CardHeader className="border-b bg-muted/30 pb-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <form
                                data-asset-filters
                                className="flex flex-wrap items-center gap-2"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    applyFilters({ page: undefined });
                                }}
                            >
                                <Input
                                    ref={searchInputRef}
                                    name="search"
                                    placeholder="Search..."
                                    defaultValue={filters.search}
                                    className="h-10 w-[180px] sm:w-[200px]"
                                />
                                <Select
                                    value={filters.category ?? 'all'}
                                    onValueChange={(v) => applyFilters({ category: v === 'all' ? undefined : v })}
                                >
                                    <SelectTrigger className="h-10 w-[160px]">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All categories</SelectItem>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={filters.status ?? 'all'}
                                    onValueChange={(v) => applyFilters({ status: v })}
                                >
                                    <SelectTrigger className="h-10 w-[160px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        {Object.entries(statusOptions).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>
                                                {v}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="submit" variant="secondary" size="sm" className="h-10 px-3">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </form>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={tenantRouter.route('assets.import')}>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Import
                                    </Link>
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <Download className="h-4 w-4 mr-2" />
                                            Export
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuItem onClick={() => handleExport('csv', false)}>
                                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                                            Current view (CSV)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExport('json', false)}>
                                            <FileJson className="h-4 w-4 mr-2" />
                                            Current view (JSON)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            disabled={!someSelected}
                                            onClick={() => handleExport('csv', false, Array.from(selectedUuids))}
                                        >
                                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                                            Selected (CSV){someSelected ? ` (${selectedUuids.size})` : ''}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            disabled={!someSelected}
                                            onClick={() => handleExport('json', false, Array.from(selectedUuids))}
                                        >
                                            <FileJson className="h-4 w-4 mr-2" />
                                            Selected (JSON){someSelected ? ` (${selectedUuids.size})` : ''}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExport('csv', true)}>
                                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                                            All assets (CSV)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExport('json', true)}>
                                            <FileJson className="h-4 w-4 mr-2" />
                                            All assets (JSON)
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleExport('csv', true, undefined, true)}>
                                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                                            Available only (CSV)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExport('json', true, undefined, true)}>
                                            <FileJson className="h-4 w-4 mr-2" />
                                            Available only (JSON)
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <AssetsTableSkeleton />
                        ) : assets.data.length === 0 ? (
                            <div className="py-12 text-center">
                                <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                <p className="mt-2 text-muted-foreground">
                                    No assets yet. Add your first asset or adjust filters.
                                </p>
                                <Button asChild className="mt-4">
                                    <Link href={tenantRouter.route('assets.create')}>Add asset</Link>
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
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
                                                <SortHeader column="name">Name / Tag</SortHeader>
                                                <SortHeader column="category">Category</SortHeader>
                                                <SortHeader column="status">Status</SortHeader>
                                                <SortHeader column="assigned_to">Assigned to</SortHeader>
                                                <th className="p-3 text-right font-medium">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSort('purchase_price')}
                                                        className="inline-flex items-center gap-1 hover:text-foreground focus:outline-none focus:underline"
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
                                                    <td className="p-3">{a.category?.name ?? '—'}</td>
                                                    <td className="p-3">
                                                        <AssetStatusBadge status={a.status} label={statusOptions[a.status]} />
                                                    </td>
                                                    <td className="p-3">
                                                        {a.assigned_to_user
                                                            ? `${a.assigned_to_user.first_name} ${a.assigned_to_user.last_name}`.trim() ||
                                                              a.assigned_to_user.email
                                                            : '—'}
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
                                    <div className="flex items-center justify-between border-t px-4 py-3">
                                        <p className="text-muted-foreground text-sm">
                                            Page {assets.current_page} of {assets.last_page} ({assets.total} total)
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={assets.current_page <= 1}
                                                onClick={() => applyFilters({ page: assets.current_page - 1 })}
                                            >
                                                <ChevronLeft className="h-4 w-4" /> Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={assets.current_page >= assets.last_page}
                                                onClick={() => applyFilters({ page: assets.current_page + 1 })}
                                            >
                                                Next <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function AssetsTableSkeleton() {
    const rows = Array.from({ length: 8 });
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b bg-muted/50">
                        <th className="w-10 p-3" />
                        <th className="p-3 text-left font-medium">Name / Tag</th>
                        <th className="p-3 text-left font-medium">Category</th>
                        <th className="p-3 text-left font-medium">Status</th>
                        <th className="p-3 text-left font-medium">Assigned to</th>
                        <th className="p-3 text-right font-medium">Value</th>
                        <th className="p-3 text-right font-medium"></th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((_, i) => (
                        <tr key={i} className="border-b last:border-0">
                            <td className="p-3">
                                <Skeleton className="h-4 w-4" />
                            </td>
                            <td className="p-3">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="mt-1 h-3 w-24" />
                            </td>
                            <td className="p-3">
                                <Skeleton className="h-4 w-24" />
                            </td>
                            <td className="p-3">
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </td>
                            <td className="p-3">
                                <Skeleton className="h-4 w-32" />
                            </td>
                            <td className="p-3 text-right">
                                <Skeleton className="ml-auto h-4 w-24" />
                            </td>
                            <td className="p-3 text-right">
                                <Skeleton className="ml-auto h-6 w-12 rounded-md" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
