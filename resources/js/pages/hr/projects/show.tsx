import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Pencil, Plus } from 'lucide-react';

interface Project {
    id: number;
    name: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    status: string;
    owner?: { user?: { first_name: string; last_name: string } };
    tasks?: { id: number; uuid: string; title: string; status: string; due_at: string | null; assignee?: { user?: { first_name: string; last_name: string } } }[];
}

interface Props {
    project: Project;
}

export default function HRProjectsShow({ project }: Props) {
    const tenantRouter = useTenantRouter();

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'HR', href: tenantRouter.route('hr.staff.index') },
                { title: 'Projects', href: tenantRouter.route('hr.projects.index') },
                { title: project.name, href: tenantRouter.route('hr.projects.show', { project: project.id }) },
            ]}
        >
            <Head title={project.name} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={tenantRouter.route('hr.projects.index')}>← Projects</Link>
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={tenantRouter.route('hr.tasks.create') + '?project_id=' + project.id}>
                                <Plus className="h-4 w-4 mr-2" /> Add task
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={tenantRouter.route('hr.projects.edit', { project: project.id })}>
                                <Pencil className="h-4 w-4 mr-2" /> Edit
                            </Link>
                        </Button>
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <h1 className="text-xl font-semibold">{project.name}</h1>
                        <div className="flex items-center gap-2">
                            <Badge>{project.status}</Badge>
                            {project.owner?.user && (
                                <span className="text-muted-foreground text-sm">
                                    Owner: {project.owner.user.first_name} {project.owner.user.last_name}
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {project.description && <p className="text-muted-foreground">{project.description}</p>}
                        <dl className="grid gap-2 sm:grid-cols-2">
                            {project.start_date && (
                                <>
                                    <dt className="text-muted-foreground">Start date</dt>
                                    <dd>{project.start_date}</dd>
                                </>
                            )}
                            {project.end_date && (
                                <>
                                    <dt className="text-muted-foreground">End date</dt>
                                    <dd>{project.end_date}</dd>
                                </>
                            )}
                        </dl>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-medium">Tasks</h2>
                    </CardHeader>
                    <CardContent>
                        {!project.tasks || project.tasks.length === 0 ? (
                            <p className="text-muted-foreground py-4 text-center">No tasks in this project.</p>
                        ) : (
                            <ul className="space-y-2">
                                {project.tasks.map((t) => (
                                    <li key={t.id} className="flex items-center justify-between rounded border p-3">
                                        <div>
                                            <Link
                                                href={tenantRouter.route('hr.tasks.show', { task: t.uuid })}
                                                className="font-medium hover:underline"
                                            >
                                                {t.title}
                                            </Link>
                                            <p className="text-muted-foreground text-sm">
                                                {t.assignee?.user
                                                    ? `${t.assignee.user.first_name} ${t.assignee.user.last_name}`
                                                    : 'Unassigned'}
                                                {t.due_at ? ` · Due ${t.due_at}` : ''}
                                            </p>
                                        </div>
                                        <Badge variant="secondary">{t.status}</Badge>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
                </div>
            </div>
        </AppLayout>
    );
}
