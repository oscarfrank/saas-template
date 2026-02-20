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

interface Props {
    staff: { id: number; name: string }[];
    projects: { id: number; name: string }[];
    scripts: { id: number; title: string; scheduled_at: string | null }[];
    taskOptions: { id: number; uuid: string; title: string }[];
    tasksView?: 'all' | 'mine';
    currentStaffId?: number | null;
}

export default function HRTasksCreate({ staff, projects, scripts, taskOptions = [], tasksView = 'all', currentStaffId = null }: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Tasks', href: tenantRouter.route('hr.tasks.index') },
        { title: 'New task', href: tenantRouter.route('hr.tasks.create') },
    ];
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const projectId = urlParams.get('project_id');

    const { data, setData, post, processing } = useForm({
        title: '',
        description: '',
        project_id: projectId ? Number(projectId) : ('' as number | ''),
        assigned_to: '' as number | '',
        script_id: '' as number | '',
        blocked_by_task_id: '' as number | '',
        status: 'todo',
        priority: '',
        due_at: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(tenantRouter.route('hr.tasks.store'), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New task" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="max-w-2xl space-y-6">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={tenantRouter.route('hr.tasks.index')}>← Tasks</Link>
                </Button>
                <Card>
                    <CardHeader>
                        <h1 className="text-xl font-semibold">New task</h1>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    required
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
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
                                    <Label htmlFor="project_id">Project</Label>
                                    <Select
                                        value={data.project_id === '' ? undefined : String(data.project_id)}
                                        onValueChange={(v) => setData('project_id', v === '' ? '' : Number(v))}
                                    >
                                        <SelectTrigger id="project_id">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projects.map((p) => (
                                                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="assigned_to">Assign to</Label>
                                    {tasksView === 'mine' ? (
                                        <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
                                            This task will be assigned to you.
                                        </p>
                                    ) : staff.length === 0 ? (
                                        <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
                                            No staff in this organization yet. Add staff from{' '}
                                            <Link href={tenantRouter.route('hr.staff.create')} className="text-primary hover:underline">
                                                HR → Staff → Add staff
                                            </Link>{' '}
                                            first; only staff members can be assigned to tasks.
                                        </p>
                                    ) : (
                                        <Select
                                            value={data.assigned_to === '' ? undefined : String(data.assigned_to)}
                                            onValueChange={(v) => setData('assigned_to', v === '' ? '' : Number(v))}
                                        >
                                            <SelectTrigger id="assigned_to">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {staff.map((s) => (
                                                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="script_id">Linked script (optional)</Label>
                                <Select
                                    value={data.script_id === '' ? undefined : String(data.script_id)}
                                    onValueChange={(v) => setData('script_id', v === '' ? '' : Number(v))}
                                >
                                    <SelectTrigger id="script_id">
                                        <SelectValue placeholder="None" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {scripts.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.title} {s.scheduled_at ? `(scheduled ${s.scheduled_at})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="blocked_by_task_id">Blocked by (optional)</Label>
                                <Select
                                    value={data.blocked_by_task_id === '' ? undefined : String(data.blocked_by_task_id)}
                                    onValueChange={(v) => setData('blocked_by_task_id', v === '' ? '' : Number(v))}
                                >
                                    <SelectTrigger id="blocked_by_task_id">
                                        <SelectValue placeholder="None – this task is not blocked" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {taskOptions.map((t) => (
                                            <SelectItem key={t.id} value={String(t.id)}>{t.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-muted-foreground text-xs">This task cannot be completed until the selected task is done.</p>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select
                                        value={data.priority || undefined}
                                        onValueChange={(v) => setData('priority', v)}
                                    >
                                        <SelectTrigger id="priority">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="due_at">Due date</Label>
                                    <Input
                                        id="due_at"
                                        type="datetime-local"
                                        value={data.due_at}
                                        onChange={(e) => setData('due_at', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button type="submit" disabled={processing}>Create</Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={tenantRouter.route('hr.tasks.index')}>Cancel</Link>
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
