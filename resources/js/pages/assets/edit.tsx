import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Camera, Package, User, Banknote, FileText, Trash2 } from 'lucide-react';
import { useRef } from 'react';

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
    disposed_reason: string | null;
    sold_at: string | null;
    sold_price: string | null;
    sold_currency: string | null;
    receipt_path: string | null;
    asset_category_id: number | null;
    assigned_to_user_id: number | null;
    depreciation_useful_life_years?: number | null;
    depreciation_salvage_value?: string | null;
    depreciation_method?: string | null;
    book_value?: number | null;
    accumulated_depreciation?: number | null;
    effective_depreciation?: { useful_life_years: number; salvage_value: number; method: string } | null;
}

interface Props {
    asset: Asset;
    categories: Category[];
    users: User[];
    statusOptions: Record<string, string>;
    conditionOptions: Record<string, string>;
    currencyOptions: Record<string, string>;
    receipt_url: string | null;
    receipt_is_image: boolean;
    photo_url: string | null;
    default_sold_currency?: string;
}

function toInputDate(d: string | null): string {
    if (!d) return '';
    const date = new Date(d);
    return date.toISOString().slice(0, 10);
}

export default function AssetsEdit({ asset, categories, users, statusOptions, conditionOptions, currencyOptions, receipt_url, receipt_is_image, photo_url, default_sold_currency = 'USD' }: Props) {
    const tenantRouter = useTenantRouter();
    const photoInputRef = useRef<HTMLInputElement>(null);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Assets', href: tenantRouter.route('assets.index') },
        { title: asset.name, href: tenantRouter.route('assets.show', { asset: asset.uuid }) },
        { title: 'Edit', href: tenantRouter.route('assets.edit', { asset: asset.uuid }) },
    ];
    const { data, setData, post, processing, errors } = useForm({
        name: asset.name,
        asset_tag: asset.asset_tag,
        asset_category_id: (asset.asset_category_id ?? '') as number | '',
        serial_number: asset.serial_number ?? '',
        description: asset.description ?? '',
        status: asset.status,
        assigned_to_user_id: (asset.assigned_to_user_id ?? '') as number | '',
        purchase_date: toInputDate(asset.purchase_date),
        purchase_price: asset.purchase_price ?? '',
        currency: asset.currency || 'USD',
        location: asset.location ?? '',
        notes: asset.notes ?? '',
        condition: (asset.condition ?? '') as string,
        disposed_reason: asset.disposed_reason ?? '',
        sold_at: asset.sold_at ? toInputDate(asset.sold_at) : '',
        sold_price: asset.sold_price ?? '',
        sold_currency: (asset.sold_currency ?? asset.currency ?? default_sold_currency) as string,
        depreciation_useful_life_years: (asset.depreciation_useful_life_years ?? '') as number | '',
        depreciation_salvage_value: asset.depreciation_salvage_value ?? '',
        receipt: null as File | null,
        remove_receipt: false,
        photo: null as File | null,
        remove_photo: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(tenantRouter.route('assets.update', { asset: asset.uuid }), {
            preserveScroll: true,
            forceFormData: true,
            method: 'put',
        });
    };

    const isDisposed = ['sold', 'gifted', 'lost', 'damaged', 'retired', 'disposed'].includes(data.status);
    const isSold = data.status === 'sold';
    const currencyOpts = { ...currencyOptions };
    if (asset.currency && !(asset.currency in currencyOpts)) {
        currencyOpts[asset.currency] = asset.currency;
    }
    const photoPreview = data.photo ? URL.createObjectURL(data.photo) : null;
    const showExistingPhoto = photo_url && !data.remove_photo && !photoPreview;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${asset.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={tenantRouter.route('assets.show', { asset: asset.uuid })}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Edit asset</h1>
                        <p className="text-muted-foreground text-sm">{asset.name} · {asset.asset_tag}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
                        {/* Device photo */}
                        <Card className="h-fit overflow-hidden border-2 border-dashed lg:border-solid lg:border lg:rounded-2xl">
                            <CardContent className="p-0">
                                <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-3 bg-muted/20 p-6 transition-colors hover:bg-muted/40">
                                    <input
                                        ref={photoInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg"
                                        className="sr-only"
                                        onChange={(e) => {
                                            setData('photo', e.target.files?.[0] ?? null);
                                            setData('remove_photo', false);
                                        }}
                                    />
                                    {photoPreview ? (
                                        <>
                                            <img src={photoPreview} alt="Preview" className="h-48 w-48 rounded-xl object-cover shadow-inner" />
                                            <span className="text-muted-foreground text-sm">Click to change</span>
                                        </>
                                    ) : showExistingPhoto ? (
                                        <>
                                            <img src={photo_url} alt="Device" className="h-48 w-48 rounded-xl object-cover shadow-inner" />
                                            <span className="text-muted-foreground text-sm">Click to replace</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setData('remove_photo', true);
                                                    setData('photo', null);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Remove photo
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                                                <Camera className="h-10 w-10 text-primary" />
                                            </div>
                                            <span className="text-center text-sm font-medium">Device photo</span>
                                            <span className="text-muted-foreground text-xs">Optional · JPG or PNG, max 5 MB</span>
                                        </>
                                    )}
                                </label>
                                {data.remove_photo && (
                                    <p className="px-4 pb-3 text-center text-muted-foreground text-xs">Photo will be removed when you save.</p>
                                )}
                            </CardContent>
                        </Card>

                        <div className="space-y-8">
                            {/* Basic info */}
                            <Card className="overflow-hidden rounded-2xl border shadow-sm">
                                <CardHeader className="border-b bg-muted/30 pb-4">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-5 w-5 text-primary" />
                                        <h2 className="font-semibold">Basic information</h2>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-5 pt-5">
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name *</Label>
                                            <Input id="name" required value={data.name} onChange={(e) => setData('name', e.target.value)} className="h-11" />
                                            {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="asset_tag">Asset tag *</Label>
                                            <Input id="asset_tag" required value={data.asset_tag} onChange={(e) => setData('asset_tag', e.target.value)} className="h-11" />
                                            {errors.asset_tag && <p className="text-destructive text-sm">{errors.asset_tag}</p>}
                                        </div>
                                    </div>
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="asset_category_id">Category</Label>
                                            <Select value={data.asset_category_id ? String(data.asset_category_id) : 'none'} onValueChange={(v) => setData('asset_category_id', v === 'none' ? '' : Number(v))}>
                                                <SelectTrigger id="asset_category_id" className="h-11">
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {categories.map((c) => (
                                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="serial_number">Serial number</Label>
                                            <Input id="serial_number" value={data.serial_number} onChange={(e) => setData('serial_number', e.target.value)} className="h-11" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={2} className="resize-none" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Status & assignment */}
                            <Card className="overflow-hidden rounded-2xl border shadow-sm">
                                <CardHeader className="border-b bg-muted/30 pb-4">
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-primary" />
                                        <h2 className="font-semibold">Status & assignment</h2>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-5 pt-5">
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status *</Label>
                                            <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                                <SelectTrigger id="status" className="h-11">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(statusOptions).map(([k, v]) => (
                                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="assigned_to_user_id">Assigned to</Label>
                                            <Select value={data.assigned_to_user_id ? String(data.assigned_to_user_id) : 'none'} onValueChange={(v) => setData('assigned_to_user_id', v === 'none' ? '' : Number(v))}>
                                                <SelectTrigger id="assigned_to_user_id" className="h-11">
                                                    <SelectValue placeholder="Select person" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Unassigned</SelectItem>
                                                    {users.map((u) => (
                                                        <SelectItem key={u.id} value={String(u.id)}>
                                                            {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.email}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="location">Location</Label>
                                            <Input id="location" value={data.location} onChange={(e) => setData('location', e.target.value)} className="h-11" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="condition">Condition</Label>
                                            <Select value={data.condition || 'none'} onValueChange={(v) => setData('condition', v === 'none' ? '' : v)}>
                                                <SelectTrigger id="condition" className="h-11">
                                                    <SelectValue placeholder="Select condition" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">—</SelectItem>
                                                    {Object.entries(conditionOptions).map(([k, v]) => (
                                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {isDisposed && (
                                        <div className="space-y-2">
                                            <Label htmlFor="disposed_reason">Disposal reason / notes</Label>
                                            <Input id="disposed_reason" value={data.disposed_reason} onChange={(e) => setData('disposed_reason', e.target.value)} className="h-11" />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Purchase & value */}
                            <Card className="overflow-hidden rounded-2xl border shadow-sm">
                                <CardHeader className="border-b bg-muted/30 pb-4">
                                    <div className="flex items-center gap-2">
                                        <Banknote className="h-5 w-5 text-primary" />
                                        <h2 className="font-semibold">Purchase & value</h2>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-5 pt-5">
                                    <div className="grid gap-5 sm:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="purchase_date">Purchase date</Label>
                                            <Input id="purchase_date" type="date" value={data.purchase_date} onChange={(e) => setData('purchase_date', e.target.value)} className="h-11" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="purchase_price">Purchase price</Label>
                                            <Input id="purchase_price" type="number" step="0.01" min="0" value={data.purchase_price} onChange={(e) => setData('purchase_price', e.target.value)} className="h-11" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="currency">Currency</Label>
                                            <Select value={data.currency} onValueChange={(v) => setData('currency', v)}>
                                                <SelectTrigger id="currency" className="h-11">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(currencyOpts).map(([code, label]) => (
                                                        <SelectItem key={code} value={code}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-3 border-t pt-4">
                                        <p className="text-muted-foreground text-sm font-medium">Depreciation override (optional)</p>
                                        <p className="text-muted-foreground text-xs">Override category defaults. Leave blank to use category settings.</p>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="depreciation_useful_life_years">Useful life (years)</Label>
                                                <Input id="depreciation_useful_life_years" type="number" min={1} max={100} placeholder="Use category default" value={data.depreciation_useful_life_years === '' ? '' : data.depreciation_useful_life_years} onChange={(e) => setData('depreciation_useful_life_years', e.target.value === '' ? '' : parseInt(e.target.value, 10))} className="h-11" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="depreciation_salvage_value">Salvage value</Label>
                                                <Input id="depreciation_salvage_value" type="number" min={0} step={0.01} placeholder="0" value={data.depreciation_salvage_value} onChange={(e) => setData('depreciation_salvage_value', e.target.value)} className="h-11" />
                                            </div>
                                        </div>
                                        {asset.effective_depreciation && (
                                            <p className="text-muted-foreground text-xs">Current effective: {asset.effective_depreciation.useful_life_years} years, salvage {asset.effective_depreciation.salvage_value} · Book value: {asset.book_value != null ? new Intl.NumberFormat(undefined, { style: 'currency', currency: asset.currency }).format(asset.book_value) : '—'}</p>
                                        )}
                                    </div>
                                    {isSold && (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                                            <p className="mb-3 text-sm font-medium text-amber-800 dark:text-amber-200">Sale details</p>
                                            <div className="grid gap-4 sm:grid-cols-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="sold_at">Sold date</Label>
                                                    <Input id="sold_at" type="date" value={data.sold_at || new Date().toISOString().slice(0, 10)} onChange={(e) => setData('sold_at', e.target.value)} className="h-11" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="sold_price">Sold price</Label>
                                                    <Input id="sold_price" type="number" step="0.01" min="0" value={data.sold_price} onChange={(e) => setData('sold_price', e.target.value)} className="h-11" placeholder="Amount received" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="sold_currency">Sold in currency</Label>
                                                    <Select value={data.sold_currency || asset.currency} onValueChange={(v) => setData('sold_currency', v)}>
                                                        <SelectTrigger id="sold_currency" className="h-11">
                                                            <SelectValue placeholder="Currency received" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Object.entries(currencyOpts).map(([code, label]) => (
                                                                <SelectItem key={code} value={code}>{label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Documents & notes */}
                            <Card className="overflow-hidden rounded-2xl border shadow-sm">
                                <CardHeader className="border-b bg-muted/30 pb-4">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <h2 className="font-semibold">Documents & notes</h2>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-5 pt-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="receipt">Receipt / document</Label>
                                        {receipt_url && (
                                            <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                                                <p className="text-muted-foreground text-sm">A receipt is on file. Upload a new file to replace it, or remove it below.</p>
                                                {receipt_is_image && (
                                                    <img src={receipt_url} alt="Current receipt" className="max-h-40 rounded border object-contain" />
                                                )}
                                                <a href={receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline" download>
                                                    {receipt_is_image ? 'Download current image' : 'Download current document'}
                                                </a>
                                                <div className="flex items-center space-x-2 pt-2">
                                                    <Checkbox id="remove_receipt" checked={data.remove_receipt} onCheckedChange={(checked) => setData('remove_receipt', !!checked)} />
                                                    <Label htmlFor="remove_receipt" className="cursor-pointer text-sm font-normal">Remove receipt (no replacement)</Label>
                                                </div>
                                            </div>
                                        )}
                                        <Input id="receipt" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setData('receipt', e.target.files?.[0] ?? null)} className="h-11" />
                                        <p className="text-muted-foreground text-xs">PDF or image, max 10 MB</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Internal notes</Label>
                                        <Textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={3} className="resize-none" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border-t pt-6">
                        <Button type="submit" disabled={processing} className="min-w-[140px]">
                            {processing ? 'Saving…' : 'Save changes'}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href={tenantRouter.route('assets.show', { asset: asset.uuid })}>Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
