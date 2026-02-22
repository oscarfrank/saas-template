import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { HR_CURRENCIES } from '../constants';
import { ArrowLeft, Briefcase, Banknote, CreditCard, ImageIcon, Plus, Trash2, User } from 'lucide-react';

interface UserOption {
    id: number;
    name: string;
    email: string;
}

interface AllowanceDeduction {
    name: string;
    amount: string;
}

interface StaffFormData {
    user_id: number | '';
    employee_id: string;
    department: string;
    job_title: string;
    salary: string;
    salary_currency: string;
    pay_frequency: string;
    salary_pay_day: number | '';
    allowances: AllowanceDeduction[];
    deductions: AllowanceDeduction[];
    passport_photo: File | null;
    tax_id: string;
    national_id: string;
    bank_name: string;
    bank_account_number: string;
    bank_account_name: string;
    started_at: string;
    ended_at: string;
}

interface Props {
    users: UserOption[];
    /** When coming from "Add HR details" on a specific member */
    preSelectUser?: UserOption | null;
}

const initialFormData: StaffFormData = {
    user_id: '',
    employee_id: '',
    department: '',
    job_title: '',
    salary: '',
    salary_currency: 'USD',
    pay_frequency: '',
    salary_pay_day: '',
    allowances: [],
    deductions: [],
    passport_photo: null,
    tax_id: '',
    national_id: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    started_at: '',
    ended_at: '',
};

