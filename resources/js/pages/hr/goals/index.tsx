import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Target, Trash2 } from 'lucide-react';

type Goal = {
    id: number;
    uuid: string;
    title: string;
    description: string | null;
    status: string;
    sort_order: number;
    updated_at: string;
};

interface Props {
    goals: Goal[];
}

export default function HrGoalsIndex({ goals }: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Goals', href: tenantRouter.route('hr.goals.index') },
    ];

    const form = useForm({
        title: '',
        description: '',
        sort_order: 0,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(tenantRouter.route('hr.goals.store'), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Organization goals" />
            <div className="mx-auto flex max-w-3xl flex-col gap-8 p-4 md:p-6">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                        <Target className="size-7" />
                        Organization goals
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Used to align worker agents and HR work with strategy.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Add goal</CardTitle>
                        <CardDescription>Active goals appear when configuring worker agents.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} required />
                                {form.errors.title && <p className="text-destructive text-sm">{form.errors.title}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    rows={3}
                                />
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
                                Add goal
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Goals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {goals.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No goals yet.</p>
                        ) : (
                            <ul className="divide-y rounded-md border">
                                {goals.map((g) => (
                                    <li key={g.uuid} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="font-medium">{g.title}</p>
                                            {g.description && <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">{g.description}</p>}
                                            <p className="text-muted-foreground mt-2 text-xs">
                                                {g.status} · order {g.sort_order}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive shrink-0"
                                            onClick={() => {
                                                if (confirm('Delete this goal?')) {
                                                    router.delete(tenantRouter.route('hr.goals.destroy', { goal: g.uuid }));
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
