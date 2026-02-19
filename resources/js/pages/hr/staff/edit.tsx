import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface Staff {
    id: number;
    user?: User;
    employee_id: string | null;
    department: string | null;
    job_title: string | null;
    salary: string | null;
    salary_currency: string;
    pay_frequency: string | null;
    started_at: string | null;
    ended_at: string | null;
}

interface Props {
    staff: Staff;
}

export default function HRStaffEdit({ staff }: Props) {
    const tenantRouter = useTenantRouter();
    const name = staff.user
        ? `${staff.user.first_name || ''} ${staff.user.last_name || ''}`.trim() || staff.user.email
        : `Staff #${staff.id}`;

    const { data, setData, put, processing, errors } = useForm({
        employee_id: staff.employee_id ?? '',
        department: staff.department ?? '',
        job_title: staff.job_title ?? '',
        salary: staff.salary ?? '',
        salary_currency: staff.salary_currency || 'USD',
        pay_frequency: staff.pay_frequency ?? '',
        started_at: staff.started_at ?? '',
        ended_at: staff.ended_at ?? '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(tenantRouter.route('hr.staff.update', { staff: staff.id }), { preserveScroll: true });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'HR', href: tenantRouter.route('hr.staff.index') },
                { title: 'Staff', href: tenantRouter.route('hr.staff.index') },
                { title: name, href: tenantRouter.route('hr.staff.show', { staff: staff.id }) },
                { title: 'Edit', href: '#' },
            ]}
        >
            <Head title={`Edit – ${name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="max-w-2xl space-y-6">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={tenantRouter.route('hr.staff.show', { staff: staff.id })}>← Back</Link>
                </Button>
                <Card>
                    <CardHeader>
                        <h1 className="text-xl font-semibold">Edit staff</h1>
                        <p className="text-muted-foreground">{name}</p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="employee_id">Employee ID</Label>
                                    <Input
                                        id="employee_id"
                                        value={data.employee_id}
                                        onChange={(e) => setData('employee_id', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Input
                                        id="department"
                                        value={data.department}
                                        onChange={(e) => setData('department', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="job_title">Job title</Label>
                                <Input
                                    id="job_title"
                                    value={data.job_title}
                                    onChange={(e) => setData('job_title', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="salary">Salary</Label>
                                    <Input
                                        id="salary"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.salary}
                                        onChange={(e) => setData('salary', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="salary_currency">Currency</Label>
                                    <Select
                                        value={data.salary_currency}
                                        onValueChange={(v) => setData('salary_currency', v)}
                                    >
                                        <SelectTrigger id="salary_currency">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                            <SelectItem value="GBP">GBP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pay_frequency">Pay frequency</Label>
                                <Select
                                    value={data.pay_frequency || undefined}
                                    onValueChange={(v) => setData('pay_frequency', v)}
                                >
                                    <SelectTrigger id="pay_frequency">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="bi_weekly">Bi-weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="started_at">Start date</Label>
                                    <Input
                                        id="started_at"
                                        type="date"
                                        value={data.started_at}
                                        onChange={(e) => setData('started_at', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ended_at">End date</Label>
                                    <Input
                                        id="ended_at"
                                        type="date"
                                        value={data.ended_at}
                                        onChange={(e) => setData('ended_at', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button type="submit" disabled={processing}>
                                    Save
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={tenantRouter.route('hr.staff.show', { staff: staff.id })}>
                                        Cancel
                                    </Link>
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
