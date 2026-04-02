import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Bot, Pencil, Play, Pause, PlayCircle } from 'lucide-react';

type RunRow = {
    id: number;
    status: string;
    trigger: string;
    started_at: string | null;
    finished_at: string | null;
    summary: string | null;
    error_message: string | null;
    created_at: string;
};

type MessageRow = {
    id: number;
    role: string;
    body: string;
    created_at: string | null;
};

type HandoffIn = {
    uuid: string;
    message: string | null;
    hr_task_id: number | null;
    from_worker: { uuid: string; name: string } | null;
    created_at: string | null;
};

type RunEventRow = {
    id: number;
    level: string;
    event_type: string;
    message: string;
    created_at: string | null;
};

interface WorkerShow {
    id: number;
    uuid: string;
    name: string;
    skills: string | null;
    capabilities: string[];
    organization_goal_ids: number[];
    schedule_cron: string | null;
    schedule_kind: string;
    schedule_label: string;
    schedule_timezone: string;
    manager: { id: number; uuid: string; label: string; kind: string; job_title: string | null } | null;
    input_scope: string;
    automation_enabled: boolean;
    requires_approval: boolean;
    max_runs_per_hour: number | null;
    daily_llm_budget_cents: number | null;
    paused_at: string | null;
    enabled: boolean;
    llm_provider: string;
    chat_model: string | null;
    config_version: number;
    staff: {
        id: number;
        uuid: string;
        employee_id: string | null;
        job_title: string | null;
        department: string | null;
        kind: string;
    } | null;
}

interface Props {
    worker: WorkerShow;
    runs: RunRow[];
    messages: MessageRow[];
    incoming_handoffs: HandoffIn[];
    latest_run_events: RunEventRow[];
    latest_run_id: number | null;
}

export default function WorkerAgentsShow({ worker, runs, messages, incoming_handoffs, latest_run_events }: Props) {
    const tenantRouter = useTenantRouter();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Worker agents', href: tenantRouter.route('worker-agents.index') },
        { title: worker.name, href: tenantRouter.route('worker-agents.show', { worker_agent: worker.uuid }) },
    ];

    const runNow = () => {
        router.post(tenantRouter.route('worker-agents.run', { worker_agent: worker.uuid }));
    };

    const pause = () => {
        router.patch(tenantRouter.route('worker-agents.pause', { worker_agent: worker.uuid }));
    };

    const resume = () => {
        router.patch(tenantRouter.route('worker-agents.resume', { worker_agent: worker.uuid }));
    };

    const acceptHandoff = (handoffUuid: string) => {
        tenantRouter.post('worker-agents.handoffs.accept', {}, { worker_agent: worker.uuid, handoff: handoffUuid });
    };

    const declineHandoff = (handoffUuid: string) => {
        const note = typeof window !== 'undefined' ? window.prompt('Optional note when declining') : null;
        tenantRouter.post(
            'worker-agents.handoffs.decline',
            { note: note ?? '' },
            { worker_agent: worker.uuid, handoff: handoffUuid }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={worker.name} />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                            <Bot className="size-7" />
                            {worker.name}
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">Config v{worker.config_version} · Seat: {worker.staff?.employee_id ?? '—'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={tenantRouter.route('worker-agents.proposals.index')}>Proposals</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={tenantRouter.route('worker-agents.edit', { worker_agent: worker.uuid })}>
                                <Pencil className="mr-1 size-4" />
                                Edit
                            </Link>
                        </Button>
                        {worker.paused_at ? (
                            <Button variant="secondary" size="sm" onClick={resume}>
                                <PlayCircle className="mr-1 size-4" />
                                Resume
                            </Button>
                        ) : (
                            <Button variant="secondary" size="sm" onClick={pause}>
                                <Pause className="mr-1 size-4" />
                                Pause
                            </Button>
                        )}
                        <Button size="sm" onClick={runNow} disabled={!worker.enabled}>
                            <Play className="mr-1 size-4" />
                            Run now
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Status</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2 text-sm">
                            {worker.paused_at ? <Badge variant="secondary">Paused</Badge> : <Badge variant="outline">Running</Badge>}
                            {!worker.enabled && <Badge variant="destructive">Disabled</Badge>}
                            {worker.manager && (
                                <span className="text-muted-foreground">
                                    Reports to: <span className="text-foreground">{worker.manager.label}</span>
                                </span>
                            )}
                            {worker.automation_enabled && worker.schedule_cron && (
                                <span className="text-muted-foreground">{worker.schedule_label}</span>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">LLM</CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground text-sm">
                            {worker.llm_provider} / {worker.chat_model ?? 'default'}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{worker.skills || '—'}</p>
                    </CardContent>
                </Card>

                {incoming_handoffs.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Incoming handoffs</CardTitle>
                            <CardDescription>Another worker asked you to take ownership. Accept to reassign linked tasks to this worker’s seat.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="divide-y rounded-md border text-sm">
                                {incoming_handoffs.map((h) => (
                                    <li key={h.uuid} className="space-y-2 p-3">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary">Pending</Badge>
                                            {h.from_worker && <span>From {h.from_worker.name}</span>}
                                            {h.hr_task_id !== null && (
                                                <span className="text-muted-foreground">Task #{h.hr_task_id}</span>
                                            )}
                                        </div>
                                        {h.message && <p className="whitespace-pre-wrap">{h.message}</p>}
                                        <div className="flex flex-wrap gap-2">
                                            <Button size="sm" onClick={() => acceptHandoff(h.uuid)}>
                                                Accept
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => declineHandoff(h.uuid)}>
                                                Decline
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Messages</CardTitle>
                        <CardDescription>Agent output and handoff notices for this worker (most recent run context).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {messages.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No messages yet.</p>
                        ) : (
                            <ul className="divide-y rounded-md border text-sm">
                                {messages.map((m) => (
                                    <li key={m.id} className="p-3">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="outline">{m.role}</Badge>
                                            {m.created_at && (
                                                <span className="text-muted-foreground">{m.created_at}</span>
                                            )}
                                        </div>
                                        <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {latest_run_events.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Latest run log</CardTitle>
                            <CardDescription>Structured events from the most recent run.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="divide-y rounded-md border font-mono text-xs">
                                {latest_run_events.map((e) => (
                                    <li key={e.id} className="p-2">
                                        <span className="text-muted-foreground">{e.event_type}</span>{' '}
                                        <span className={e.level === 'error' ? 'text-destructive' : ''}>{e.message}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Recent runs</CardTitle>
                        <CardDescription>History of queued and completed runs.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {runs.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No runs yet.</p>
                        ) : (
                            <ul className="divide-y rounded-md border text-sm">
                                {runs.map((r) => (
                                    <li key={r.id} className="p-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="outline">{r.status}</Badge>
                                            <span className="text-muted-foreground">{r.trigger}</span>
                                            <span className="text-muted-foreground">{r.created_at}</span>
                                        </div>
                                        {r.summary && <p className="mt-1">{r.summary}</p>}
                                        {r.error_message && <p className="text-destructive mt-1">{r.error_message}</p>}
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
