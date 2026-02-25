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

interface ParentCategory {
    id: number;
    name: string;
}

interface Props {
    parentCategories: ParentCategory[];
}

export default function AssetCategoriesCreate({ parentCategories }: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Assets', href: tenantRouter.route('assets.index') },
        { title: 'Categories', href: tenantRouter.route('assets.categories.index') },
        { title: 'New category', href: tenantRouter.route('assets.categories.create') },
    ];
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        description: '',
        parent_id: '' as number | '',
        sort_order: 0,
        depreciation_useful_life_years: '' as number | '',
        depreciation_salvage_value: '' as string,
        depreciation_method: 'straight_line',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(tenantRouter.route('assets.categories.store'), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New category" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="max-w-xl space-y-6">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={tenantRouter.route('assets.categories.index')}>← Categories</Link>
                    </Button>
                    <Card>
                        <CardHeader>
                            <h1 className="text-xl font-semibold">New category</h1>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        required
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                    />
                                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">Slug (optional)</Label>
                                    <Input
                                        id="slug"
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value)}
                                        placeholder="Auto-generated from name if empty"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="parent_id">Parent category</Label>
                                    <Select
                                        value={data.parent_id ? String(data.parent_id) : 'none'}
                                        onValueChange={(v) => setData('parent_id', v === 'none' ? '' : Number(v))}
                                    >
                                        <SelectTrigger id="parent_id">
                                            <SelectValue placeholder="None" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {parentCategories.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sort_order">Sort order</Label>
                                    <Input
                                        id="sort_order"
                                        type="number"
                                        min={0}
                                        value={data.sort_order}
                                        onChange={(e) => setData('sort_order', parseInt(e.target.value, 10) || 0)}
                                    />
                                </div>
                                <div className="space-y-3 border-t pt-4">
                                    <h3 className="text-sm font-medium">Depreciation defaults (optional)</h3>
                                    <p className="text-muted-foreground text-xs">Assets in this category can use these defaults for straight-line depreciation.</p>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="depreciation_useful_life_years">Useful life (years)</Label>
                                            <Input
                                                id="depreciation_useful_life_years"
                                                type="number"
                                                min={1}
                                                max={100}
                                                placeholder="e.g. 5"
                                                value={data.depreciation_useful_life_years === '' ? '' : data.depreciation_useful_life_years}
                                                onChange={(e) => setData('depreciation_useful_life_years', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="depreciation_salvage_value">Salvage value</Label>
                                            <Input
                                                id="depreciation_salvage_value"
                                                type="number"
                                                min={0}
                                                step={0.01}
                                                placeholder="0"
                                                value={data.depreciation_salvage_value}
                                                onChange={(e) => setData('depreciation_salvage_value', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button type="submit" disabled={processing}>
                                        Create category
                                    </Button>
                                    <Button type="button" variant="outline" asChild>
                                        <Link href={tenantRouter.route('assets.categories.index')}>Cancel</Link>
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
