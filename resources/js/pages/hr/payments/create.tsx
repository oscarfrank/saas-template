import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { ArrowLeft, Calendar, Users, DollarSign, CheckSquare, Square, CalendarRange } from 'lucide-react';
import { useEffect, useMemo } from 'react';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface StaffOption {
    id: number;
    employee_id: string | null;
    department: string | null;
    job_title: string | null;
    salary: string | null;
    salary_currency: string;
    pay_frequency: string | null;
    monthly_net: number | null;
    user: User | null;
}

interface Props {
    staff: StaffOption[];
}

function staffName(s: StaffOption): string {
    const u = s.user;
    if (!u) return `Staff #${s.id}`;
    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    return name || u.email || `Staff #${s.id}`;
}

export default function HRPaymentsCreate({ staff }: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Payments', href: tenantRouter.route('hr.payments.index') },
        { title: 'New payment run', href: tenantRouter.route('hr.payments.create') },
    ];

    const allIds = useMemo(() => staff.map((s) => s.id), [staff]);
    const { data, setData, post, processing, errors } = useForm({
        period_start: '',
        period_end: '',
        staff_ids: allIds,
        prorate: false as boolean,
        narration: '',
    });

    const pad = (n: number) => String(n).padStart(2, '0');
    /** Set period to a given month (monthOffset: -1 last, 0 this, 1 next) and narration to "Salary {Month} {Year}". */
    const setMonth = (monthOffset: number) => {
        const now = new Date();
        const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
        const year = target.getFullYear();
        const monthIndex = target.getMonth();
        const monthName = target.toLocaleString(undefined, { month: 'long' });
        const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
        const start = `${year}-${pad(monthIndex + 1)}-01`;
        const end = `${year}-${pad(monthIndex + 1)}-${pad(lastDayOfMonth.getDate())}`;
        setData({
            ...data,
            period_start: start,
            period_end: end,
            narration: `Salary ${monthName} ${year}`,
        });
    };
    const setLastMonth = () => setMonth(-1);
    const setThisMonth = () => setMonth(0);
    const setNextMonth = () => setMonth(1);

    // When staff list loads, default to all selected
    useEffect(() => {
        if (allIds.length > 0 && data.staff_ids.length === 0) {
            setData('staff_ids', allIds);
        }
    }, [allIds.length]);

    const toggleStaff = (id: number) => {
        setData(
            'staff_ids',
            data.staff_ids.includes(id) ? data.staff_ids.filter((x) => x !== id) : [...data.staff_ids, id]
        );
    };
    const selectAll = () => setData('staff_ids', [...allIds]);
    const selectNone = () => setData('staff_ids', []);
    const selectedCount = data.staff_ids.length;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.staff_ids.length === 0) return;
        post(tenantRouter.route('hr.payments.store'), { preserveScroll: true });
    };

    const canSubmit = data.period_start && data.period_end && selectedCount > 0 && !processing;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New payment run" />
            <div className="flex flex-1 flex-col">
                <div className="border-b bg-gradient-to-b from-muted/30 to-background">
                    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="icon" className="shrink-0" asChild>
                                    <Link href={tenantRouter.route('hr.payments.index')}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight">New payment run</h1>
                                    <p className="text-sm text-muted-foreground">
                                        Set the period and choose which staff to include. Payments are calculated from their salary, allowances, and deductions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {Object.keys(errors).length > 0 && (
                            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                                <p className="font-medium">Please fix the following:</p>
                                <ul className="mt-1.5 list-inside list-disc space-y-0.5">
                                    {Object.entries(errors).map(([key, msg]) => (
                                        <li key={key}>{msg}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="space-y-6 lg:col-span-2">
                                <Card className="border-muted/50 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Calendar className="h-4 w-4" />
                                            </span>
                                            Payment period
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            Start and end dates for this run. By default, monthly-paid staff get their full base salary for the period; tick the option below to prorate by days.
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="prorate"
                                                checked={data.prorate}
                                                onChange={(e) => setData('prorate', e.target.checked)}
                                                className="h-4 w-4 rounded border-muted-foreground"
                                            />
                                            <Label htmlFor="prorate" className="cursor-pointer font-normal">
                                                Prorate amounts by days in period (e.g. half month = half salary). Leave unchecked for full monthly amount.
                                            </Label>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={setLastMonth}
                                                className="gap-1.5"
                                            >
                                                <CalendarRange className="h-4 w-4" />
                                                Last month
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={setThisMonth}
                                                className="gap-1.5"
                                            >
                                                <CalendarRange className="h-4 w-4" />
                                                This month
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={setNextMonth}
                                                className="gap-1.5"
                                            >
                                                <CalendarRange className="h-4 w-4" />
                                                Next month
                                            </Button>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="period_start">Period start *</Label>
                                                <Input
                                                    id="period_start"
                                                    type="date"
                                                    required
                                                    value={data.period_start}
                                                    onChange={(e) => setData('period_start', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="period_end">Period end *</Label>
                                                <Input
                                                    id="period_end"
                                                    type="date"
                                                    required
                                                    value={data.period_end}
                                                    onChange={(e) => setData('period_end', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="narration">Narration / payment reference</Label>
                                            <Input
                                                id="narration"
                                                placeholder="e.g. Salary January 2026"
                                                value={data.narration ?? ''}
                                                onChange={(e) => setData('narration', e.target.value)}
                                                className="bg-background"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Shown on the run and payment slips; use as reference when making the transfer.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-muted/50 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Users className="h-4 w-4" />
                                            </span>
                                            Staff to include
                                        </CardTitle>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                                                Select all
                                            </Button>
                                            <Button type="button" variant="outline" size="sm" onClick={selectNone}>
                                                Deselect all
                                            </Button>
                                            <span className="text-sm text-muted-foreground">
                                                {selectedCount} of {staff.length} selected
                                            </span>
                                            {selectedCount === 0 && (
                                                <span className="text-sm text-amber-600">Select at least one staff member.</span>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {staff.length === 0 ? (
                                            <p className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/10 py-8 text-center text-sm text-muted-foreground">
                                                No active staff with HR details. Add staff and set salaries first.
                                            </p>
                                        ) : (
                                            <ul className="space-y-1 rounded-lg border border-muted/50 divide-y divide-muted/50 max-h-[320px] overflow-y-auto">
                                                {staff.map((s) => {
                                                    const checked = data.staff_ids.includes(s.id);
                                                    return (
                                                        <li key={s.id}>
                                                            <label
                                                                className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/30"
                                                            >
                                                                <span className="flex shrink-0">
                                                                    {checked ? (
                                                                        <CheckSquare className="h-5 w-5 text-primary" />
                                                                    ) : (
                                                                        <Square className="h-5 w-5 text-muted-foreground" />
                                                                    )}
                                                                </span>
                                                                <input
                                                                    type="checkbox"
                                                                    className="sr-only"
                                                                    checked={checked}
                                                                    onChange={() => toggleStaff(s.id)}
                                                                />
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="font-medium">{staffName(s)}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {[s.job_title, s.department].filter(Boolean).join(' · ') || 'No role'}
                                                                        {s.monthly_net != null && (
                                                                            <> · Est. {s.salary_currency} {(s.monthly_net as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}/mo</>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </label>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </CardContent>
                                </Card>

                                <div className="flex flex-wrap gap-3">
                                    <Button type="submit" disabled={!canSubmit}>
                                        {processing ? 'Creating…' : 'Create payment run'}
                                    </Button>
                                    <Button type="button" variant="outline" asChild>
                                        <Link href={tenantRouter.route('hr.payments.index')}>Cancel</Link>
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-6 lg:col-span-1">
                                <Card className="border-muted/50 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            How it works
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                                        <p>
                                            Each selected staff gets a line item. The amount is computed from their <strong>salary</strong>, <strong>allowances</strong>, and <strong>deductions</strong> for the period.
                                        </p>
                                        <p>
                                            After creating the run you can review amounts, then <strong>pay individually</strong> or <strong>process the whole run</strong> at once.
                                        </p>
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
