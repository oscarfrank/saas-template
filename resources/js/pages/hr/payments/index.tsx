import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import {
    Plus,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    DollarSign,
    Calendar,
    Users,
    CheckCircle2,
    Clock,
    ChevronRight as ChevronRightIcon,
} from 'lucide-react';

interface Run {
    id: number;
    period_start: string;
    period_end: string;
    status: string;
    total_amount: string;
    currency: string | null;
    items_count: number;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface Props {
    runs: { data: Run[]; links?: unknown[] } & PaginationMeta;
}

function formatPeriod(start: string, end: string): string {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – ${e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export default function HRPaymentsIndex({ runs }: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Payments', href: tenantRouter.route('hr.payments.index') },
    ];
    const hasRuns = runs.data.length > 0;
    const processedCount = runs.data.filter((r) => r.status === 'processed').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payments – HR" />
            <div className="flex flex-1 flex-col">
                {/* Header */}
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
                                    <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
                                    <p className="text-sm text-muted-foreground">
                                        Create payment runs from staff salaries. Choose who to pay, then process in batch or pay individually.
                                    </p>
                                </div>
                            </div>
                            <Button asChild>
                                <Link href={tenantRouter.route('hr.payments.create')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New payment run
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
                    {/* Stats */}
                    {hasRuns && (
                        <div className="mb-6 grid gap-4 sm:grid-cols-3">
                            <Card className="border-muted/50 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Payment runs</CardTitle>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-semibold">{runs.total}</p>
                                    <p className="text-xs text-muted-foreground">Total runs</p>
                                </CardContent>
                            </Card>
                            <Card className="border-muted/50 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Processed</CardTitle>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-semibold">{processedCount}</p>
                                    <p className="text-xs text-muted-foreground">Runs completed</p>
                                </CardContent>
                            </Card>
                            <Card className="border-muted/50 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Draft runs</CardTitle>
                                    <Clock className="h-4 w-4 text-amber-600" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-semibold">{runs.total - processedCount}</p>
                                    <p className="text-xs text-muted-foreground">Awaiting processing</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <Card className="border-muted/50 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                Payment runs
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Each run is a batch for a period. Add staff, review amounts, then process all at once or pay staff one by one.
                            </p>
                        </CardHeader>
                        <CardContent>
                            {!hasRuns ? (
                                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/25 bg-muted/20 py-16 text-center">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <DollarSign className="h-7 w-7" />
                                    </div>
                                    <h3 className="mt-4 text-lg font-semibold">No payment runs yet</h3>
                                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                                        Create a payment run for a period, select which staff to include, and generate payments from their salary data.
                                    </p>
                                    <Button asChild className="mt-6">
                                        <Link href={tenantRouter.route('hr.payments.create')}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create first payment run
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="rounded-xl border border-muted/50 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted/30">
                                                    <th className="p-4 text-left font-medium">Period</th>
                                                    <th className="p-4 text-left font-medium">Status</th>
                                                    <th className="p-4 text-right font-medium">Total</th>
                                                    <th className="p-4 text-right font-medium">Recipients</th>
                                                    <th className="p-4 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {runs.data.map((r) => (
                                                    <tr key={r.id} className="border-b border-muted/50 last:border-0 transition-colors hover:bg-muted/20">
                                                        <td className="p-4">
                                                            <span className="font-medium">{formatPeriod(r.period_start, r.period_end)}</span>
                                                        </td>
                                                        <td className="p-4">
                                                            {r.status === 'processed' ? (
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
                                                        </td>
                                                        <td className="p-4 text-right font-medium tabular-nums">
                                                            {r.currency
                                                                ? `${r.currency} ${Number(r.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                                                : 'Multiple currencies'}
                                                        </td>
                                                        <td className="p-4 text-right text-muted-foreground">
                                                            <span className="inline-flex items-center gap-1">
                                                                <Users className="h-4 w-4" />
                                                                {r.items_count}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <Button variant="ghost" size="sm" className="gap-1" asChild>
                                                                <Link href={tenantRouter.route('hr.payments.show', { paymentRun: r.id })}>
                                                                    View
                                                                    <ChevronRightIcon className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {runs.last_page > 1 && (
                                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                                            <p className="text-sm text-muted-foreground">
                                                Showing {runs.from ?? 0}–{runs.to ?? 0} of {runs.total} runs
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={runs.current_page <= 1}
                                                    onClick={() =>
                                                        tenantRouter.get('hr.payments.index', { page: runs.current_page - 1 })
                                                    }
                                                >
                                                    <ChevronLeft className="h-4 w-4" /> Previous
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={runs.current_page >= runs.last_page}
                                                    onClick={() =>
                                                        tenantRouter.get('hr.payments.index', { page: runs.current_page + 1 })
                                                    }
                                                >
                                                    Next <ChevronRight className="h-4 w-4" />
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
