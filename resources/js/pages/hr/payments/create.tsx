import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTenantRouter } from '@/hooks/use-tenant-router';

interface Props {
    staff: unknown[];
}

export default function HRPaymentsCreate({ staff }: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Payments', href: tenantRouter.route('hr.payments.index') },
        { title: 'New payment run', href: tenantRouter.route('hr.payments.create') },
    ];
    const { data, setData, post, processing } = useForm({
        period_start: '',
        period_end: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(tenantRouter.route('hr.payments.store'), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New payment run" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="max-w-md space-y-6">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={tenantRouter.route('hr.payments.index')}>← Payments</Link>
                </Button>
                <Card>
                    <CardHeader>
                        <h1 className="text-xl font-semibold">New payment run</h1>
                        <p className="text-muted-foreground text-sm">
                            Create a draft payment run for the given period. Payments will be generated from active staff salaries (prorated by pay frequency).
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="period_start">Period start *</Label>
                                <Input
                                    id="period_start"
                                    type="date"
                                    required
                                    value={data.period_start}
                                    onChange={(e) => setData('period_start', e.target.value)}
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
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button type="submit" disabled={processing}>
                                    Create draft run
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={tenantRouter.route('hr.payments.index')}>Cancel</Link>
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
