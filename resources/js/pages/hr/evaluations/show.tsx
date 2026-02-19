import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Pencil, Send } from 'lucide-react';

interface Evaluation {
    id: number;
    period: string | null;
    status: string;
    ratings: Record<string, unknown> | null;
    goals: string | null;
    notes: string | null;
    submitted_at: string | null;
    staff?: { user?: { first_name: string; last_name: string } };
    reviewer?: { user?: { first_name: string; last_name: string } };
}

interface Props {
    evaluation: Evaluation;
}

export default function HREvaluationsShow({ evaluation }: Props) {
    const tenantRouter = useTenantRouter();
    const { post, processing } = useForm();
    const staffName = evaluation.staff?.user
        ? `${evaluation.staff.user.first_name} ${evaluation.staff.user.last_name}`
        : 'Staff';

    const handleSubmit = () => {
        post(tenantRouter.route('hr.evaluations.submit', { evaluation: evaluation.id }), { preserveScroll: true });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'HR', href: tenantRouter.route('hr.staff.index') },
                { title: 'Evaluations', href: tenantRouter.route('hr.evaluations.index') },
                { title: `${staffName} – ${evaluation.period || 'Evaluation'}`, href: tenantRouter.route('hr.evaluations.show', { evaluation: evaluation.id }) },
            ]}
        >
            <Head title={`Evaluation – ${staffName}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={tenantRouter.route('hr.evaluations.index')}>← Evaluations</Link>
                    </Button>
                    <div className="flex gap-2">
                        {evaluation.status === 'draft' && (
                            <>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={tenantRouter.route('hr.evaluations.edit', { evaluation: evaluation.id })}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
                                    </Link>
                                </Button>
                                <Button size="sm" onClick={handleSubmit} disabled={processing}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Submit
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <h1 className="text-xl font-semibold">{staffName}</h1>
                        <div className="flex items-center gap-2">
                            <Badge variant={evaluation.status === 'submitted' ? 'secondary' : 'default'}>
                                {evaluation.status}
                            </Badge>
                            {evaluation.period && <span className="text-muted-foreground">{evaluation.period}</span>}
                            {evaluation.reviewer?.user && (
                                <span className="text-muted-foreground text-sm">
                                    Reviewer: {evaluation.reviewer.user.first_name} {evaluation.reviewer.user.last_name}
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {evaluation.ratings && Object.keys(evaluation.ratings).length > 0 && (
                            <div>
                                <h2 className="font-medium mb-2">Ratings</h2>
                                <pre className="rounded bg-muted p-3 text-sm">
                                    {JSON.stringify(evaluation.ratings, null, 2)}
                                </pre>
                            </div>
                        )}
                        {evaluation.goals && (
                            <div>
                                <h2 className="font-medium mb-2">Goals</h2>
                                <p className="text-muted-foreground whitespace-pre-wrap">{evaluation.goals}</p>
                            </div>
                        )}
                        {evaluation.notes && (
                            <div>
                                <h2 className="font-medium mb-2">Notes</h2>
                                <p className="text-muted-foreground whitespace-pre-wrap">{evaluation.notes}</p>
                            </div>
                        )}
                        {evaluation.submitted_at && (
                            <p className="text-muted-foreground text-sm">
                                Submitted at {new Date(evaluation.submitted_at).toLocaleString()}
                            </p>
                        )}
                    </CardContent>
                </Card>
                </div>
            </div>
        </AppLayout>
    );
}
