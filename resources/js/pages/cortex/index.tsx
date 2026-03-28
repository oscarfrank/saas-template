import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Image, PenLine, Sparkles, Type, Youtube } from 'lucide-react';

export interface CortexAgentDefinition {
    id: string;
    name: string;
    description: string;
    route: string;
}

interface Props {
    agents: CortexAgentDefinition[];
}

function agentIcon(id: string) {
    const map: Record<string, any> = {
        'youtube-video': Youtube,
        'youtube-doc': Youtube,
        'nexus-planner': Brain,
        pulse: Sparkles,
        quill: PenLine,
        bait: Type,
        mirage: Image,
    };
    return map[id] ?? Youtube;
}

export default function CortexIndex({ agents }: Props) {
    const tenantRouter = useTenantRouter();
    const resolvedBreadcrumbs: BreadcrumbItem[] = [
        { title: 'Cortex', href: tenantRouter.route('cortex.index') },
    ];

    return (
        <AppLayout breadcrumbs={resolvedBreadcrumbs}>
            <Head title="Cortex" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Cortex</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        AI agents for your workspace. Pick one to run a guided task.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {agents.map((agent) => {
                        const Icon = agentIcon(agent.id);
                        return (
                            <Link key={agent.id} href={tenantRouter.route(agent.route)} className="block rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
                                <Card className="h-full transition-colors hover:bg-muted/40">
                                    <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                                        <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
                                            <Icon className="size-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <CardTitle className="text-base leading-tight">{agent.name}</CardTitle>
                                            <CardDescription className="mt-1.5 line-clamp-3">{agent.description}</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <span className="text-primary text-sm font-medium">Open agent →</span>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
