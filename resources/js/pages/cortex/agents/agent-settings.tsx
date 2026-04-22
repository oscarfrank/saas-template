import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { useMemo, useState } from 'react';

import { CortexAgentLlmSettingsCard, type CortexLlmInertia } from '@/components/cortex/cortex-agent-llm-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

type RelatedSetting = {
    label: string;
    route: string;
    description: string;
};

interface Props {
    agentKey: string;
    agentName: string;
    agentDescription: string;
    agentIndexRoute: string;
    llm: CortexLlmInertia;
    relatedSettings: RelatedSetting[];
}

export default function CortexAgentSettingsPage({
    agentKey,
    agentName,
    agentDescription,
    agentIndexRoute,
    llm: initialLlm,
    relatedSettings,
}: Props) {
    const tenantRouter = useTenantRouter();
    const [llm, setLlm] = useState(initialLlm);

    const agentHomeHref = tenantRouter.route(agentIndexRoute);

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Cortex', href: tenantRouter.route('cortex.index') },
            { title: agentName, href: agentHomeHref },
            { title: 'Settings', href: '' },
        ],
        [tenantRouter, agentName, agentHomeHref],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${agentName} settings — Cortex`} />
            <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 pb-16 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                        <Button variant="ghost" size="sm" className="w-fit gap-1.5 -ml-2 px-2" asChild>
                            <Link href={agentHomeHref}>
                                <ArrowLeft className="size-4" />
                                Back to {agentName}
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-semibold tracking-tight">Agent settings</h1>
                        <p className="text-muted-foreground text-sm">{agentDescription}</p>
                    </div>
                </div>

                {relatedSettings.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Related settings</CardTitle>
                            <CardDescription>Other pages for this agent (feeds, images, OAuth, etc.).</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            {relatedSettings.map((row) => (
                                <div
                                    key={row.route}
                                    className="flex flex-col gap-1 rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{row.label}</p>
                                        <p className="text-muted-foreground text-xs">{row.description}</p>
                                    </div>
                                    <Button variant="secondary" size="sm" className="shrink-0" asChild>
                                        <Link href={tenantRouter.route(row.route)}>Open</Link>
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <CortexAgentLlmSettingsCard llm={llm} onLlmSaved={setLlm} />

                {agentKey === 'pulse' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Pulse-specific controls</CardTitle>
                            <CardDescription>
                                Digest scheduling, feed limits, deep research, and per-step model overrides are managed in Pulse settings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="secondary" size="sm" asChild>
                                <Link href={tenantRouter.route('cortex.agents.pulse.settings')}>Open Pulse settings</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle className="text-base text-muted-foreground">Coming soon</CardTitle>
                        <CardDescription>
                            Per-agent defaults and toggles will appear here as we add them (e.g. temperature caps, tool policies).
                        </CardDescription>
                    </CardHeader>
                    <CardContent />
                </Card>
            </div>
        </AppLayout>
    );
}
