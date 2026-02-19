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

interface UserOption {
    id: number;
    name: string;
    email: string;
}

interface Props {
    users: UserOption[];
    /** When coming from "Add HR details" on a specific member */
    preSelectUser?: UserOption | null;
}

export default function HRStaffCreate({ users, preSelectUser = null }: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Staff', href: tenantRouter.route('hr.staff.index') },
        { title: 'Add HR details', href: tenantRouter.route('hr.staff.create') },
    ];
    const { data, setData, post, processing, errors } = useForm({
        user_id: (preSelectUser?.id ?? '') as number | '',
        employee_id: '',
        department: '',
        job_title: '',
        salary: '',
        salary_currency: 'USD',
        pay_frequency: '',
        started_at: '',
        ended_at: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(tenantRouter.route('hr.staff.store'), {
            preserveScroll: true,
            onSuccess: () => {},
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add HR details" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="max-w-2xl space-y-6">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={tenantRouter.route('hr.staff.index')}>← Staff</Link>
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <h1 className="text-xl font-semibold">Add HR details</h1>
                        <p className="text-sm text-muted-foreground">
                            Organization members appear in Staff automatically. Here you add HR details (department, salary, etc.) for a member.
                        </p>
                        {preSelectUser && (
                            <p className="text-sm font-medium text-muted-foreground">
                                Adding HR details for: {preSelectUser.name} ({preSelectUser.email})
                            </p>
                        )}
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="user_id">Member *</Label>
                                <Select
                                    required
                                    value={data.user_id === '' ? undefined : String(data.user_id)}
                                    onValueChange={(v) => setData('user_id', v === '' ? '' : Number(v))}
                                    disabled={!!preSelectUser}
                                >
                                    <SelectTrigger id="user_id">
                                        <SelectValue placeholder="Select member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>
                                                {u.name} ({u.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {users.length === 0 && (
                                    <p className="text-sm text-amber-600">
                                        No members without HR details. Everyone in the organization already has an HR record.
                                    </p>
                                )}
                                {errors.user_id && (
                                    <p className="text-sm text-destructive">{errors.user_id}</p>
                                )}
                            </div>
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
                                    Add staff
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={tenantRouter.route('hr.staff.index')}>Cancel</Link>
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
