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

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    parent_id: number | null;
    sort_order: number;
    depreciation_useful_life_years: number | null;
    depreciation_salvage_value: string | null;
    depreciation_method: string | null;
}

interface ParentCategory {
    id: number;
    name: string;
}

interface Props {
    category: Category;
    parentCategories: ParentCategory[];
}

export default function AssetCategoriesEdit({ category, parentCategories }: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Assets', href: tenantRouter.route('assets.index') },
        { title: 'Categories', href: tenantRouter.route('assets.categories.index') },
        { title: category.name, href: tenantRouter.route('assets.categories.show', { category: category.id }) },
        { title: 'Edit', href: tenantRouter.route('assets.categories.edit', { category: category.id }) },
    ];
    const { data, setData, put, processing, errors } = useForm({
        name: category.name,
        slug: category.slug,
        description: category.description ?? '',
        parent_id: (category.parent_id ?? '') as number | '',
        sort_order: category.sort_order,
        depreciation_useful_life_years: (category.depreciation_useful_life_years ?? '') as number | '',
        depreciation_salvage_value: category.depreciation_salvage_value ?? '',
        depreciation_method: category.depreciation_method ?? 'straight_line',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(tenantRouter.route('assets.categories.update', { category: category.id }), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${category.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="max-w-xl space-y-6">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={tenantRouter.route('assets.categories.show', { category: category.id })}>← Back to category</Link>
                    </Button>
                    <Card>
                        <CardHeader>
                            <h1 className="text-xl font-semibold">Edit category</h1>
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
                                    <Label htmlFor="slug">Slug</Label>
                                    <Input
                                        id="slug"
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value)}
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
                                        Save changes
                                    </Button>
                                    <Button type="button" variant="outline" asChild>
                                        <Link href={tenantRouter.route('assets.categories.show', { category: category.id })}>Cancel</Link>
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
