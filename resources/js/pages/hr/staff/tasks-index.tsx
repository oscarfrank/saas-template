import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { ArrowLeft, ListTodo } from 'lucide-react';

interface StaffUser {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface Staff {
    id: number;
    uuid: string;
    user?: StaffUser;
}

interface Project {
    id: number;
    name: string;
}

interface TaskItem {
    id: number;
    uuid: string;
    title: string;
    status: string;
    due_at: string | null;
    project?: Project | null;
}

interface PaginatedTasks {
    data: TaskItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    staff: Staff;
    tasks: PaginatedTasks;
}

function staffName(staff: Staff): string {
    const u = staff.user;
    if (!u) return 'Staff';
    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    return name || u.email || 'Staff';
}

export default function HRStaffTasksIndex({ staff, tasks }: Props) {
    const tenantRouter = useTenantRouter();
    const name = staffName(staff);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Staff', href: tenantRouter.route('hr.staff.index') },
        { title: name, href: tenantRouter.route('hr.staff.show', { staff: staff.uuid }) },
        { title: 'Assigned tasks', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Assigned tasks – ${name}`} />
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
                <div className="mb-6 flex items-center gap-2">
                    <Link href={tenantRouter.route('hr.staff.show', { staff: staff.uuid })}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold">Assigned tasks</h1>
                        <p className="text-sm text-muted-foreground">{name}</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ListTodo className="h-4 w-4 text-muted-foreground" />
                            All assigned tasks ({tasks.total})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {tasks.data.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">No assigned tasks.</p>
                        ) : (
                            <>
                                <ul className="space-y-2">
                                    {tasks.data.map((t) => (
                                        <li key={t.id}>
                                            <Link
                                                href={tenantRouter.route('hr.tasks.show', { task: t.uuid })}
                                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-4 py-2.5 text-sm transition-colors hover:bg-muted/50"
                                            >
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-medium">{t.title}</span>
                                                    {t.project?.name && (
                                                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                                            {t.project.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {t.status}
                                                    {t.due_at ? ` · Due ${new Date(t.due_at).toLocaleDateString()}` : ''}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                                {tasks.last_page > 1 && (
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-muted/50 pt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {tasks.from ?? 0}–{tasks.to ?? 0} of {tasks.total}
                                        </p>
                                        <div className="flex gap-1">
                                            {tasks.links.map((link, i) => (
                                                <Button
                                                    key={i}
                                                    variant={link.active ? 'secondary' : 'outline'}
                                                    size="sm"
                                                    disabled={!link.url}
                                                    asChild={!!link.url && !link.active}
                                                >
                                                    {link.url && !link.active ? (
                                                        <Link href={link.url}>{link.label}</Link>
                                                    ) : (
                                                        <span>{link.label}</span>
                                                    )}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
