import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Plus, Search, Users, FolderKanban, ListTodo, DollarSign, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface StaffRecord {
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
}

interface Member {
    user: User;
    staff: StaffRecord | null;
}

interface Props {
    members: Member[];
    pagination: { current_page: number; last_page: number; per_page: number; total: number };
    filters: { search?: string };
}

export default function HRStaffIndex({ members, pagination, filters }: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Staff', href: tenantRouter.route('hr.staff.index') },
    ];
    const name = (u: User) => `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="HR – Staff" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold">Staff</h1>
                    <div className="flex items-center gap-2">
                        <form
                            method="get"
                            action={tenantRouter.route('hr.staff.index')}
                            className="flex gap-2"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                const q = (form.querySelector('input[name="search"]') as HTMLInputElement)?.value;
                                tenantRouter.get('hr.staff.index', { search: q || undefined, ...filters });
                            }}
                        >
                            <Input
                                name="search"
                                placeholder="Search staff..."
                                defaultValue={filters.search}
                                className="max-w-xs"
                            />
                            <Button type="submit" variant="secondary" size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                        </form>
                        <Button asChild>
                            <Link href={tenantRouter.route('hr.staff.create')}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add HR details
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
                        <Link href={tenantRouter.route('hr.staff.index')}>
                            <Users className="h-6 w-6" />
                            <span>Staff</span>
                        </Link>
                    </Button>
                    <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
                        <Link href={tenantRouter.route('hr.projects.index')}>
                            <FolderKanban className="h-6 w-6" />
                            <span>Projects</span>
                        </Link>
                    </Button>
                    <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
                        <Link href={tenantRouter.route('hr.tasks.index')}>
                            <ListTodo className="h-6 w-6" />
                            <span>Tasks</span>
                        </Link>
                    </Button>
                    <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
                        <Link href={tenantRouter.route('hr.payments.index')}>
                            <DollarSign className="h-6 w-6" />
                            <span>Payments</span>
                        </Link>
                    </Button>
                    <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
                        <Link href={tenantRouter.route('hr.evaluations.index')}>
                            <Star className="h-6 w-6" />
                            <span>Evaluations</span>
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-medium">Organization members</h2>
                        <p className="text-muted-foreground text-sm">
                            Everyone in the organization appears here. Add HR details (department, salary, etc.) for members who need them.
                        </p>
                    </CardHeader>
                    <CardContent>
                        {members.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center">
                                No organization members yet. Invite people from Settings → Organization → People.
                            </p>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="p-3 text-left font-medium">Name</th>
                                                <th className="p-3 text-left font-medium">Email</th>
                                                <th className="p-3 text-left font-medium">Department</th>
                                                <th className="p-3 text-left font-medium">Job title</th>
                                                <th className="p-3 text-right font-medium">Salary</th>
                                                <th className="p-3 text-right font-medium"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {members.map((m) => (
                                                <tr key={m.user.id} className="border-b last:border-0">
                                                    <td className="p-3">{name(m.user)}</td>
                                                    <td className="p-3">{m.user.email ?? '—'}</td>
                                                    <td className="p-3">{m.staff?.department ?? '—'}</td>
                                                    <td className="p-3">{m.staff?.job_title ?? '—'}</td>
                                                    <td className="p-3 text-right">
                                                        {m.staff?.salary != null
                                                            ? `${m.staff.salary_currency} ${Number(m.staff.salary).toLocaleString()}`
                                                            : '—'}
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        {m.staff ? (
                                                            <>
                                                                <Button variant="ghost" size="sm" asChild>
                                                                    <Link href={tenantRouter.route('hr.staff.show', { staff: m.staff.id })}>
                                                                        View
                                                                    </Link>
                                                                </Button>
                                                                <Button variant="ghost" size="sm" asChild>
                                                                    <Link href={tenantRouter.route('hr.staff.edit', { staff: m.staff.id })}>
                                                                        Edit
                                                                    </Link>
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Button variant="outline" size="sm" asChild>
                                                                <Link href={tenantRouter.route('hr.staff.create', { user_id: m.user.id })}>
                                                                    Add HR details
                                                                </Link>
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {pagination.last_page > 1 && (
                                    <div className="mt-4 flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={pagination.current_page <= 1}
                                                onClick={() =>
                                                    tenantRouter.get('hr.staff.index', {
                                                        ...filters,
                                                        page: pagination.current_page - 1,
                                                    })
                                                }
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={pagination.current_page >= pagination.last_page}
                                                onClick={() =>
                                                    tenantRouter.get('hr.staff.index', {
                                                        ...filters,
                                                        page: pagination.current_page + 1,
                                                    })
                                                }
                                            >
                                                Next
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
                </div>
            </div>
        </AppLayout>
    );
}
