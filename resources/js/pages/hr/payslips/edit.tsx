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
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface AllowanceDeductionLine {
    name: string;
    amount: number;
}

interface PayslipStaff {
    id: number;
    uuid?: string;
    user?: { first_name: string; last_name: string; email: string };
}

interface PayslipData {
    id: number;
    staff_id: number;
    staff?: PayslipStaff;
    period_start: string;
    period_end: string;
    currency: string;
    gross: string;
    net_amount: string;
    deductions_total: string;
    allowances_detail: AllowanceDeductionLine[];
    deductions_detail: AllowanceDeductionLine[];
    narration: string | null;
    date_paid: string | null;
    payment_method: string | null;
    tax_id: string | null;
    bank_name: string | null;
    bank_account_number: string | null;
    bank_account_name: string | null;
    pay_frequency: string | null;
}

interface Props {
    payslip: PayslipData;
    paymentMethodLabels: Record<string, string>;
}

const PAYMENT_METHODS = [
    { value: 'paystack', label: 'Paystack' },
    { value: 'kuda', label: 'Kuda' },
    { value: 'flutterwave', label: 'Flutterwave' },
    { value: 'manual', label: 'Manual / Other' },
];

function staffName(staff?: PayslipStaff): string {
    if (!staff?.user) return 'Staff';
    const u = staff.user;
    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    return name || u.email || 'Staff';
}

