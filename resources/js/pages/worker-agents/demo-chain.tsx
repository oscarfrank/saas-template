import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { GitBranch, Loader2 } from 'lucide-react';

type DemoChainResult = {
    goal_id: number;
    goal_title: string;
    human_staff_id: number;
    human_employee_id: string | null;
    lead: { id: number; uuid: string; name: string };
    specialist: { id: number; uuid: string; name: string };
    run_queued: boolean;
};

interface Props {
    initial_result: DemoChainResult | null;
}

export default function WorkerAgentsDemoChain({ initial_result }: Props) {
    const tenantRouter = useTenantRouter();
    const page = usePage();
    const { flash } = page.props as { flash?: { success?: string; error?: string } };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Worker agents', href: tenantRouter.route('worker-agents.index') },
        { title: 'Demo chain', href: tenantRouter.route('worker-agents.demo-chain') },
    ];

    const form = useForm({
        run_after: false,
    });

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.success, flash?.error]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(tenantRouter.route('worker-agents.demo-chain.store'), { preserveScroll: true });
    };

    const result = initial_result;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Demo chain" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Demo multi-agent chain</h1>
                    <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
                        Prepares the same scenario as{' '}
                        <code className="rounded bg-muted px-1 py-0.5 text-xs">php artisan worker-agents:demo-chain</code>: an org
                        goal, a demo human staff member, a lead analyst worker, and a specialist. Optionally queue a run for the lead
                        (trigger <code className="rounded bg-muted px-1 py-0.5 text-xs">demo_chain</code>) so the handoff chain starts
                        once your queue worker processes the job.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <GitBranch className="size-5" />
                            Prepare scenario
                        </CardTitle>
                        <CardDescription>
                            Safe to run multiple times: existing demo workers and goal are updated in place.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="flex flex-col gap-6">
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="run_after"
                                    checked={form.data.run_after}
                                    onCheckedChange={(v) => form.setData('run_after', v === true)}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label htmlFor="run_after" className="cursor-pointer font-medium">
                                        Queue lead run immediately
                                    </Label>
                                    <p className="text-muted-foreground text-sm">
                                        Dispatches the lead worker job with trigger <span className="font-mono text-xs">demo_chain</span>{' '}
                                        (same as CLI <span className="font-mono text-xs">--run</span>). Requires a running queue worker.
                                    </p>
                                </div>
                            </div>

                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Preparing…
                                    </>
                                ) : (
                                    'Prepare demo chain'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {result !== null && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Last run</CardTitle>
                            <CardDescription>
                                {result.run_queued ? 'Scenario prepared and lead run was queued.' : 'Scenario prepared.'} Open the lead
                                worker to watch messages and runs.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="grid gap-1">
                                <span className="text-muted-foreground">Organization goal</span>
                                <span>
                                    {result.goal_title}{' '}
                                    <span className="text-muted-foreground">(id {result.goal_id})</span>
                                </span>
                            </div>
                            <div className="grid gap-1">
                                <span className="text-muted-foreground">Human delegate (calendar todo)</span>
                                <span>
                                    Staff #{result.human_staff_id}
                                    {result.human_employee_id ? ` · ${result.human_employee_id}` : ''}
                                </span>
                            </div>
                            <div className="grid gap-1">
                                <span className="text-muted-foreground">Lead worker</span>
                                <Link
                                    href={tenantRouter.route('worker-agents.show', { worker_agent: result.lead.uuid })}
                                    className="font-medium text-primary hover:underline"
                                >
                                    {result.lead.name}
                                </Link>
                                <span className="text-muted-foreground text-xs">uuid {result.lead.uuid}</span>
                            </div>
                            <div className="grid gap-1">
                                <span className="text-muted-foreground">Specialist worker</span>
                                <Link
                                    href={tenantRouter.route('worker-agents.show', { worker_agent: result.specialist.uuid })}
                                    className="font-medium text-primary hover:underline"
                                >
                                    {result.specialist.name}
                                </Link>
                                <span className="text-muted-foreground text-xs">uuid {result.specialist.uuid}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
