import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { ArrowLeft, Printer } from 'lucide-react';

interface AllowanceDeductionLine {
    name: string;
    amount: number;
}

interface RunItem {
    id: number;
    amount: string;
    currency: string;
    status: string;
    paid_at: string | null;
    payment_method: string | null;
    gross?: string | null;
    deductions_total?: string | null;
    allowances_detail?: AllowanceDeductionLine[];
    deductions_detail?: AllowanceDeductionLine[];
    /** Snapshot at time of run (or current staff for older runs) */
    tax_id?: string | null;
    bank_name?: string | null;
    bank_account_number?: string | null;
    bank_account_name?: string | null;
    pay_frequency?: string | null;
    staff?: {
        id: number;
        employee_id: string | null;
        user?: { first_name: string; last_name: string; email: string };
    };
}

interface Run {
    id: number;
    period_start: string;
    period_end: string;
    status: string;
    total_amount: string;
    currency: string | null;
    payment_method: string | null;
    narration?: string | null;
}

interface Props {
    run: Run;
    item: RunItem;
    tenantName: string;
    paymentMethodLabels: Record<string, string>;
    standalone?: boolean;
    staffUuid?: string;
}

function staffName(item: RunItem): string {
    const u = item.staff?.user;
    if (!u) return `Staff #${item.staff?.id ?? ''}`;
    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    return name || u.email || `Staff #${item.staff?.id}`;
}