export default function HRStaffCreate({ users, preSelectUser = null }: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Staff', href: tenantRouter.route('hr.staff.index') },
        { title: 'Add HR details', href: tenantRouter.route('hr.staff.create') },
    ];
    const initial: StaffFormData = {
        ...initialFormData,
        user_id: (preSelectUser?.id ?? '') as number | '',
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, setData, processing, errors } = useForm(initial as any);
    const allowances: AllowanceDeduction[] = Array.isArray(data.allowances) ? (data.allowances as AllowanceDeduction[]) : [];
    const deductions: AllowanceDeduction[] = Array.isArray(data.deductions) ? (data.deductions as AllowanceDeduction[]) : [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: Record<string, unknown> = {
            ...data,
            allowances: allowances.filter((a) => a.name.trim() && a.amount !== '' && Number(a.amount) >= 0),
            deductions: deductions.filter((d) => d.name.trim() && d.amount !== '' && Number(d.amount) >= 0),
        };
        router.post(tenantRouter.route('hr.staff.store'), payload as Record<string, string | number | File | null | { name: string; amount: string }[]>, {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    const addAllowance = () => setData('allowances', [...allowances, { name: '', amount: '' }] as any);
    const removeAllowance = (i: number) => setData('allowances', allowances.filter((_, idx) => idx !== i) as any);
    const addDeduction = () => setData('deductions', [...deductions, { name: '', amount: '' }] as any);
    const removeDeduction = (i: number) => setData('deductions', deductions.filter((_, idx) => idx !== i) as any);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add HR details" />
            <div className="flex flex-1 flex-col">
                {/* Header – same as Edit */}
                <div className="border-b bg-gradient-to-b from-muted/30 to-background">
                    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="icon" className="shrink-0" asChild>
                                    <Link href={tenantRouter.route('hr.staff.index')}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <div>
                                    <h1 className="text-xl font-semibold tracking-tight">Add HR details</h1>
                                    <p className="text-sm text-muted-foreground">
                                        Add employment, compensation, and identity details for an organization member.
                                    </p>
                                    {preSelectUser && (
                                        <p className="mt-1 text-sm font-medium text-muted-foreground">
                                            Adding for: {preSelectUser.name} ({preSelectUser.email})
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={tenantRouter.route('hr.staff.index')}>Cancel</Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {Object.keys(errors).length > 0 && (
                            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                <p className="font-medium">Please fix the following errors:</p>
                                <ul className="mt-1.5 list-inside list-disc space-y-0.5">
                                    {Object.entries(errors).map(([key, msg]) => (
                                        <li key={key}>{msg}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Left column: same cards as Edit */}
                            <div className="space-y-6 lg:col-span-2">
                                <Card className="border-muted/50 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Briefcase className="h-4 w-4" />
                                            </span>
                                            Employment
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="employee_id">Employee ID</Label>
                                                <Input
                                                    id="employee_id"
                                                    value={data.employee_id ?? ''}
                                                    onChange={(e) => setData('employee_id', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="department">Department</Label>
                                                <Input
                                                    id="department"
                                                    value={data.department ?? ''}
                                                    onChange={(e) => setData('department', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="job_title">Job title</Label>
                                            <Input
                                                id="job_title"
                                                value={data.job_title ?? ''}
                                                onChange={(e) => setData('job_title', e.target.value)}
                                                className="bg-background"
                                            />
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="started_at">Start date</Label>
                                                <Input
                                                    id="started_at"
                                                    type="date"
                                                    value={String(data.started_at ?? '')}
                                                    onChange={(e) => setData('started_at', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ended_at">End date</Label>
                                                <Input
                                                    id="ended_at"
                                                    type="date"
                                                    value={String(data.ended_at ?? '')}
                                                    onChange={(e) => setData('ended_at', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-muted/50 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Banknote className="h-4 w-4" />
                                            </span>
                                            Compensation
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="salary">Salary</Label>
                                                <Input
                                                    id="salary"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={data.salary ?? ''}
                                                    onChange={(e) => setData('salary', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="salary_currency">Currency</Label>
                                                <Select
                                                    value={data.salary_currency}
                                                    onValueChange={(v) => setData('salary_currency', v)}
                                                >
                                                    <SelectTrigger id="salary_currency" className="bg-background">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {HR_CURRENCIES.map((c) => (
                                                            <SelectItem key={c.code} value={c.code}>
                                                                {c.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="pay_frequency">Pay frequency</Label>
                                                <Select
                                                    value={data.pay_frequency || undefined}
                                                    onValueChange={(v) => setData('pay_frequency', v)}
                                                >
                                                    <SelectTrigger id="pay_frequency" className="bg-background">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="weekly">Weekly</SelectItem>
                                                        <SelectItem value="bi_weekly">Bi-weekly</SelectItem>
                                                        <SelectItem value="monthly">Monthly</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="salary_pay_day">Pay day (day of month)</Label>
                                                <Input
                                                    id="salary_pay_day"
                                                    type="number"
                                                    min={1}
                                                    max={31}
                                                    placeholder="e.g. 25"
                                                    value={data.salary_pay_day === '' || data.salary_pay_day === undefined ? '' : String(data.salary_pay_day)}
                                                    onChange={(e) => setData('salary_pay_day', e.target.value === '' ? '' : Number(e.target.value))}
                                                    className="bg-background"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Allowances</Label>
                                            {allowances.map((a, i) => (
                                                <div key={i} className="flex items-end gap-2">
                                                    <Input
                                                        placeholder="Name (e.g. Housing)"
                                                        value={a.name}
                                                        onChange={(e) => {
                                                            const next = [...allowances];
                                                            next[i] = { ...next[i], name: e.target.value };
                                                            setData('allowances', next as any);
                                                        }}
                                                        className="bg-background"
                                                    />
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="Amount"
                                                        className="w-28 bg-background"
                                                        value={a.amount}
                                                        onChange={(e) => {
                                                            const next = [...allowances];
                                                            next[i] = { ...next[i], amount: e.target.value };
                                                            setData('allowances', next as any);
                                                        }}
                                                    />
                                                    <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeAllowance(i)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" onClick={addAllowance} className="mt-1">
                                                <Plus className="mr-1.5 h-4 w-4" /> Add allowance
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Deductions</Label>
                                            {deductions.map((d, i) => (
                                                <div key={i} className="flex items-end gap-2">
                                                    <Input
                                                        placeholder="Name (e.g. Tax, Pension)"
                                                        value={d.name}
                                                        onChange={(e) => {
                                                            const next = [...deductions];
                                                            next[i] = { ...next[i], name: e.target.value };
                                                            setData('deductions', next as any);
                                                        }}
                                                        className="bg-background"
                                                    />
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="Amount"
                                                        className="w-28 bg-background"
                                                        value={d.amount}
                                                        onChange={(e) => {
                                                            const next = [...deductions];
                                                            next[i] = { ...next[i], amount: e.target.value };
                                                            setData('deductions', next as any);
                                                        }}
                                                    />
                                                    <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeDeduction(i)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" onClick={addDeduction} className="mt-1">
                                                <Plus className="mr-1.5 h-4 w-4" /> Add deduction
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-muted/50 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <CreditCard className="h-4 w-4" />
                                            </span>
                                            Identity & banking
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="tax_id">Tax ID</Label>
                                                <Input
                                                    id="tax_id"
                                                    value={data.tax_id ?? ''}
                                                    onChange={(e) => setData('tax_id', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="national_id">National ID</Label>
                                                <Input
                                                    id="national_id"
                                                    value={data.national_id ?? ''}
                                                    onChange={(e) => setData('national_id', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bank_name">Bank name</Label>
                                            <Input
                                                id="bank_name"
                                                value={data.bank_name ?? ''}
                                                onChange={(e) => setData('bank_name', e.target.value)}
                                                className="bg-background"
                                            />
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="bank_account_number">Account number</Label>
                                                <Input
                                                    id="bank_account_number"
                                                    value={data.bank_account_number ?? ''}
                                                    onChange={(e) => setData('bank_account_number', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="bank_account_name">Account name</Label>
                                                <Input
                                                    id="bank_account_name"
                                                    value={data.bank_account_name ?? ''}
                                                    onChange={(e) => setData('bank_account_name', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex flex-wrap gap-3">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Adding…' : 'Add HR details'}
                                    </Button>
                                    <Button type="button" variant="outline" asChild>
                                        <Link href={tenantRouter.route('hr.staff.index')}>Cancel</Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Right column: Member + Passport (same layout as Edit's photo column) */}
                            <div className="space-y-6 lg:col-span-1">
                                <Card className="border-muted/50 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <User className="h-4 w-4" />
                                            </span>
                                            Member
                                        </CardTitle>
                                        <p className="text-sm font-normal text-muted-foreground">Select the organization member to add HR details for.</p>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <Select
                                            required
                                            value={data.user_id === '' ? undefined : String(data.user_id)}
                                            onValueChange={(v) => setData('user_id', v === '' ? '' : Number(v))}
                                            disabled={!!preSelectUser}
                                        >
                                            <SelectTrigger id="user_id" className="bg-background">
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
                                                No members without HR details. Everyone already has an HR record.
                                            </p>
                                        )}
                                        {errors.user_id && (
                                            <p className="text-sm text-destructive">{errors.user_id}</p>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="border-muted/50 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <ImageIcon className="h-4 w-4" />
                                            </span>
                                            Passport photo
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Input
                                            id="passport_photo"
                                            type="file"
                                            accept="image/*"
                                            className="bg-background"
                                            onChange={(e) => setData('passport_photo', e.target.files?.[0] ?? null)}
                                        />
                                        {errors.passport_photo && (
                                            <p className="mt-2 text-sm text-destructive">{errors.passport_photo}</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
