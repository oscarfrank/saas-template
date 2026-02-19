import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { CheckCircle } from 'lucide-react';

interface RunItem {
    id: number;
    staff_id: number;
    amount: string;
    currency: string;
    status: string;
    paid_at: string | null;
    staff?: { user?: { first_name: string; last_name: string; email: string } };
}

interface Run {
    id: number;
    period_start: string;
    period_end: string;
    status: string;
    total_amount: string;
    currency: string;
    items: RunItem[];
}

interface Props {
    run: Run;
}

export default function HRPaymentsShow({ run }: Props) {
    const tenantRouter = useTenantRouter();
    const { post, processing } = useForm();

    const handleProcess = () => {
        post(tenantRouter.route('hr.payments.process', { paymentRun: run.id }), { preserveScroll: true });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'HR', href: tenantRouter.route('hr.staff.index') },
                { title: 'Payments', href: tenantRouter.route('hr.payments.index') },
                { title: `${run.period_start} – ${run.period_end}`, href: tenantRouter.route('hr.payments.show', { paymentRun: run.id }) },
            ]}
        >
            <Head title={`Payment run ${run.period_start}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={tenantRouter.route('hr.payments.index')}>← Payments</Link>
                    </Button>
                    {run.status === 'draft' && (
                        <Button onClick={handleProcess} disabled={processing}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as processed
                        </Button>
                    )}
                </div>
                <Card>
                    <CardHeader>
                        <h1 className="text-xl font-semibold">
                            {run.period_start} – {run.period_end}
                        </h1>
                        <div className="flex items-center gap-2">
                            <Badge variant={run.status === 'processed' ? 'secondary' : 'default'}>
                                {run.status}
                            </Badge>
                            <span className="text-muted-foreground">
                                Total: {run.currency} {Number(run.total_amount).toLocaleString()}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <h2 className="text-lg font-medium mb-3">Line items</h2>
                        {run.items.length === 0 ? (
                            <p className="text-muted-foreground py-4">No items in this run.</p>
                        ) : (
                            <div className="rounded-md border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="p-3 text-left font-medium">Staff</th>
                                            <th className="p-3 text-right font-medium">Amount</th>
                                            <th className="p-3 text-left font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {run.items.map((item) => (
                                            <tr key={item.id} className="border-b last:border-0">
                                                <td className="p-3">
                                                    {item.staff?.user
                                                        ? `${item.staff.user.first_name} ${item.staff.user.last_name} (${item.staff.user.email})`
                                                        : `Staff #${item.staff_id}`}
                                                </td>
                                                <td className="p-3 text-right">
                                                    {item.currency} {Number(item.amount).toLocaleString()}
                                                </td>
                                                <td className="p-3">
                                                    <Badge variant={item.status === 'paid' ? 'secondary' : 'default'}>
                                                        {item.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
                </div>
            </div>
        </AppLayout>
    );
}