export default function HRPaymentsSlip({ run, item, tenantName, paymentMethodLabels = {}, standalone = false, staffUuid }: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Payments', href: tenantRouter.route('hr.payments.index') },
        { title: 'Payment slip', href: '#' },
    ];

    if (!run || !item) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Payment slip" />
                <div className="mx-auto max-w-2xl px-4 py-8">
                    <p className="text-muted-foreground">Payment slip data could not be loaded.</p>
                    <Button variant="outline" className="mt-4" asChild>
                        <Link href={tenantRouter.route('hr.payments.index')}>Back to Payments</Link>
                    </Button>
                </div>
            </AppLayout>
        );
    }

    const periodStart = run.period_start ? new Date(run.period_start).toLocaleDateString(undefined, { dateStyle: 'long' }) : '—';
    const periodEnd = run.period_end ? new Date(run.period_end).toLocaleDateString(undefined, { dateStyle: 'long' }) : '—';
    const paidDate = item.paid_at
        ? new Date(item.paid_at).toLocaleDateString(undefined, { dateStyle: 'long' })
        : '—';
    const methodKey = item.payment_method || run.payment_method;
    const methodLabel = methodKey ? (paymentMethodLabels[methodKey] ?? methodKey) : '—';
    const payFreqLabel = item.pay_frequency
        ? { monthly: 'Monthly', weekly: 'Weekly', bi_weekly: 'Bi-weekly' }[item.pay_frequency] ?? item.pay_frequency
        : null;
    const bankLast4 = item.bank_account_number
        ? item.bank_account_number.slice(-4)
        : null;
    const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handlePrint = () => window.print();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payment slip – ${staffName(item)}`} />
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #payment-slip, #payment-slip * { visibility: visible; }
                    #payment-slip { position: absolute; left: 0; top: 0; width: 100%; max-width: none; padding: 0; }
                    .no-print { display: none !important; }
                    @page { size: A4; margin: 16mm; }
                }
            `}</style>
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
                <div className="no-print mb-6 flex flex-wrap items-center gap-2">
                    {standalone && staffUuid ? (
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={tenantRouter.route('hr.staff.show', { staff: staffUuid })}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to staff profile
                            </Link>
                        </Button>
                    ) : (
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={tenantRouter.route('hr.payments.show', { paymentRun: run.id })}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to run
                            </Link>
                        </Button>
                    )}
                    <Button onClick={handlePrint} className="gap-2">
                        <Printer className="h-4 w-4" />
                        Print / Save as PDF
                    </Button>
                </div>

                <div id="payment-slip" className="min-h-[inherit] overflow-hidden rounded-xl border border-muted/50 bg-card shadow-sm print:rounded-none print:border print:shadow-none">
                    {/* Header band */}
                    <div className="border-b border-muted/50 bg-muted/30 px-8 py-6 print:py-5">
                        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{tenantName}</p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Payment slip</h1>
                    </div>

                    <div className="p-8 print:p-0 print:pt-6">
                        {/* Top row: Employee (left) + Period & payment info (right) */}
                        <div className="grid gap-8 border-b border-muted/50 pb-8 sm:grid-cols-2">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee</p>
                                <p className="mt-1.5 text-xl font-semibold">{staffName(item)}</p>
                                {item.staff?.user?.email && (
                                    <p className="mt-0.5 text-sm text-muted-foreground">{item.staff.user.email}</p>
                                )}
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
                                    {item.staff?.employee_id && <span>ID: {item.staff.employee_id}</span>}
                                    {item.tax_id && <span>Tax ID: {item.tax_id}</span>}
                                    {payFreqLabel && <span>{payFreqLabel}</span>}
                                </div>
                            </div>
                            <div className="text-right sm:text-right">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pay period</p>
                                <p className="mt-1.5 font-medium">{periodStart} – {periodEnd}</p>
                                {run.narration && (
                                    <p className="mt-2 text-sm text-muted-foreground">Reference: {run.narration}</p>
                                )}
                                <p className="mt-1 text-sm text-muted-foreground">Paid: {paidDate} · {methodLabel}</p>
                            </div>
                        </div>

                        {/* Bank details (when present) */}
                        {(item.bank_name || item.bank_account_name || bankLast4) && (
                            <div className="mt-6 rounded-lg border border-muted/50 bg-muted/20 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bank details (at time of pay)</p>
                                <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-sm">
                                    {item.bank_name && <span>{item.bank_name}</span>}
                                    {item.bank_account_name && <span>{item.bank_account_name}</span>}
                                    {bankLast4 && <span className="tabular-nums text-muted-foreground">•••• {bankLast4}</span>}
                                </div>
                            </div>
                        )}

                        {/* Earnings & deductions: two-column on larger screens */}
                        <div className="mt-8 grid gap-8 sm:grid-cols-2">
                            {/* Left: Gross + Allowances */}
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Earnings</p>
                                <div className="mt-3 space-y-2">
                                    {item.gross != null && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Gross pay</span>
                                            <span className="tabular-nums font-medium">{item.currency} {fmt(Number(item.gross))}</span>
                                        </div>
                                    )}
                                    {(item.allowances_detail?.length ?? 0) > 0 && item.allowances_detail!.map((a) => (
                                        <div key={a.name} className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{a.name}</span>
                                            <span className="tabular-nums">{item.currency} {fmt(a.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Right: Deductions */}
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deductions</p>
                                {(item.deductions_detail?.length ?? 0) > 0 ? (
                                    <div className="mt-3 space-y-2">
                                        {item.deductions_detail!.map((d) => (
                                            <div key={d.name} className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">{d.name}</span>
                                                <span className="tabular-nums">{item.currency} {fmt(d.amount)}</span>
                                            </div>
                                        ))}
                                        {item.deductions_total != null && (
                                            <div className="flex justify-between border-t border-muted/50 pt-2 text-sm font-medium">
                                                <span>Total deductions</span>
                                                <span className="tabular-nums">{item.currency} {fmt(Number(item.deductions_total))}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="mt-3 text-sm text-muted-foreground">—</p>
                                )}
                            </div>
                        </div>

                        {/* Net pay – hero block */}
                        <div className="mt-8 rounded-xl border-2 border-primary/20 bg-primary/5 px-6 py-5 print:border print:bg-transparent">
                            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Net pay</p>
                            <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
                                {item.currency} {fmt(Number(item.amount))}
                            </p>
                        </div>

                        <p className="mt-8 text-xs text-muted-foreground">
                            Computer-generated payment slip. Generated on {new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}.
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
