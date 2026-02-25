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
import { ArrowLeft, Camera, Package, User, Banknote, FileText } from 'lucide-react';
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

interface Props {
    categories: Category[];
    users: User[];
    statusOptions: Record<string, string>;
    conditionOptions: Record<string, string>;
    currencyOptions: Record<string, string>;
    default_currency?: string;
    default_sold_currency?: string;
    default_asset_status?: string;
}

export default function AssetsCreate({ categories, users, statusOptions, conditionOptions, currencyOptions, default_currency = 'USD', default_sold_currency, default_asset_status = 'available' }: Props) {
    const tenantRouter = useTenantRouter();
    const photoInputRef = useRef<HTMLInputElement>(null);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Assets', href: tenantRouter.route('assets.index') },
        { title: 'Add asset', href: tenantRouter.route('assets.create') },
    ];
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        asset_tag: '',
        asset_category_id: '' as number | '',
        serial_number: '',
        description: '',
        status: default_asset_status,
        assigned_to_user_id: '' as number | '',
        purchase_date: '',
        purchase_price: '',
        currency: default_currency,
        location: '',
        notes: '',
        condition: '' as string,
        disposed_reason: '',
        sold_at: '',
        sold_price: '',
        sold_currency: default_sold_currency || default_currency,
        depreciation_useful_life_years: '' as number | '',
        depreciation_salvage_value: '' as string,
        receipt: null as File | null,
        photo: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const hasFile = data.photo || data.receipt;
        post(tenantRouter.route('assets.store'), {
            preserveScroll: true,
            ...(hasFile ? { forceFormData: true } : {}),
        });
    };

    const isDisposed = ['sold', 'gifted', 'lost', 'damaged', 'retired', 'disposed'].includes(data.status);
    const isSold = data.status === 'sold';
    const photoPreview = data.photo ? URL.createObjectURL(data.photo) : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add asset" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={tenantRouter.route('assets.index')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Add asset</h1>
                        <p className="text-muted-foreground text-sm">Register a new device or item in your inventory.</p>
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
                                        onChange={(e) => setData('photo', e.target.files?.[0] ?? null)}
                                    />
                                    {photoPreview ? (
                                        <>
                                            <img src={photoPreview} alt="Preview" className="h-48 w-48 rounded-xl object-cover shadow-inner" />
                                            <span className="text-muted-foreground text-sm">Click to change</span>
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
                                            <Input id="name" required value={data.name} onChange={(e) => setData('name', e.target.value)} className="h-11" placeholder="e.g. MacBook Pro 14&quot;" />
                                            {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="asset_tag">Asset tag</Label>
                                            <Input id="asset_tag" value={data.asset_tag} onChange={(e) => setData('asset_tag', e.target.value)} className="h-11" placeholder="Leave blank to auto-generate" />
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
                                            <Input id="serial_number" value={data.serial_number} onChange={(e) => setData('serial_number', e.target.value)} className="h-11" placeholder="Optional" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={2} className="resize-none" placeholder="Brief description of the asset" />
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
                                            <Input id="location" value={data.location} onChange={(e) => setData('location', e.target.value)} className="h-11" placeholder="e.g. Office, Warehouse" />
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
                                            <Input id="disposed_reason" value={data.disposed_reason} onChange={(e) => setData('disposed_reason', e.target.value)} className="h-11" placeholder="e.g. Sold to X, Gifted to Y" />
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
                                            <Input id="purchase_price" type="number" step="0.01" min="0" value={data.purchase_price} onChange={(e) => setData('purchase_price', e.target.value)} className="h-11" placeholder="0.00" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="currency">Currency</Label>
                                            <Select value={data.currency} onValueChange={(v) => setData('currency', v)}>
                                                <SelectTrigger id="currency" className="h-11">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(currencyOptions).map(([code, label]) => (
                                                        <SelectItem key={code} value={code}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-3 border-t pt-4">
                                        <p className="text-muted-foreground text-sm font-medium">Depreciation override (optional)</p>
                                        <p className="text-muted-foreground text-xs">Override category defaults for this asset. Leave blank to use category settings or no depreciation.</p>
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
                                                    <Select value={data.sold_currency || default_currency} onValueChange={(v) => setData('sold_currency', v)}>
                                                        <SelectTrigger id="sold_currency" className="h-11">
                                                            <SelectValue placeholder="Currency received" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Object.entries(currencyOptions).map(([code, label]) => (
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
                                        <Label htmlFor="receipt">Receipt (optional)</Label>
                                        <Input id="receipt" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setData('receipt', e.target.files?.[0] ?? null)} className="h-11" />
                                        <p className="text-muted-foreground text-xs">PDF or image, max 10 MB</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Internal notes</Label>
                                        <Textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={3} className="resize-none" placeholder="Private notes about this asset" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border-t pt-6">
                        <Button type="submit" disabled={processing} className="min-w-[140px]">
                            {processing ? 'Creating…' : 'Create asset'}
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
