import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
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
    initial: Partial<WorkerFormFields>;
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
    initial,
    goals,
    projects,
    reportingOptions,
    otherWorkers,
    capabilityOptions,
    inputScopeOptions,
    llm,
}: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Worker agents', href: tenantRouter.route('worker-agents.index') },
        { title: worker.name, href: tenantRouter.route('worker-agents.show', { worker_agent: worker.uuid }) },
        { title: 'Edit', href: tenantRouter.route('worker-agents.edit', { worker_agent: worker.uuid }) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${worker.name}`} />
            <div className="p-4 md:p-6">
                <h1 className="mb-6 text-2xl font-semibold tracking-tight">Edit worker agent</h1>
                <WorkerAgentForm
                    mode="edit"
                    workerUuid={worker.uuid}
                    currentWorkerId={worker.id}
                    goals={goals}
                    projects={projects}
                    reportingOptions={reportingOptions}
                    otherWorkers={otherWorkers}
                    capabilityOptions={capabilityOptions}
                    inputScopeOptions={inputScopeOptions}
                    llm={llm}
                    initial={initial}
                />
            </div>
        </AppLayout>
    );
}
