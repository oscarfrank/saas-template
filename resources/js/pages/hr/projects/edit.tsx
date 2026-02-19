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

interface Project {
    id: number;
    name: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    status: string;
    owner_id: number | null;
}

interface Props {
    project: Project;
    staff: StaffOption[];
}

export default function HRProjectsEdit({ project, staff }: Props) {
    const tenantRouter = useTenantRouter();
    const { data, setData, put, processing } = useForm({
        name: project.name,
        description: project.description ?? '',
        start_date: project.start_date ?? '',
        end_date: project.end_date ?? '',
        status: project.status,
        owner_id: project.owner_id === null ? '' : String(project.owner_id),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(tenantRouter.route('hr.projects.update', { project: project.id }), {
            preserveScroll: true,
            data: {
                ...data,
                owner_id: data.owner_id === '' ? null : Number(data.owner_id),
            },
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'HR', href: tenantRouter.route('hr.staff.index') },
                { title: 'Projects', href: tenantRouter.route('hr.projects.index') },
                { title: project.name, href: tenantRouter.route('hr.projects.show', { project: project.id }) },
                { title: 'Edit', href: '#' },
            ]}
        >
            <Head title={`Edit – ${project.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="max-w-2xl space-y-6">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={tenantRouter.route('hr.projects.show', { project: project.id })}>← Back</Link>
                </Button>
                <Card>
                    <CardHeader>
                        <h1 className="text-xl font-semibold">Edit project</h1>
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
                                <Label htmlFor="status">Status</Label>
                                <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                    <SelectTrigger id="status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="on_hold">On hold</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="owner_id">Owner</Label>
                                <Select
                                    value={data.owner_id || undefined}
                                    onValueChange={(v) => setData('owner_id', v || '')}
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
                                <Button type="submit" disabled={processing}>Save</Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={tenantRouter.route('hr.projects.show', { project: project.id })}>Cancel</Link>
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
