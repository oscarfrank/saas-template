import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface Evaluation {
    id: number;
    period: string | null;
    status: string;
    staff?: { user?: { first_name: string; last_name: string } };
    reviewer?: { user?: { first_name: string; last_name: string } };
}

interface Props {
    evaluations: { data: Evaluation[]; current_page: number; last_page: number; total: number };
}

export default function HREvaluationsIndex({ evaluations }: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Evaluations', href: tenantRouter.route('hr.evaluations.index') },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="HR – Evaluations" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold">Performance evaluations</h1>
                    <Button asChild>
                        <Link href={tenantRouter.route('hr.evaluations.create')}>
                            <Plus className="h-4 w-4 mr-2" />
                            New evaluation
                        </Link>
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-medium">All evaluations</h2>
                    </CardHeader>
                    <CardContent>
                        {evaluations.data.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center">No evaluations yet.</p>
                        ) : (
                            <>
                                <div className="rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="p-3 text-left font-medium">Staff</th>
                                                <th className="p-3 text-left font-medium">Period</th>
                                                <th className="p-3 text-left font-medium">Reviewer</th>
                                                <th className="p-3 text-left font-medium">Status</th>
                                                <th className="p-3 text-right font-medium"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {evaluations.data.map((e) => (
                                                <tr key={e.id} className="border-b last:border-0">
                                                    <td className="p-3">
                                                        {e.staff?.user
                                                            ? `${e.staff.user.first_name} ${e.staff.user.last_name}`
                                                            : '—'}
                                                    </td>
                                                    <td className="p-3">{e.period ?? '—'}</td>
                                                    <td className="p-3">
                                                        {e.reviewer?.user
                                                            ? `${e.reviewer.user.first_name} ${e.reviewer.user.last_name}`
                                                            : '—'}
                                                    </td>
                                                    <td className="p-3">
                                                        <Badge variant={e.status === 'submitted' ? 'secondary' : 'default'}>
                                                            {e.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={tenantRouter.route('hr.evaluations.show', { evaluation: e.id })}>
                                                                View
                                                            </Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {evaluations.last_page > 1 && (
                                    <div className="mt-4 flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Page {evaluations.current_page} of {evaluations.last_page}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={evaluations.current_page <= 1}
                                                onClick={() =>
                                                    tenantRouter.get('hr.evaluations.index', {
                                                        page: evaluations.current_page - 1,
                                                    })
                                                }
                                            >
                                                <ChevronLeft className="h-4 w-4" /> Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={evaluations.current_page >= evaluations.last_page}
                                                onClick={() =>
                                                    tenantRouter.get('hr.evaluations.index', {
                                                        page: evaluations.current_page + 1,
                                                    })
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
