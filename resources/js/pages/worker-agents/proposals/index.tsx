import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { ClipboardList } from 'lucide-react';

type ProposalRow = {
    uuid: string;
    type: string;
    payload: Record<string, unknown>;
    worker: { uuid: string; name: string } | null;
    created_at: string | null;
};

interface Props {
    proposals: ProposalRow[];
}

export default function WorkerAgentProposalsIndex({ proposals }: Props) {
    const tenantRouter = useTenantRouter();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Worker agents', href: tenantRouter.route('worker-agents.index') },
        { title: 'Proposals', href: tenantRouter.route('worker-agents.proposals.index') },
    ];

    const approve = (uuid: string) => {
        tenantRouter.post('worker-agents.proposals.approve', {}, { proposal: uuid });
    };

    const reject = (uuid: string) => {
        const review_note = typeof window !== 'undefined' ? window.prompt('Optional note (optional)') : null;
        tenantRouter.post(
            'worker-agents.proposals.reject',
            { review_note: review_note ?? '' },
            { proposal: uuid }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Worker agent proposals" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                        <ClipboardList className="size-7" />
                        Pending proposals
                    </h1>
                    <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
                        Task actions proposed by workers with “requires approval” are queued here until you approve or reject them.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Inbox</CardTitle>
                        <CardDescription>Approve to create the HR task, or reject with an optional note.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {proposals.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No pending proposals.</p>
                        ) : (
                            <ul className="divide-y rounded-md border text-sm">
                                {proposals.map((p) => (
                                    <li key={p.uuid} className="space-y-2 p-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="outline">{p.type}</Badge>
                                            {p.worker && (
                                                <span className="text-muted-foreground">
                                                    Worker: <span className="text-foreground">{p.worker.name}</span>
                                                </span>
                                            )}
                                            {p.created_at && <span className="text-muted-foreground">{p.created_at}</span>}
                                        </div>
                                        {p.type === 'task_create' && (
                                            <div className="rounded-md bg-muted/50 p-3 font-mono text-xs whitespace-pre-wrap">
                                                {JSON.stringify(p.payload, null, 2)}
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                            <Button size="sm" onClick={() => approve(p.uuid)}>
                                                Approve
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => reject(p.uuid)}>
                                                Reject
                                            </Button>
                                        </div>
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
