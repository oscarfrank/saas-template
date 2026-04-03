import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Bot, ClipboardList, GitBranch, Plus } from 'lucide-react';

export type WorkerAgentListItem = {
    id: number;
    uuid: string;
    name: string;
    enabled: boolean;
    paused_at: string | null;
    automation_enabled: boolean;
    schedule_cron: string | null;
    schedule_label: string;
    staff: { id: number; uuid: string; job_title: string | null; kind: string } | null;
    runs_count: number;
};

interface Props {
    workers: WorkerAgentListItem[];
    pending_proposals_count: number;
}

export default function WorkerAgentsIndex({ workers, pending_proposals_count }: Props) {
    const tenantRouter = useTenantRouter();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Worker agents', href: tenantRouter.route('worker-agents.index') },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Worker agents" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Worker agents</h1>
                        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
                            Digital staff for your tenant: HR seats, org goals, handoffs to people or other agents, long-term memory, and full run history.
                            Separate from Cortex product agents (Nexus, Pulse, …).
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant={pending_proposals_count > 0 ? 'secondary' : 'outline'} asChild>
                            <Link href={tenantRouter.route('worker-agents.proposals.index')}>
                                <ClipboardList className="mr-2 size-4" />
                                Proposals{pending_proposals_count > 0 ? ` (${pending_proposals_count})` : ''}
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={tenantRouter.route('worker-agents.demo-chain')}>
                                <GitBranch className="mr-2 size-4" />
                                Demo chain
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={tenantRouter.route('worker-agents.create')}>
                                <Plus className="mr-2 size-4" />
                                Add worker
                            </Link>
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Bot className="size-5" />
                            Team roster
                        </CardTitle>
                        <CardDescription>Each agent is a first-class teammate: staff record, reporting line, and permissions like everyone else.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {workers.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No worker agents yet. Create one to get started.</p>
                        ) : (
                            <ul className="divide-y rounded-md border">
                                {workers.map((w) => (
                                    <li key={w.uuid} className="flex flex-wrap items-center justify-between gap-3 p-4">
                                        <div>
                                            <Link
                                                href={tenantRouter.route('worker-agents.show', { worker_agent: w.uuid })}
                                                className="font-medium hover:underline"
                                            >
                                                {w.name}
                                            </Link>
                                            <div className="text-muted-foreground mt-1 flex flex-wrap gap-2 text-xs">
                                                {w.paused_at ? (
                                                    <Badge variant="secondary">Paused</Badge>
                                                ) : (
                                                    <Badge variant="outline">Active</Badge>
                                                )}
                                                {!w.enabled && <Badge variant="destructive">Disabled</Badge>}
                                                <span className="max-w-[220px] truncate sm:max-w-none" title={w.schedule_label}>
                                                    {w.schedule_label}
                                                </span>
                                                <span>{w.runs_count} run(s)</span>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={tenantRouter.route('worker-agents.edit', { worker_agent: w.uuid })}>Edit</Link>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
