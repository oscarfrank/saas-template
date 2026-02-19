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

interface Props {
    staff: { id: number; name: string }[];
}

export default function HREvaluationsCreate({ staff }: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'HR', href: tenantRouter.route('hr.staff.index') },
        { title: 'Evaluations', href: tenantRouter.route('hr.evaluations.index') },
        { title: 'New evaluation', href: tenantRouter.route('hr.evaluations.create') },
    ];
    const { data, setData, post, processing } = useForm({
        staff_id: '' as number | '',
        period: '',
        reviewer_id: '' as number | '',
        goals: '',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(tenantRouter.route('hr.evaluations.store'), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New evaluation" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="max-w-2xl space-y-6">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={tenantRouter.route('hr.evaluations.index')}>← Evaluations</Link>
                </Button>
                <Card>
                    <CardHeader>
                        <h1 className="text-xl font-semibold">New performance evaluation</h1>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="staff_id">Staff *</Label>
                                <Select
                                    required
                                    value={data.staff_id === '' ? undefined : String(data.staff_id)}
                                    onValueChange={(v) => setData('staff_id', v === '' ? '' : Number(v))}
                                >
                                    <SelectTrigger id="staff_id">
                                        <SelectValue placeholder="Select staff" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {staff.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="period">Period (e.g. 2025 Q1)</Label>
                                <Input
                                    id="period"
                                    value={data.period}
                                    onChange={(e) => setData('period', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reviewer_id">Reviewer</Label>
                                <Select
                                    value={data.reviewer_id === '' ? undefined : String(data.reviewer_id)}
                                    onValueChange={(v) => setData('reviewer_id', v === '' ? '' : Number(v))}
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
                                <Button type="submit" disabled={processing}>Create</Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={tenantRouter.route('hr.evaluations.index')}>Cancel</Link>
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
