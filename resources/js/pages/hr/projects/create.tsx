import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface StaffOption {
    id: number;
    name: string;
}

interface Props {
    staff: StaffOption[];
}

export default function HRProjectsCreate({ staff }: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Projects', href: tenantRouter.route('hr.projects.index') },
        { title: 'New project', href: tenantRouter.route('hr.projects.create') },
    ];
    const { data, setData, post, processing } = useForm({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'active',
        owner_id: '' as number | '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(tenantRouter.route('hr.projects.store'), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New project" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="max-w-2xl space-y-6">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={tenantRouter.route('hr.projects.index')}>← Projects</Link>
                </Button>
                <Card>
                    <CardHeader>
                        <h1 className="text-xl font-semibold">New project</h1>
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
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="start_date">Start date</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={data.start_date}
                                        onChange={(e) => setData('start_date', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_date">End date</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="owner_id">Owner</Label>
                                <Select
                                    value={data.owner_id === '' ? undefined : String(data.owner_id)}
                                    onValueChange={(v) => setData('owner_id', v === '' ? '' : Number(v))}
                                >
                                    <SelectTrigger id="owner_id">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {staff.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button type="submit" disabled={processing}>Create</Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={tenantRouter.route('hr.projects.index')}>Cancel</Link>
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