export default function HRPayslipsEdit({ payslip, paymentMethodLabels }: Props) {
    const tenantRouter = useTenantRouter();

    const { data, setData, processing, errors } = useForm({
        gross: payslip.gross,
        net_amount: payslip.net_amount,
        deductions_total: payslip.deductions_total,
        allowances_detail: payslip.allowances_detail.map((a) => ({ name: a.name, amount: String(a.amount) })),
        deductions_detail: payslip.deductions_detail.map((d) => ({ name: d.name, amount: String(d.amount) })),
        narration: payslip.narration ?? '',
        date_paid: payslip.date_paid ?? '',
        payment_method: payslip.payment_method ?? '',
        tax_id: payslip.tax_id ?? '',
        bank_name: payslip.bank_name ?? '',
        bank_account_number: payslip.bank_account_number ?? '',
        bank_account_name: payslip.bank_account_name ?? '',
        pay_frequency: payslip.pay_frequency ?? '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Staff', href: tenantRouter.route('hr.staff.index') },
        { title: staffName(payslip.staff), href: payslip.staff?.uuid ? tenantRouter.route('hr.staff.show', { staff: payslip.staff.uuid }) : '#' },
        { title: 'Edit payslip', href: '#' },
    ];

    const addAllowance = () => setData('allowances_detail', [...data.allowances_detail, { name: '', amount: '' }]);
    const removeAllowance = (i: number) =>
        setData('allowances_detail', data.allowances_detail.filter((_, idx) => idx !== i));
    const setAllowance = (i: number, field: 'name' | 'amount', value: string) => {
        const next = [...data.allowances_detail];
        next[i] = { ...next[i], [field]: value };
        setData('allowances_detail', next);
    };

    const addDeduction = () => setData('deductions_detail', [...data.deductions_detail, { name: '', amount: '' }]);
    const removeDeduction = (i: number) =>
        setData('deductions_detail', data.deductions_detail.filter((_, idx) => idx !== i));
    const setDeduction = (i: number, field: 'name' | 'amount', value: string) => {
        const next = [...data.deductions_detail];
        next[i] = { ...next[i], [field]: value };
        setData('deductions_detail', next);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            gross: data.gross,
            net_amount: data.net_amount,
            deductions_total: data.deductions_total,
            allowances_detail: data.allowances_detail
                .filter((a) => a.name.trim())
                .map((a) => ({ name: a.name.trim(), amount: Number(a.amount) || 0 })),
            deductions_detail: data.deductions_detail
                .filter((d) => d.name.trim())
                .map((d) => ({ name: d.name.trim(), amount: Number(d.amount) || 0 })),
            narration: data.narration || null,
            date_paid: data.date_paid || null,
            payment_method: data.payment_method && data.payment_method !== '_' ? data.payment_method : null,
            tax_id: data.tax_id?.trim() || null,
            bank_name: data.bank_name?.trim() || null,
            bank_account_number: data.bank_account_number?.trim() || null,
            bank_account_name: data.bank_account_name?.trim() || null,
            pay_frequency: data.pay_frequency && data.pay_frequency !== '_' ? data.pay_frequency : null,
        };
        router.put(tenantRouter.route('hr.payslips.update', { payslip: payslip.id }), payload, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit payslip – ${staffName(payslip.staff)}`} />
            <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
                <div className="mb-6 flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={payslip.staff?.uuid ? tenantRouter.route('hr.staff.show', { staff: payslip.staff.uuid }) : tenantRouter.route('hr.staff.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Edit payslip</h1>
                        <p className="text-sm text-muted-foreground">
                            {payslip.period_start} – {payslip.period_end} · {staffName(payslip.staff)}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {Object.keys(errors).length > 0 && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                            <ul className="list-inside list-disc">
                                {Object.entries(errors).map(([key, msg]) => (
                                    <li key={key}>{msg}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Amounts</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Gross</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.gross}
                                        onChange={(e) => setData('gross', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Total deductions</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.deductions_total}
                                        onChange={(e) => setData('deductions_total', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Net pay</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.net_amount}
                                        onChange={(e) => setData('net_amount', e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">Bonuses / allowances</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addAllowance}>
                                <Plus className="mr-1 h-4 w-4" /> Add
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {data.allowances_detail.map((a, i) => (
                                <div key={i} className="flex gap-2">
                                    <Input
                                        placeholder="Name"
                                        value={a.name}
                                        onChange={(e) => setAllowance(i, 'name', e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="Amount"
                                        value={a.amount}
                                        onChange={(e) => setAllowance(i, 'amount', e.target.value)}
                                        className="w-28"
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAllowance(i)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">Deductions</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addDeduction}>
                                <Plus className="mr-1 h-4 w-4" /> Add
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {data.deductions_detail.map((d, i) => (
                                <div key={i} className="flex gap-2">
                                    <Input
                                        placeholder="Name"
                                        value={d.name}
                                        onChange={(e) => setDeduction(i, 'name', e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="Amount"
                                        value={d.amount}
                                        onChange={(e) => setDeduction(i, 'amount', e.target.value)}
                                        className="w-28"
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeDeduction(i)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Bank & tax (at time of pay)</CardTitle>
                            <p className="text-sm font-normal text-muted-foreground">
                                Shown on the printed slip. Edit if the payment was made to different bank details (e.g. old account).
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tax ID</Label>
                                <Input
                                    value={data.tax_id}
                                    onChange={(e) => setData('tax_id', e.target.value)}
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Bank name</Label>
                                <Input
                                    value={data.bank_name}
                                    onChange={(e) => setData('bank_name', e.target.value)}
                                    placeholder="e.g. Kuda"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Account name</Label>
                                <Input
                                    value={data.bank_account_name}
                                    onChange={(e) => setData('bank_account_name', e.target.value)}
                                    placeholder="Name on account"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Account number</Label>
                                <Input
                                    value={data.bank_account_number}
                                    onChange={(e) => setData('bank_account_number', e.target.value)}
                                    placeholder="Full number (slip shows last 4)"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Pay frequency</Label>
                                <Select value={data.pay_frequency || '_'} onValueChange={(v) => setData('pay_frequency', v === '_' ? '' : v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="bi_weekly">Bi-weekly</SelectItem>
                                        <SelectItem value="_">—</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Reference & payment</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Narration / reference</Label>
                                <Input
                                    placeholder="e.g. Salary January 2022"
                                    value={data.narration}
                                    onChange={(e) => setData('narration', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date paid</Label>
                                <Input
                                    type="date"
                                    value={data.date_paid}
                                    onChange={(e) => setData('date_paid', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Payment method</Label>
                                <Select value={data.payment_method || '_'} onValueChange={(v) => setData('payment_method', v === '_' ? '' : v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAYMENT_METHODS.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>
                                                {paymentMethodLabels[m.value] ?? m.label}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="_">—</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving…' : 'Save changes'}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href={payslip.staff?.uuid ? tenantRouter.route('hr.staff.show', { staff: payslip.staff.uuid }) : tenantRouter.route('hr.staff.index')}>Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
