import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowLeft, Settings, Coins, LayoutDashboard, Package, Save, Trash2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { router } from '@inertiajs/react';

interface Props {
    settings: {
        asset_tag_prefix: string;
        default_currency: string;
        default_sold_currency?: string | null;
        default_status_filter?: string | null;
        default_asset_status?: string | null;
        items_per_page?: number | null;
    };
    currencyOptions: Record<string, string>;
    statusOptions: Record<string, string>;
    total_assets?: number;
}

function ClearAllAssetsDialog({
    totalAssets,
    tenantRouter,
}: {
    totalAssets: number;
    tenantRouter: ReturnType<typeof useTenantRouter>;
}) {
    const [confirmText, setConfirmText] = useState('');
    const [open, setOpen] = useState(false);
    const isConfirmed = confirmText === 'DELETE';

    const handleClear = () => {
        if (!isConfirmed) return;
        router.post(tenantRouter.route('assets.clear-all'), { confirm: 'DELETE' }, {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                setConfirmText('');
                toast.success(totalAssets === 1 ? '1 asset deleted.' : `${totalAssets} assets deleted.`);
            },
            onError: () => toast.error('Something went wrong.'),
        });
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setConfirmText(''); }}>
            <DialogTrigger asChild>
                <Button type="button" variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Clear all assets {totalAssets > 0 ? `(${totalAssets})` : ''}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Clear all assets</DialogTitle>
                    <DialogDescription>
                        This will permanently delete all {totalAssets} asset{totalAssets !== 1 ? 's' : ''}. Categories will remain. This cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="clear-confirm">Type <strong>DELETE</strong> to confirm</Label>
                    <Input
                        id="clear-confirm"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="DELETE"
                        className="font-mono"
                        autoComplete="off"
                    />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="button" variant="destructive" disabled={!isConfirmed} onClick={handleClear}>
                        Delete all assets
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function AssetSettingsIndex({ settings, currencyOptions, statusOptions, total_assets = 0 }: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Assets', href: tenantRouter.route('assets.index') },
        { title: 'Settings', href: tenantRouter.route('assets.settings.index') },
    ];
    const { data, setData, put, transform, processing, errors } = useForm({
        asset_tag_prefix: settings.asset_tag_prefix || 'AST',
        default_currency: settings.default_currency || 'USD',
        default_sold_currency: settings.default_sold_currency ?? settings.default_currency ?? 'USD',
        default_status_filter: settings.default_status_filter ?? 'all',
        default_asset_status: settings.default_asset_status ?? 'available',
        items_per_page: String(settings.items_per_page ?? 15),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((payload) => ({
            ...payload,
            default_status_filter: payload.default_status_filter === 'all' ? '' : payload.default_status_filter,
        }));
        put(tenantRouter.route('assets.settings.update'), {
            preserveScroll: true,
            onSuccess: () => toast.success('Settings saved'),
            onError: () => toast.error('Something went wrong. Please try again.'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Asset settings" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={tenantRouter.route('assets.index')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                            <Settings className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">Asset settings</h1>
                            <p className="text-muted-foreground text-sm">Defaults for IDs, currencies, dashboard, and new assets.</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <Card className="overflow-hidden rounded-2xl border shadow-sm">
                        <CardHeader className="border-b bg-muted/30 pb-4">
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                <h2 className="font-semibold">Asset ID</h2>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-5">
                            <div className="space-y-2">
                                <Label htmlFor="asset_tag_prefix">Prefix</Label>
                                <Input
                                    id="asset_tag_prefix"
                                    value={data.asset_tag_prefix}
                                    onChange={(e) => setData('asset_tag_prefix', e.target.value)}
                                    placeholder="e.g. AST, LAP, OFF"
                                    className="h-11 max-w-xs"
                                />
                                <p className="text-muted-foreground text-xs">
                                    New assets get IDs like <span className="font-medium text-foreground">{data.asset_tag_prefix || 'AST'}-0001</span>. Letters and numbers only; a dash is added automatically.
                                </p>
                                {errors.asset_tag_prefix && <p className="text-destructive text-sm">{errors.asset_tag_prefix}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden rounded-2xl border shadow-sm">
                        <CardHeader className="border-b bg-muted/30 pb-4">
                            <div className="flex items-center gap-2">
                                <Coins className="h-5 w-5 text-primary" />
                                <h2 className="font-semibold">Currencies</h2>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-6 pt-5 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="default_currency">Default currency</Label>
                                <Select value={data.default_currency} onValueChange={(v) => setData('default_currency', v)}>
                                    <SelectTrigger id="default_currency" className="h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(currencyOptions).map(([code, label]) => (
                                            <SelectItem key={code} value={code}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-muted-foreground text-xs">Used for purchase price when creating new assets.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="default_sold_currency">Default sold currency</Label>
                                <Select value={data.default_sold_currency} onValueChange={(v) => setData('default_sold_currency', v)}>
                                    <SelectTrigger id="default_sold_currency" className="h-11">
                                        <SelectValue placeholder="Same or choose" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(currencyOptions).map(([code, label]) => (
                                            <SelectItem key={code} value={code}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-muted-foreground text-xs">Pre-selected when marking an asset as sold (e.g. NGN if you sell locally).</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden rounded-2xl border shadow-sm">
                        <CardHeader className="border-b bg-muted/30 pb-4">
                            <div className="flex items-center gap-2">
                                <LayoutDashboard className="h-5 w-5 text-primary" />
                                <h2 className="font-semibold">Assets dashboard</h2>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-6 pt-5 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="default_status_filter">Default status filter</Label>
                                <Select value={data.default_status_filter} onValueChange={(v) => setData('default_status_filter', v)}>
                                    <SelectTrigger id="default_status_filter" className="h-11">
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        {Object.entries(statusOptions).map(([code, label]) => (
                                            <SelectItem key={code} value={code}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-muted-foreground text-xs">Filter applied when you open the assets list (e.g. Available to focus on active items).</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="items_per_page">Items per page</Label>
                                <Select value={data.items_per_page} onValueChange={(v) => setData('items_per_page', v)}>
                                    <SelectTrigger id="items_per_page" className="h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-muted-foreground text-xs">Number of assets per page on the list.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden rounded-2xl border shadow-sm">
                        <CardHeader className="border-b bg-muted/30 pb-4">
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                <h2 className="font-semibold">New assets</h2>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <div className="max-w-sm space-y-2">
                                <Label htmlFor="default_asset_status">Default status</Label>
                                <Select value={data.default_asset_status} onValueChange={(v) => setData('default_asset_status', v)}>
                                    <SelectTrigger id="default_asset_status" className="h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(statusOptions).map(([code, label]) => (
                                            <SelectItem key={code} value={code}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-muted-foreground text-xs">Pre-selected when creating a new asset (e.g. Available, In use).</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Danger zone */}
                    <Card className="overflow-hidden rounded-2xl border-destructive/50 border shadow-sm">
                        <CardHeader className="border-b border-destructive/20 bg-destructive/5 pb-4">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                <h2 className="font-semibold text-destructive">Danger zone</h2>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <p className="text-muted-foreground text-sm mb-4">
                                Permanently delete all assets in this tenant. Categories are not deleted. This cannot be undone.
                            </p>
                            <ClearAllAssetsDialog totalAssets={total_assets} tenantRouter={tenantRouter} />
                        </CardContent>
                    </Card>

                    <div className="flex flex-wrap items-center gap-3 border-t pt-6">
                        <Button type="submit" disabled={processing} className="min-w-[140px]">
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving…' : 'Save settings'}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href={tenantRouter.route('assets.index')}>Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
