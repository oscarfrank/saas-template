import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Building2, Trash2 } from 'lucide-react';

type Department = {
    id: number;
    uuid: string;
    name: string;
    slug: string;
    sort_order: number;
    is_active: boolean;
    updated_at: string;
};

interface Props {
    departments: Department[];
}

export default function HrDepartmentsIndex({ departments }: Props) {
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.success, flash?.error]);

    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Departments', href: tenantRouter.route('hr.departments.index') },
    ];

    const form = useForm({
        name: '',
        sort_order: 0,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(tenantRouter.route('hr.departments.store'), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Departments" />
            <div className="mx-auto flex max-w-3xl flex-col gap-8 p-4 md:p-6">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                        <Building2 className="size-7" />
                        Departments
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Used for staff and worker agent seats. One catalog per organization.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Add department</CardTitle>
                        <CardDescription>Active departments appear in staff and worker agent forms.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
                                {form.errors.name && <p className="text-destructive text-sm">{form.errors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sort_order">Sort order</Label>
                                <Input
                                    id="sort_order"
                                    type="number"
                                    min={0}
                                    value={form.data.sort_order}
                                    onChange={(e) => form.setData('sort_order', Number(e.target.value))}
                                />
                            </div>
                            <Button type="submit" disabled={form.processing}>
                                Add department
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Catalog</CardTitle>
                        <CardDescription>Rename or reorder by deleting and re-adding, or extend the UI later with inline edit.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {departments.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No departments yet.</p>
                        ) : (
                            <ul className="divide-y rounded-md border">
                                {departments.map((d) => (
                                    <li key={d.uuid} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="font-medium">{d.name}</p>
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                slug: {d.slug} · order {d.sort_order}{' '}
                                                {d.is_active ? <Badge variant="outline">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive shrink-0"
                                            onClick={() => {
                                                if (confirm('Delete this department? Staff must be reassigned first.')) {
                                                    router.delete(tenantRouter.route('hr.departments.destroy', { department: d.uuid }), {
                                                        preserveScroll: true,
                                                    });
                                                }
                                            }}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
