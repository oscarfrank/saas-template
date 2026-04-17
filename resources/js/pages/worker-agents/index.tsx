import {
    WorkerAgentsOrgTree,
    type WorkerAgentHandoffEdge,
} from '@/components/worker-agents/worker-agents-org-tree';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bot, ClipboardList, GitBranch, LayoutGrid, Network, Plus, Trash2 } from 'lucide-react';
import { route } from 'ziggy-js';
import type { RawNodeDatum } from 'react-d3-tree';

export type WorkerAgentListItem = {
    id: number;
    uuid: string;
    name: string;
    enabled: boolean;
    paused_at: string | null;
    automation_enabled: boolean;
    schedule_cron: string | null;
    schedule_label: string;
    staff: {
        id: number;
        uuid: string;
        job_title: string | null;
        kind: string;
        reports_to_staff_id: number | null;
    } | null;
    runs_count: number;
};

type WorkerAgentsProps = PageProps & {
    workers: WorkerAgentListItem[];
    handoff_edges: WorkerAgentHandoffEdge[];
    org_chart: RawNodeDatum | null;
    default_index_view: 'list' | 'org';
    pending_proposals_count: number;
};

export default function WorkerAgentsIndex({
    workers,
    handoff_edges,
    org_chart,
    default_index_view,
    pending_proposals_count,
}: WorkerAgentsProps) {
    const tenantRouter = useTenantRouter();
    const { tenant } = tenantRouter;
    const [indexView, setIndexView] = useState<'list' | 'org'>(default_index_view);
    const [deleteTarget, setDeleteTarget] = useState<WorkerAgentListItem | null>(null);

    useEffect(() => {
        if (deleteTarget === null) {
            return;
        }
        if (!workers.some((w) => w.uuid === deleteTarget.uuid)) {
            setDeleteTarget(null);
        }
    }, [workers, deleteTarget]);

    const persistIndexView = useCallback(
        async (next: 'list' | 'org') => {
            try {
                const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
                await axios.patch<{ default_index_view: 'list' | 'org' }>(
                    route('worker-agents.index-preferences.update', { tenant: tenant.slug }),
                    { default_index_view: next },
                    {
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': csrf,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );
            } catch {
                toast.error('Could not save your default view for this page.');
            }
        },
        [tenant.slug],
    );

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
                            Digital staff for your tenant: HR seats, org goals, handoffs to people or other agents, long-term
                            memory, and full run history. Separate from Cortex product agents (Nexus, Pulse, …).
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

                <Tabs
                    value={indexView}
                    onValueChange={(v) => {
                        const next = v === 'org' ? 'org' : 'list';
                        setIndexView(next);
                        void persistIndexView(next);
                    }}
                    className="gap-4"
                >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <TabsList className="w-fit">
                            <TabsTrigger value="list" className="gap-1.5">
                                <LayoutGrid className="size-3.5" />
                                List
                            </TabsTrigger>
                            <TabsTrigger value="org" className="gap-1.5">
                                <Network className="size-3.5" />
                                Org chart
                            </TabsTrigger>
                        </TabsList>
                        <p className="text-muted-foreground max-w-xl text-xs">
                            The tab you choose is saved as your default the next time you open Worker agents. The org chart
                            follows HR reporting between seats; handoffs are listed separately.
                        </p>
                    </div>

                    <TabsContent value="list" className="mt-0">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Bot className="size-5" />
                                    Team roster
                                </CardTitle>
                                <CardDescription>
                                    Each agent is a first-class teammate: staff record, reporting line, and permissions like
                                    everyone else.
                                </CardDescription>
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
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={tenantRouter.route('worker-agents.edit', { worker_agent: w.uuid })}>
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-muted-foreground hover:text-destructive size-8 shrink-0"
                                                                onClick={() => setDeleteTarget(w)}
                                                                aria-label={`Delete ${w.name}`}
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="left">Delete worker</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="org" className="mt-0">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Network className="size-5" />
                                    Reporting org chart
                                </CardTitle>
                                <CardDescription>
                                    Built from each worker seat&apos;s manager in HR (staff reporting). People who are not worker
                                    seats can still appear in the chain above your agents; those agents show as top-level
                                    roots until they report to another worker seat.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {workers.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">No worker agents yet. Create one to get started.</p>
                                ) : (
                                    <WorkerAgentsOrgTree orgChart={org_chart} handoffEdges={handoff_edges} tenantSlug={tenant.slug} />
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {deleteTarget ? `Delete ${deleteTarget.name}?` : 'Delete worker?'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This removes the worker agent and its linked HR staff seat, along with run history and
                                related records. This cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    if (!deleteTarget) {
                                        return;
                                    }
                                    tenantRouter.delete('worker-agents.destroy', { worker_agent: deleteTarget.uuid }, {
                                        onSuccess: () => setDeleteTarget(null),
                                        onError: () => toast.error('Could not delete this worker.'),
                                    });
                                }}
                            >
                                Delete worker
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}
