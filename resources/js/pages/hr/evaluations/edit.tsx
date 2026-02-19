import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Evaluation {
    id: number;
    period: string | null;
    reviewer_id: number | null;
    goals: string | null;
    notes: string | null;
    staff?: { user?: { first_name: string; last_name: string } };
}

interface Props {
    evaluation: Evaluation;
    staff: { id: number; name: string }[];
}

export default function HREvaluationsEdit({ evaluation, staff }: Props) {
    const tenantRouter = useTenantRouter();
    const staffName = evaluation.staff?.user
        ? `${evaluation.staff.user.first_name} ${evaluation.staff.user.last_name}`
        : 'Staff';

    const { data, setData, put, processing } = useForm({
        period: evaluation.period ?? '',
        reviewer_id: evaluation.reviewer_id === null ? '' : String(evaluation.reviewer_id),
        goals: evaluation.goals ?? '',
        notes: evaluation.notes ?? '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(tenantRouter.route('hr.evaluations.update', { evaluation: evaluation.id }), { preserveScroll: true });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'HR', href: tenantRouter.route('hr.staff.index') },
                { title: 'Evaluations', href: tenantRouter.route('hr.evaluations.index') },
                { title: staffName, href: tenantRouter.route('hr.evaluations.show', { evaluation: evaluation.id }) },
                { title: 'Edit', href: '#' },
            ]}
        >
            <Head title={`Edit evaluation – ${staffName}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="max-w-2xl space-y-6">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={tenantRouter.route('hr.evaluations.show', { evaluation: evaluation.id })}>← Back</Link>
                </Button>
                <Card>
                    <CardHeader>
                        <h1 className="text-xl font-semibold">Edit evaluation</h1>
                        <p className="text-muted-foreground">{staffName}</p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="period">Period</Label>
                                <Input
                                    id="period"
                                    value={data.period}
                                    onChange={(e) => setData('period', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reviewer_id">Reviewer</Label>
                                <Select
                                    value={data.reviewer_id || undefined}
                                    onValueChange={(v) => setData('reviewer_id', v || '')}
                                >
                                    <SelectTrigger id="reviewer_id">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {staff.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="goals">Goals</Label>
                                <Textarea
                                    id="goals"
                                    value={data.goals}
                                    onChange={(e) => setData('goals', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button type="submit" disabled={processing}>Save</Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={tenantRouter.route('hr.evaluations.show', { evaluation: evaluation.id })}>Cancel</Link>
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
