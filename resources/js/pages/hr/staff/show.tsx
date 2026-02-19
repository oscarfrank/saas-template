import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Pencil, ListTodo, FolderKanban } from 'lucide-react';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface Staff {
    id: number;
    user_id: number;
    employee_id: string | null;
    department: string | null;
    job_title: string | null;
    salary: string | null;
    salary_currency: string;
    pay_frequency: string | null;
    started_at: string | null;
    ended_at: string | null;
    user?: User;
    assigned_tasks?: { id: number; uuid: string; title: string; status: string; due_at: string | null }[];
    owned_projects?: { id: number; name: string }[];
}

interface Props {
    staff: Staff;
}

export default function HRStaffShow({ staff }: Props) {
    const tenantRouter = useTenantRouter();
    const name = staff.user
        ? `${staff.user.first_name || ''} ${staff.user.last_name || ''}`.trim() || staff.user.email
        : `Staff #${staff.id}`;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'HR', href: tenantRouter.route('hr.staff.index') },
                { title: 'Staff', href: tenantRouter.route('hr.staff.index') },
                { title: name, href: '#' },
            ]}
        >
            <Head title={`Staff – ${name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={tenantRouter.route('hr.staff.index')}>← Staff</Link>
                    </Button>
                    <Button asChild>
                        <Link href={tenantRouter.route('hr.staff.edit', { staff: staff.id })}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </Link>
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <h1 className="text-xl font-semibold">{name}</h1>
                        {staff.user?.email && (
                            <p className="text-muted-foreground">{staff.user.email}</p>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <dl className="grid gap-3 sm:grid-cols-2">
                            {staff.employee_id && (
                                <>
                                    <dt className="text-muted-foreground">Employee ID</dt>
                                    <dd>{staff.employee_id}</dd>
                                </>
                            )}
                            {staff.department && (
                                <>
                                    <dt className="text-muted-foreground">Department</dt>
                                    <dd>{staff.department}</dd>
                                </>
                            )}
                            {staff.job_title && (
                                <>
                                    <dt className="text-muted-foreground">Job title</dt>
                                    <dd>{staff.job_title}</dd>
                                </>
                            )}
                            {staff.salary != null && (
                                <>
                                    <dt className="text-muted-foreground">Salary</dt>
                                    <dd>
                                        {staff.salary_currency} {Number(staff.salary).toLocaleString()}
                                        {staff.pay_frequency && ` (${staff.pay_frequency})`}
                                    </dd>
                                </>
                            )}
                            {staff.started_at && (
                                <>
                                    <dt className="text-muted-foreground">Start date</dt>
                                    <dd>{staff.started_at}</dd>
                                </>
                            )}
                            {staff.ended_at && (
                                <>
                                    <dt className="text-muted-foreground">End date</dt>
                                    <dd>{staff.ended_at}</dd>
                                </>
                            )}
                        </dl>
                    </CardContent>
                </Card>
                {staff.assigned_tasks && staff.assigned_tasks.length > 0 && (
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-medium">Assigned tasks</h2>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {staff.assigned_tasks.map((t) => (
                                    <li key={t.id} className="flex items-center justify-between">
                                        <Link
                                            href={tenantRouter.route('hr.tasks.show', { task: t.uuid })}
                                            className="text-primary hover:underline"
                                        >
                                            {t.title}
                                        </Link>
                                        <span className="text-muted-foreground text-sm">
                                            {t.status} {t.due_at ? `· Due ${t.due_at}` : ''}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
                {staff.owned_projects && staff.owned_projects.length > 0 && (
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-medium">Projects (owner)</h2>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {staff.owned_projects.map((p) => (
                                    <li key={p.id}>
                                        <Link
                                            href={tenantRouter.route('hr.projects.show', { project: p.id })}
                                            className="text-primary hover:underline"
                                        >
                                            {p.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}
                </div>
            </div>
        </AppLayout>
    );
}
