import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import {
    ArrowLeft,
    DollarSign,
    Users,
    CheckCircle2,
    Clock,
    Banknote,
    Loader2,
    Check,
    Trash2,
    FileText,
} from 'lucide-react';
import { useState } from 'react';

const PAYMENT_METHODS = [
    { value: 'paystack', label: 'Paystack' },
    { value: 'kuda', label: 'Kuda' },
    { value: 'flutterwave', label: 'Flutterwave' },
    { value: 'manual', label: 'Manual / Other' },
];

interface RunItem {
    id: number;
    staff_id: number;
    amount: string;
    currency: string;
    status: string;
    paid_at: string | null;
    payment_method?: string | null;
    staff?: {
        id: number;
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
    payment_method?: string | null;
    prorate?: boolean;
    narration?: string | null;
    items: RunItem[];
}

interface Props {
    run: Run;
    paymentMethodLabels: Record<string, string>;
    isTenantOwner?: boolean;
}

function formatDate(d: string): string {
    return new Date(d).toLocaleDateString(undefined, { dateStyle: 'long' });
}

function formatPeriod(start: string, end: string): string {
    return `${formatDate(start)} – ${formatDate(end)}`;
}

/** Totals by currency from run items (for mixed-currency runs). */
function totalsByCurrency(items: RunItem[]): { currency: string; total: number }[] {
    const byCurrency: Record<string, number> = {};
    for (const it of items) {
        const c = it.currency ?? 'USD';
        byCurrency[c] = (byCurrency[c] ?? 0) + Number(it.amount);
    }
    return Object.entries(byCurrency).map(([currency, total]) => ({ currency, total }));
}

function formatRunTotal(run: Run): { primary: string; breakdown?: { currency: string; total: number }[] } {
    if (run.currency) {
        return {
            primary: `${run.currency} ${Number(run.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        };
    }
    const breakdown = totalsByCurrency(run.items);
    const primary = breakdown.length > 0
        ? 'Multiple currencies'
        : '—';
    return { primary, breakdown };
}

function staffDisplay(item: RunItem): string {
    const u = item.staff?.user;
    if (!u) return `Staff #${item.staff_id}`;
    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    return name || u.email || `Staff #${item.staff_id}`;
}

function methodLabel(method: string | null | undefined, labels: Record<string, string>): string {
    if (!method) return '—';
    return labels[method] ?? method;
}

export default function HRPaymentsShow({ run, paymentMethodLabels, isTenantOwner = false }: Props) {
    const tenantRouter = useTenantRouter();
    const [payingItemId, setPayingItemId] = useState<number | null>(null);
    const [processDialogOpen, setProcessDialogOpen] = useState(false);
    const [processMethod, setProcessMethod] = useState('manual');
    const [payItemDialogOpen, setPayItemDialogOpen] = useState(false);
    const [payItemId, setPayItemId] = useState<number | null>(null);
    const [payItemMethod, setPayItemMethod] = useState('manual');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteConfirmStep, setDeleteConfirmStep] = useState<1 | 2>(1);
    const [processingRun, setProcessingRun] = useState(false);
    const [payingItemIdLoading, setPayingItemIdLoading] = useState<number | null>(null);

    const isCompletedRun = run.status === 'processed';
    const canDeleteRun = run.status === 'draft' || (isCompletedRun && isTenantOwner);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Payments', href: tenantRouter.route('hr.payments.index') },
        { title: formatPeriod(run.period_start, run.period_end), href: '#' },
    ];

    const pendingItems = run.items.filter((i) => i.status === 'pending');
    const paidItems = run.items.filter((i) => i.status === 'paid');
    const canProcessRun = run.status === 'draft' && pendingItems.length > 0;

    const handleOpenProcessDialog = () => {
        setProcessMethod('manual');
        setProcessDialogOpen(true);
    };

    const handleConfirmProcessRun = () => {
        if (!canProcessRun) return;
        setProcessingRun(true);
        router.post(
            tenantRouter.route('hr.payments.process', { paymentRun: run.id }),
            { payment_method: processMethod },
            {
                preserveScroll: true,
                onSuccess: () => setProcessDialogOpen(false),
                onFinish: () => setProcessingRun(false),
            }
        );
    };

    const handleOpenPayItemDialog = (itemId: number) => {
        setPayItemId(itemId);
        setPayItemMethod('manual');
        setPayItemDialogOpen(true);
    };

    const handleConfirmPayItem = () => {
        if (payItemId == null) return;
        setPayingItemId(payItemId);
        setPayingItemIdLoading(payItemId);
        router.post(
            tenantRouter.route('hr.payments.items.pay', { paymentRun: run.id, item: payItemId }),
            { payment_method: payItemMethod },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setPayItemDialogOpen(false);
                    setPayItemId(null);
                },
                onFinish: () => {
                    setPayingItemId(null);
                    setPayingItemIdLoading(null);
                },
            }
        );
    };

    const handleDeleteRun = () => {
        router.delete(tenantRouter.route('hr.payments.destroy', { paymentRun: run.id }));
        setDeleteDialogOpen(false);
        setDeleteConfirmStep(1);
    };

    const handleDeleteDialogOpenChange = (open: boolean) => {
        setDeleteDialogOpen(open);
        if (!open) setDeleteConfirmStep(1);
    };

    const slipUrl = (itemId: number) => {
        const slug = tenantRouter.tenant?.slug ?? '';
        const path = `/${slug}/hr/payments/${run.id}/slip/${itemId}`;
        if (typeof window !== 'undefined' && path) {
            return `${window.location.origin}${path}`;
        }
        return path;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payment run – ${run.period_start}`} />
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
                                    <h1 className="text-2xl font-semibold tracking-tight">
                                        {formatPeriod(run.period_start, run.period_end)}
                                    </h1>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        {run.status === 'processed' ? (
                                            <Badge variant="secondary" className="gap-1 font-normal">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Completed
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="gap-1 font-normal border-amber-500/50 text-amber-700 bg-amber-500/10">
                                                <Clock className="h-3.5 w-3.5" />
                                                Draft
                                            </Badge>
                                        )}
                                        {run.payment_method && (
                                            <span className="text-sm text-muted-foreground">
                                                Via {methodLabel(run.payment_method, paymentMethodLabels)}
                                            </span>
                                        )}
                                        <span className="text-sm text-muted-foreground">
                                            {run.prorate ? 'Prorated by days' : 'Full amount'}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {(() => {
                                                const { primary, breakdown } = formatRunTotal(run);
                                                return breakdown?.length
                                                    ? `${primary} (${breakdown.map((b) => `${b.currency} ${b.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`).join(', ')})`
                                                    : `${primary} total`;
                                            })()}
                                        </span>
                                        {run.narration && (
                                            <span className="text-sm text-muted-foreground">
                                                Reference: {run.narration}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {canProcessRun && (
                                    <Button
                                        onClick={handleOpenProcessDialog}
                                        disabled={processingRun}
                                        className="gap-2"
                                    >
                                        {processingRun ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="h-4 w-4" />
                                        )}
                                        {processingRun ? 'Processing…' : 'Process entire run'}
                                    </Button>
                                )}
                                {canDeleteRun && (
                                    <Button
                                        variant="outline"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => {
                                            setDeleteConfirmStep(1);
                                            setDeleteDialogOpen(true);
                                        }}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete run
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-muted/50 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total amount</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {(() => {
                                    const { primary, breakdown } = formatRunTotal(run);
                                    return (
                                        <>
                                            <p className="text-2xl font-semibold tabular-nums">{primary}</p>
                                            {breakdown && breakdown.length > 0 && (
                                                <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                                                    {breakdown.map((b) => (
                                                        <li key={b.currency} className="tabular-nums">
                                                            {b.currency} {b.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                        <Card className="border-muted/50 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Recipients</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-semibold">{run.items.length}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-muted/50 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-semibold">{paidItems.length}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-muted/50 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                                <Clock className="h-4 w-4 text-amber-600" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-semibold">{pendingItems.length}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="mt-6 border-muted/50 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Banknote className="h-4 w-4 text-muted-foreground" />
                                Payment line items
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Pay staff individually with &quot;Pay&quot; (choose method) or process the entire run. Generate a payment slip for each recipient.
                            </p>
                        </CardHeader>
                        <CardContent>
                            {run.items.length === 0 ? (
                                <p className="py-8 text-center text-muted-foreground">No items in this run.</p>
                            ) : (
                                <div className="rounded-xl border border-muted/50 overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/30">
                                                <th className="p-4 text-left font-medium">Staff</th>
                                                <th className="p-4 text-right font-medium">Amount</th>
                                                <th className="p-4 text-left font-medium">Status</th>
                                                <th className="p-4 text-left font-medium">Method</th>
                                                <th className="p-4 text-right font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {run.items.map((item) => {
                                                const isPending = item.status === 'pending';
                                                const isPaying = payingItemIdLoading === item.id;
                                                return (
                                                    <tr
                                                        key={item.id}
                                                        className="border-b border-muted/50 last:border-0 transition-colors hover:bg-muted/20"
                                                    >
                                                        <td className="p-4">
                                                            <p className="font-medium">{staffDisplay(item)}</p>
                                                            {item.staff?.user?.email && (
                                                                <p className="text-xs text-muted-foreground">{item.staff.user.email}</p>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-right font-medium tabular-nums">
                                                            {item.currency} {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="p-4">
                                                            {item.status === 'paid' ? (
                                                                <Badge variant="secondary" className="gap-1 font-normal">
                                                                    <Check className="h-3.5 w-3.5" />
                                                                    Paid
                                                                    {item.paid_at && (
                                                                        <span className="ml-1 opacity-80">
                                                                            {new Date(item.paid_at).toLocaleDateString(undefined, { dateStyle: 'short' })}
                                                                        </span>
                                                                    )}
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="font-normal border-amber-500/50 text-amber-700 bg-amber-500/10">
                                                                    Pending
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-muted-foreground text-xs">
                                                            {methodLabel(item.payment_method ?? run.payment_method, paymentMethodLabels)}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex justify-end gap-2">
                                                                {run.status === 'draft' && isPending && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="gap-1"
                                                                        disabled={isPaying}
                                                                        onClick={() => handleOpenPayItemDialog(item.id)}
                                                                    >
                                                                        {isPaying ? (
                                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                        ) : (
                                                                            <Banknote className="h-3.5 w-3.5" />
                                                                        )}
                                                                        {isPaying ? 'Paying…' : 'Pay'}
                                                                    </Button>
                                                                )}
                                                                <Button variant="ghost" size="sm" className="gap-1" asChild>
                                                                    <a href={slipUrl(item.id)} target="_blank" rel="noopener noreferrer">
                                                                        <FileText className="h-3.5 w-3.5" />
                                                                        Slip
                                                                    </a>
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Process entire run – choose payment method */}
            <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Process entire run</DialogTitle>
                        <DialogDescription>
                            All pending items will be marked as paid. How are you making these payments?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label>Payment method</Label>
                        <Select value={processMethod} onValueChange={setProcessMethod}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PAYMENT_METHODS.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setProcessDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmProcessRun} disabled={processingRun}>
                            {processingRun ? 'Processing…' : 'Process run'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Pay one item – choose payment method */}
            <Dialog open={payItemDialogOpen} onOpenChange={setPayItemDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark as paid</DialogTitle>
                        <DialogDescription>
                            How are you paying this staff member?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label>Payment method</Label>
                        <Select value={payItemMethod} onValueChange={setPayItemMethod}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PAYMENT_METHODS.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPayItemDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmPayItem} disabled={payingItemIdLoading !== null}>
                            {payingItemIdLoading !== null ? 'Saving…' : 'Mark as paid'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete run */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
                <AlertDialogContent>
                    {isCompletedRun && deleteConfirmStep === 1 ? (
                        <>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete this completed payment run?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    You are about to permanently delete a completed payment run. All records and line items will be removed. This cannot be undone. Only the organization owner can delete completed runs.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <Button
                                    variant="outline"
                                    onClick={() => setDeleteConfirmStep(2)}
                                >
                                    Continue
                                </Button>
                            </AlertDialogFooter>
                        </>
                    ) : isCompletedRun && deleteConfirmStep === 2 ? (
                        <>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Final confirmation</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This is your last chance. Permanently delete this run and all its line items? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <Button variant="outline" onClick={() => setDeleteConfirmStep(1)}>
                                    Back
                                </Button>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive text-white hover:bg-destructive/90 hover:text-white"
                                    onClick={handleDeleteRun}
                                >
                                    Delete run
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </>
                    ) : (
                        <>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete this payment run?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the draft run and all its line items. This cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive text-white hover:bg-destructive/90 hover:text-white"
                                    onClick={handleDeleteRun}
                                >
                                    Delete run
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </>
                    )}
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
