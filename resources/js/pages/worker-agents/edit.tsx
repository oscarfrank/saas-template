import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { resolveWorkerAgentRouteParam } from '@/utils/worker-agent-route';
import {
    WorkerAgentForm,
    type GoalOption,
    type WorkerOption,
    type ProjectOption,
    type ReportingOption,
    type CapabilityOption,
    type ScopeOption,
    type LlmMeta,
    type WorkerFormFields,
} from './worker-agent-form';

interface WorkerSummary {
    id: number;
    uuid: string;
    name: string;
}

interface Props {
    worker: WorkerSummary;
    workerForm: Partial<WorkerFormFields>;
    goals: GoalOption[];
    projects: ProjectOption[];
    reportingOptions: ReportingOption[];
    otherWorkers: WorkerOption[];
    capabilityOptions: CapabilityOption[];
    inputScopeOptions: ScopeOption[];
    llm: LlmMeta;
}

export default function WorkerAgentsEdit({
    worker,
    workerForm,
    goals,
    projects,
    reportingOptions,
    otherWorkers,
    capabilityOptions,
    inputScopeOptions,
    llm,
}: Props) {
    const tenantRouter = useTenantRouter();
    const page = usePage();
    const workerAgentKey = resolveWorkerAgentRouteParam(worker, page.url);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Worker agents', href: tenantRouter.route('worker-agents.index') },
        ...(workerAgentKey
            ? [
                  {
                      title: worker.name,
                      href: tenantRouter.route('worker-agents.show', { worker_agent: workerAgentKey }),
                  },
                  {
                      title: 'Edit',
                      href: tenantRouter.route('worker-agents.edit', { worker_agent: workerAgentKey }),
                  },
              ]
            : [
                  { title: worker.name, href: tenantRouter.route('worker-agents.index') },
                  { title: 'Edit', href: '#' },
              ]),
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${worker.name}`} />
            <div className="p-4 md:p-6">
                <h1 className="mb-6 text-2xl font-semibold tracking-tight">Edit worker agent</h1>
                <WorkerAgentForm
                    key={worker.id}
                    mode="edit"
                    workerUuid={workerAgentKey ?? undefined}
                    currentWorkerId={worker.id}
                    goals={goals}
                    projects={projects}
                    reportingOptions={reportingOptions}
                    otherWorkers={otherWorkers}
                    capabilityOptions={capabilityOptions}
                    inputScopeOptions={inputScopeOptions}
                    llm={llm}
                    workerForm={workerForm}
                />
            </div>
        </AppLayout>
    );
}
