import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AssetStatusBadge } from '@/components/asset-status-badge';
import { Search, Download, FileJson, FileSpreadsheet, Calculator, ArrowLeft } from 'lucide-react';
import { useRef } from 'react';

interface Category {
    id: number;
    name: string;
}

interface AssetRow {
    id: number;
    uuid: string;
    name: string;
    asset_tag: string;
    category: { id: number; name: string } | null;
    purchase_date: string | null;
    purchase_price: number | null;
    currency: string;
    useful_life_years: number | null;
    accumulated_depreciation: number;
    book_value: number | null;
    status: string;
}

interface CategorySummaryItem {
    total_book_value: number;
    total_accumulated_depreciation: number;
    count: number;
}

interface Props {
    assets: AssetRow[];
    categories: Category[];
    filters: { search?: string; category?: string; status?: string };
    statusOptions: Record<string, string>;
    categorySummary: Record<string, CategorySummaryItem>;
}

function formatCurrency(amount: number | null, currency: string): string {
    if (amount == null) return '—';
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(amount);
}

function formatDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString();
}

function buildExportUrl(baseUrl: string, format: 'csv' | 'json', filters: Props['filters']): string {
    const params = new URLSearchParams();
    params.set('format', format);
    if (filters.search) params.set('search', filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.status) params.set('status', filters.status);
    return `${baseUrl}?${params.toString()}`;
}

export default function AssetsAccountant({ assets, categories, filters, statusOptions, categorySummary }: Props) {
    const tenantRouter = useTenantRouter();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Assets', href: tenantRouter.route('assets.index') },
        { title: 'Depreciation & P&L', href: tenantRouter.route('assets.accountant') },
    ];
    const exportBaseUrl = tenantRouter.route('assets.accountant.export');

    const applyFilters = (extra: Record<string, string | undefined> = {}) => {
        const search = searchInputRef.current?.value?.trim();
        router.get(tenantRouter.route('assets.accountant'), {
            search: search || undefined,
            category: filters.category || undefined,
            status: filters.status || undefined,
            ...extra,
        });
    };

    const handleExport = (format: 'csv' | 'json') => {
        const url = buildExportUrl(exportBaseUrl, format, filters);
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Depreciation & P&L" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Calculator className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">Depreciation & P&L</h1>
                            <p className="text-muted-foreground text-sm">Book value, accumulated depreciation, and export for accounting.</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={tenantRouter.route('assets.index')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to assets
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <form
                        className="flex flex-wrap items-center gap-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilters();
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
                            onValueChange={(v) => applyFilters({ status: v === 'all' ? undefined : v })}
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-10">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleExport('csv')}>
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('json')}>
                                <FileJson className="h-4 w-4 mr-2" />
                                JSON
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {Object.keys(categorySummary).length > 0 && (
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-medium">Summary by category</h2>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {Object.entries(categorySummary).map(([name, s]) => (
                                    <div key={name} className="rounded-lg border bg-muted/30 p-4">
                                        <p className="font-medium">{name}</p>
                                        <p className="text-muted-foreground text-sm">{s.count} asset{s.count === 1 ? '' : 's'}</p>
                                        <p className="mt-1 text-sm">Book value: <span className="tabular-nums font-medium">{formatCurrency(s.total_book_value, 'USD')}</span></p>
                                        <p className="text-sm">Accum. depreciation: <span className="tabular-nums">{formatCurrency(s.total_accumulated_depreciation, 'USD')}</span></p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left p-3 font-medium">Name</th>
                                        <th className="text-left p-3 font-medium">Category</th>
                                        <th className="text-left p-3 font-medium">Purchase date</th>
                                        <th className="text-right p-3 font-medium">Purchase price</th>
                                        <th className="text-left p-3 font-medium">Currency</th>
                                        <th className="text-center p-3 font-medium">Useful life</th>
                                        <th className="text-right p-3 font-medium">Accum. depreciation</th>
                                        <th className="text-right p-3 font-medium">Book value</th>
                                        <th className="text-left p-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assets.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="p-8 text-center text-muted-foreground">
                                                No assets match the current filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        assets.map((a) => (
                                            <tr key={a.id} className="border-b hover:bg-muted/30">
                                                <td className="p-3">
                                                    <Link href={tenantRouter.route('assets.show', { asset: a.uuid })} className="text-primary hover:underline font-medium">
                                                        {a.name}
                                                    </Link>
                                                    <span className="text-muted-foreground block text-xs">{a.asset_tag}</span>
                                                </td>
                                                <td className="p-3">{a.category?.name ?? '—'}</td>
                                                <td className="p-3">{formatDate(a.purchase_date)}</td>
                                                <td className="p-3 text-right tabular-nums">{formatCurrency(a.purchase_price, a.currency)}</td>
                                                <td className="p-3">{a.currency}</td>
                                                <td className="p-3 text-center">{a.useful_life_years != null ? `${a.useful_life_years} yr` : '—'}</td>
                                                <td className="p-3 text-right tabular-nums">{formatCurrency(a.accumulated_depreciation, a.currency)}</td>
                                                <td className="p-3 text-right tabular-nums font-medium">{formatCurrency(a.book_value, a.currency)}</td>
                                                <td className="p-3">
                                                    <AssetStatusBadge status={a.status} label={statusOptions[a.status]} />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
