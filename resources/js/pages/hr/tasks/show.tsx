import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Pencil, CheckCircle, ShieldAlert, Link2 } from 'lucide-react';

interface BlockerTask {
    id: number;
    uuid: string;
    title: string;
    status: string;
    assignee?: { user?: { first_name: string; last_name: string } };
}

interface BlockingTask {
    id: number;
    uuid: string;
    title: string;
    status: string;
}

interface Task {
    id: number;
    uuid: string;
    title: string;
    description: string | null;
    status: string;
    priority: string | null;
    due_at: string | null;
    completed_at: string | null;
    project?: { id: number; name: string };
    assignee?: { user?: { first_name: string; last_name: string; email: string } };
    script?: { id: number; uuid?: string; title: string; scheduled_at: string | null };
    blocked_by_task?: BlockerTask | null;
    blocking_tasks?: BlockingTask[];
}

interface Props {
    task: Task;
    /** Admin: can edit, reschedule, delete this task */
    canManageTask?: boolean;
    /** Regular user: can only change status / mark complete (no edit) */
    canUpdateStatusOnly?: boolean;
}

export default function HRTasksShow({ task, canManageTask = false, canUpdateStatusOnly = false }: Props) {
    const tenantRouter = useTenantRouter();
    const { post, processing } = useForm();

    const handleComplete = () => {
        post(tenantRouter.route('hr.tasks.complete', { task: task.uuid }), { preserveScroll: true });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'HR', href: tenantRouter.route('hr.staff.index') },
                { title: 'Tasks', href: tenantRouter.route('hr.tasks.index') },
                { title: task.title, href: tenantRouter.route('hr.tasks.show', { task: task.uuid }) },
            ]}
        >
            <Head title={task.title} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={tenantRouter.route('hr.tasks.index')}>← Tasks</Link>
                    </Button>
                    <div className="flex gap-2">
                        {(canManageTask || canUpdateStatusOnly) && task.status !== 'done' && (
                            <Button variant="outline" size="sm" onClick={handleComplete} disabled={processing}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark complete
                            </Button>
                        )}
                        {canManageTask && (
                            <Button asChild>
                                <Link href={tenantRouter.route('hr.tasks.edit', { task: task.uuid })}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <h1 className="text-xl font-semibold">{task.title}</h1>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge>{task.status}</Badge>
                            {task.priority && <Badge variant="secondary">{task.priority}</Badge>}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {task.description && <p className="text-muted-foreground">{task.description}</p>}
                        <dl className="grid gap-2 sm:grid-cols-2">
                            {task.project && (
                                <>
                                    <dt className="text-muted-foreground">Project</dt>
                                    <dd>
                                        <Link
                                            href={tenantRouter.route('hr.projects.show', { project: task.project.id })}
                                            className="text-primary hover:underline"
                                        >
                                            {task.project.name}
                                        </Link>
                                    </dd>
                                </>
                            )}
                            {task.assignee?.user && (
                                <>
                                    <dt className="text-muted-foreground">Assignee</dt>
                                    <dd>
                                        {task.assignee.user.first_name} {task.assignee.user.last_name} ({task.assignee.user.email})
                                    </dd>
                                </>
                            )}
                            {task.due_at && (
                                <>
                                    <dt className="text-muted-foreground">Due</dt>
                                    <dd>{new Date(task.due_at).toLocaleString()}</dd>
                                </>
                            )}
                            {task.completed_at && (
                                <>
                                    <dt className="text-muted-foreground">Completed</dt>
                                    <dd>{new Date(task.completed_at).toLocaleString()}</dd>
                                </>
                            )}
                            {task.script && (
                                <>
                                    <dt className="text-muted-foreground">Linked script</dt>
                                    <dd>
                                        <Link
                                            href={tenantRouter.route('script.edit', { script: (task.script as { uuid?: string }).uuid ?? task.script.id })}
                                            className="text-primary hover:underline"
                                        >
                                            {task.script.title}
                                        </Link>
                                        {task.script.scheduled_at && (
                                            <span className="text-muted-foreground text-sm ml-1">
                                                (scheduled {new Date(task.script.scheduled_at).toLocaleString()})
                                            </span>
                                        )}
                                    </dd>
                                </>
                            )}
                            {task.blocked_by_task && (
                                <>
                                    <dt className="text-muted-foreground flex items-center gap-1">
                                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                                        Blocked by
                                    </dt>
                                    <dd>
                                        <Link
                                            href={tenantRouter.route('hr.tasks.show', { task: task.blocked_by_task.uuid })}
                                            className="text-primary hover:underline font-medium"
                                        >
                                            {task.blocked_by_task.title}
                                        </Link>
                                        <span className="text-muted-foreground text-sm ml-1">
                                            ({task.blocked_by_task.status}
                                            {task.blocked_by_task.assignee?.user
                                                ? ` · assigned to ${task.blocked_by_task.assignee.user.first_name} ${task.blocked_by_task.assignee.user.last_name}`
                                                : ''}
                                            )
                                        </span>
                                    </dd>
                                </>
                            )}
                            {task.blocking_tasks && task.blocking_tasks.length > 0 && (
                                <>
                                    <dt className="text-muted-foreground flex items-center gap-1">
                                        <Link2 className="h-4 w-4" />
                                        Blocking
                                    </dt>
                                    <dd className="space-y-1">
                                        {task.blocking_tasks.map((t) => (
                                            <div key={t.id}>
                                                <Link
                                                    href={tenantRouter.route('hr.tasks.show', { task: t.uuid })}
                                                    className="text-primary hover:underline text-sm"
                                                >
                                                    {t.title}
                                                </Link>
                                                <span className="text-muted-foreground text-xs ml-1">({t.status})</span>
                                            </div>
                                        ))}
                                    </dd>
                                </>
                            )}
                        </dl>
                    </CardContent>
                </Card>
                </div>
            </div>
        </AppLayout>
    );
}
