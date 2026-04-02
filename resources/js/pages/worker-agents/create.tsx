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
} from './worker-agent-form';

interface Props {
    goals: GoalOption[];
    projects: ProjectOption[];
    reportingOptions: ReportingOption[];
    otherWorkers: WorkerOption[];
    capabilityOptions: CapabilityOption[];
    inputScopeOptions: ScopeOption[];
    llm: LlmMeta;
}

export default function WorkerAgentsCreate({ goals, projects, reportingOptions, otherWorkers, capabilityOptions, inputScopeOptions, llm }: Props) {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Worker agents', href: tenantRouter.route('worker-agents.index') },
        { title: 'Add', href: tenantRouter.route('worker-agents.create') },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add worker agent" />
            <div className="p-4 md:p-6">
                <h1 className="mb-6 text-2xl font-semibold tracking-tight">Add worker agent</h1>
                <WorkerAgentForm
                    mode="create"
                    goals={goals}
                    projects={projects}
                    reportingOptions={reportingOptions}
                    otherWorkers={otherWorkers}
                    capabilityOptions={capabilityOptions}
                    inputScopeOptions={inputScopeOptions}
                    llm={llm}
                    initial={{}}
                />
            </div>
        </AppLayout>
    );
}
