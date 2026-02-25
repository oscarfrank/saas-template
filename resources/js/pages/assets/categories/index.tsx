import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Plus, Search, Package, FolderTree } from 'lucide-react';

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    assets_count: number;
    totals_by_currency?: Record<string, string | number>;
    available_for_sale_count?: number;
    available_for_sale_by_currency?: Record<string, string | number>;
}

interface Props {
    categories: Category[];
    uncategorized_totals?: Record<string, string | number>;
    filters: { search?: string };
}

function formatCurrency(value: string | number | null, currency: string): string {
    if (value == null || value === '') return '—';
    const n = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(n);
}

function formatTotalsByCurrency(totals: Record<string, string | number> | undefined): string {
    if (!totals || Object.keys(totals).length === 0) return '—';
    return Object.entries(totals)
        .filter(([, v]) => Number(v) > 0)
        .map(([currency, total]) => formatCurrency(total, currency))
        .join(' · ');
}

export default function AssetCategoriesIndex({ categories, uncategorized_totals, filters }: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Assets', href: tenantRouter.route('assets.index') },
        { title: 'Categories', href: tenantRouter.route('assets.categories.index') },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Asset categories" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <h1 className="text-2xl font-semibold">Asset categories</h1>
                        <div className="flex gap-2">
                            <form
                                className="flex gap-2"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const q = (e.currentTarget.querySelector('input[name="search"]') as HTMLInputElement)?.value;
                                    tenantRouter.get('assets.categories.index', { search: q || undefined });
                                }}
                            >
                                <Input name="search" placeholder="Search categories..." defaultValue={filters.search} className="max-w-xs" />
                                <Button type="submit" variant="secondary" size="icon">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </form>
                            <Button asChild>
                                <Link href={tenantRouter.route('assets.categories.create')}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    New category
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={tenantRouter.route('assets.index')}>
                                    <Package className="h-4 w-4 mr-2" />
                                    Assets
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {categories.map((cat) => (
                            <Link key={cat.id} href={tenantRouter.route('assets.categories.show', { category: cat.id })}>
                                <Card className="h-full transition-colors hover:bg-muted/50">
                                    <CardHeader className="flex flex-row items-center gap-3 pb-2">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                            <FolderTree className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h2 className="font-semibold truncate">{cat.name}</h2>
                                            <p className="text-muted-foreground text-sm">
                                                {cat.assets_count} available item{cat.assets_count !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-muted-foreground text-sm tabular-nums">
                                            Available value: {formatTotalsByCurrency(cat.totals_by_currency)}
                                        </p>
                                        {(cat.available_for_sale_count ?? 0) > 0 && (
                                            <p className="mt-1 text-sm tabular-nums text-primary/90">
                                                Available for sale: {cat.available_for_sale_count} item{(cat.available_for_sale_count ?? 0) !== 1 ? 's' : ''}
                                                {cat.available_for_sale_by_currency && Object.keys(cat.available_for_sale_by_currency).length > 0
                                                    ? ` · ${formatTotalsByCurrency(cat.available_for_sale_by_currency)}`
                                                    : ''}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    {categories.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                No categories yet. Create one to organize your assets.
                            </CardContent>
                        </Card>
                    )}

                    <Button variant="ghost" size="sm" asChild>
                        <Link href={tenantRouter.route('assets.index')}>← Back to assets</Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
