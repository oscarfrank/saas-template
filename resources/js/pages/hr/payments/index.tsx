import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface Run {
    id: number;
    period_start: string;
    period_end: string;
    status: string;
    total_amount: string;
    currency: string;
    items_count: number;
}

interface Props {
    runs: { data: Run[]; current_page: number; last_page: number; total: number };
}

export default function HRPaymentsIndex({ runs }: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Payments', href: tenantRouter.route('hr.payments.index') },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="HR – Payments" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold">Payment runs</h1>
                    <Button asChild>
                        <Link href={tenantRouter.route('hr.payments.create')}>
                            <Plus className="h-4 w-4 mr-2" />
                            New payment run
                        </Link>
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-medium">Payment runs</h2>
                        <p className="text-muted-foreground text-sm">
                            Create a draft run for a period to generate payments from staff salaries, then process when ready.
                        </p>
                    </CardHeader>
                    <CardContent>
                        {runs.data.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center">
                                No payment runs yet. Create one to generate draft payments from staff salaries.
                            </p>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="p-3 text-left font-medium">Period</th>
                                                <th className="p-3 text-left font-medium">Status</th>
                                                <th className="p-3 text-right font-medium">Total</th>
                                                <th className="p-3 text-right font-medium">Items</th>
                                                <th className="p-3 text-right font-medium"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {runs.data.map((r) => (
                                                <tr key={r.id} className="border-b last:border-0">
                                                    <td className="p-3">
                                                        {r.period_start} – {r.period_end}
                                                    </td>
                                                    <td className="p-3">
                                                        <Badge variant={r.status === 'processed' ? 'secondary' : 'default'}>
                                                            {r.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        {r.currency} {Number(r.total_amount).toLocaleString()}
                                                    </td>
                                                    <td className="p-3 text-right">{r.items_count}</td>
                                                    <td className="p-3 text-right">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={tenantRouter.route('hr.payments.show', { paymentRun: r.id })}>
                                                                View
                                                            </Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {runs.last_page > 1 && (
                                    <div className="mt-4 flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Page {runs.current_page} of {runs.last_page}
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
