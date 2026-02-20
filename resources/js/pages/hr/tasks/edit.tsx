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

interface Task {
    id: number;
    uuid: string;
    title: string;
    description: string | null;
    status: string;
    priority: string | null;
    due_at: string | null;
    completed_at: string | null;
    project_id: number | null;
    assigned_to: number | null;
    script_id: number | null;
    blocked_by_task_id: number | null;
}

interface Props {
    task: Task;
    staff: { id: number; name: string }[];
    projects: { id: number; name: string }[];
    scripts: { id: number; title: string; scheduled_at: string | null }[];
    taskOptions: { id: number; uuid: string; title: string }[];
}

export default function HRTasksEdit({ task, staff, projects, scripts, taskOptions = [] }: Props) {
    const tenantRouter = useTenantRouter();
    const formatDatetime = (s: string | null) => {
        if (!s) return '';
        const d = new Date(s);
        return d.toISOString().slice(0, 16);
    };
    const { data, setData, put, processing, errors } = useForm({
        title: task.title,
        description: task.description ?? '',
        project_id: task.project_id === null ? '' : String(task.project_id),
        assigned_to: task.assigned_to === null ? '' : String(task.assigned_to),
        script_id: task.script_id === null ? '' : String(task.script_id),
        status: task.status,
        priority: task.priority ?? '',
        due_at: formatDatetime(task.due_at),
        completed_at: formatDatetime(task.completed_at),
        blocked_by_task_id: task.blocked_by_task_id === null ? '' : String(task.blocked_by_task_id),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(tenantRouter.route('hr.tasks.update', { task: task.uuid }), { preserveScroll: true });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'HR', href: tenantRouter.route('hr.staff.index') },
                { title: 'Tasks', href: tenantRouter.route('hr.tasks.index') },
                { title: task.title, href: tenantRouter.route('hr.tasks.show', { task: task.uuid }) },
                { title: 'Edit', href: '#' },
            ]}
        >
            <Head title={`Edit – ${task.title}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="max-w-2xl space-y-6">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={tenantRouter.route('hr.tasks.show', { task: task.uuid })}>← Back</Link>
                </Button>
                <Card>
                    <CardHeader>
                        <h1 className="text-xl font-semibold">Edit task</h1>
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
                                        value={data.project_id || undefined}
                                        onValueChange={(v) => setData('project_id', v || '')}
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
                                    {staff.length === 0 ? (
                                        <p className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
                                            No staff in this organization yet. Add staff from{' '}
                                            <Link href={tenantRouter.route('hr.staff.create')} className="text-primary hover:underline">
                                                HR → Staff → Add staff
                                            </Link>{' '}
                                            first; only staff members can be assigned to tasks.
                                        </p>
                                    ) : (
                                        <Select
                                            value={data.assigned_to || undefined}
                                            onValueChange={(v) => setData('assigned_to', v || '')}
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
                                <Label htmlFor="script_id">Linked script</Label>
                                <Select
                                    value={data.script_id || undefined}
                                    onValueChange={(v) => setData('script_id', v || '')}
                                >
                                    <SelectTrigger id="script_id">
                                        <SelectValue placeholder="None" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {scripts.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>{s.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="blocked_by_task_id">Blocked by</Label>
                                <Select
                                    value={data.blocked_by_task_id || undefined}
                                    onValueChange={(v) => setData('blocked_by_task_id', v || '')}
                                >
                                    <SelectTrigger id="blocked_by_task_id">
                                        <SelectValue placeholder="None – not blocked" />
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
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                        <SelectTrigger id="status">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todo">Todo</SelectItem>
                                            <SelectItem value="in_progress">In progress</SelectItem>
                                            <SelectItem value="done">Done</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
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
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="due_at">Due date</Label>
                                    <Input
                                        id="due_at"
                                        type="datetime-local"
                                        value={data.due_at}
                                        onChange={(e) => setData('due_at', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="completed_at">Completed at</Label>
                                    <Input
                                        id="completed_at"
                                        type="datetime-local"
                                        value={data.completed_at}
                                        onChange={(e) => setData('completed_at', e.target.value)}
                                    />
                                    {errors.completed_at && (
                                        <p className="text-sm text-destructive">{errors.completed_at}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button type="submit" disabled={processing}>Save</Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={tenantRouter.route('hr.tasks.show', { task: task.uuid })}>Cancel</Link>
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
