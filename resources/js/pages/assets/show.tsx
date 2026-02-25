import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AssetStatusBadge } from '@/components/asset-status-badge';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Pencil, Trash2, Package, FileText } from 'lucide-react';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface EffectiveDepreciation {
    useful_life_years: number;
    salvage_value: number;
    method: string;
}

interface Asset {
    id: number;
    uuid: string;
    name: string;
    asset_tag: string;
    serial_number: string | null;
    description: string | null;
    status: string;
    purchase_date: string | null;
    purchase_price: string | null;
    currency: string;
    location: string | null;
    notes: string | null;
    condition: string | null;
    disposed_at: string | null;
    disposed_reason: string | null;
    sold_at: string | null;
    sold_price: string | null;
    sold_currency: string | null;
    category?: { id: number; name: string; slug: string } | null;
    assigned_to_user?: User | null;
    book_value?: number | null;
    accumulated_depreciation?: number | null;
    effective_depreciation?: EffectiveDepreciation | null;
}

interface Props {
    asset: Asset;
    statusOptions: Record<string, string>;
    conditionOptions: Record<string, string>;
    receipt_url: string | null;
    receipt_is_image: boolean;
    photo_url: string | null;
}

function formatCurrency(amount: string | null, currency: string): string {
    if (amount == null || amount === '') return '—';
    const n = parseFloat(amount);
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(n);
}

function formatDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString();
}

export default function AssetShow({ asset, statusOptions, conditionOptions, receipt_url, receipt_is_image, photo_url }: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Assets', href: tenantRouter.route('assets.index') },
        { title: asset.name, href: tenantRouter.route('assets.show', { asset: asset.uuid }) },
    ];
    const assignedName = asset.assigned_to_user
        ? `${asset.assigned_to_user.first_name} ${asset.assigned_to_user.last_name}`.trim() || asset.assigned_to_user.email
        : null;
    const isDisposed = ['sold', 'gifted', 'lost', 'damaged', 'retired', 'disposed'].includes(asset.status);
    const isSold = asset.status === 'sold';
    const soldOnDate = isSold && (asset.sold_at || asset.disposed_at);

    const handleDelete = () => {
        if (window.confirm('Delete this asset? This cannot be undone.')) {
            router.delete(tenantRouter.route('assets.destroy', { asset: asset.uuid }), {
                preserveScroll: true,
                onSuccess: () => router.visit(tenantRouter.route('assets.index')),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={asset.name} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="max-w-3xl space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            {photo_url ? (
                                <img src={photo_url} alt="" className="h-16 w-16 rounded-xl object-cover shadow-sm" />
                            ) : (
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                    <Package className="h-8 w-8 text-primary" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-semibold">{asset.name}</h1>
                                <p className="text-muted-foreground text-sm">{asset.asset_tag}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={tenantRouter.route('assets.edit', { asset: asset.uuid })}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-medium">Details</h2>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <AssetStatusBadge status={asset.status} label={statusOptions[asset.status]} />
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Category</span>
                                    <span>{asset.category?.name ?? '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Serial number</span>
                                    <span>{asset.serial_number ?? '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Assigned to</span>
                                    <span>{assignedName ?? '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Condition</span>
                                    <span>{asset.condition ? (conditionOptions[asset.condition] ?? asset.condition) : '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Location</span>
                                    <span>{asset.location ?? '—'}</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-medium">Value</h2>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Purchase date</span>
                                    <span>{formatDate(asset.purchase_date)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Purchase price</span>
                                    <span className="tabular-nums">{formatCurrency(asset.purchase_price, asset.currency)}</span>
                                </div>
                                {isSold && soldOnDate && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Sold on</span>
                                        <span>{formatDate(asset.sold_at || asset.disposed_at)}</span>
                                    </div>
                                )}
                                {isSold && asset.sold_price != null && asset.sold_price !== '' && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Sold price</span>
                                        <span className="tabular-nums">{formatCurrency(asset.sold_price, asset.sold_currency ?? asset.currency)}</span>
                                    </div>
                                )}
                                {asset.effective_depreciation && (
                                    <>
                                        <div className="flex justify-between border-t pt-2 mt-2">
                                            <span className="text-muted-foreground">Accumulated depreciation</span>
                                            <span className="tabular-nums">{formatCurrency(String(asset.accumulated_depreciation ?? 0), asset.currency)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Book value</span>
                                            <span className="tabular-nums font-medium">{formatCurrency(asset.book_value != null ? String(asset.book_value) : null, asset.currency)}</span>
                                        </div>
                                        <p className="text-muted-foreground text-xs">Useful life: {asset.effective_depreciation.useful_life_years} years · Straight-line</p>
                                    </>
                                )}
                                {isDisposed && (
                                    <>
                                        {!isSold && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Disposed at</span>
                                                <span>{asset.disposed_at ? formatDate(asset.disposed_at) : '—'}</span>
                                            </div>
                                        )}
                                        {asset.disposed_reason && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Disposal reason</span>
                                                <span>{asset.disposed_reason}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {receipt_url && (
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-medium">Receipt / document</h2>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {receipt_is_image ? (
                                    <div className="rounded-lg border bg-muted/30 overflow-hidden">
                                        <img
                                            src={receipt_url}
                                            alt="Receipt"
                                            className="max-h-96 w-full object-contain"
                                        />
                                    </div>
                                ) : null}
                                <a
                                    href={receipt_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                                    download
                                >
                                    <FileText className="h-4 w-4" />
                                    {receipt_is_image ? 'Download image' : 'Download document'}
                                </a>
                            </CardContent>
                        </Card>
                    )}

                    {(asset.description || asset.notes) && (
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-medium">Notes</h2>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {asset.description && (
                                    <div>
                                        <span className="text-muted-foreground block font-medium">Description</span>
                                        <p className="mt-1 whitespace-pre-wrap">{asset.description}</p>
                                    </div>
                                )}
                                {asset.notes && (
                                    <div>
                                        <span className="text-muted-foreground block font-medium">Internal notes</span>
                                        <p className="mt-1 whitespace-pre-wrap">{asset.notes}</p>
                                    </div>
                                )}
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
