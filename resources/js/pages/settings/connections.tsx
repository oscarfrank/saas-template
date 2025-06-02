import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Connections',
        href: '/settings/connections',
    },
];

interface Connection {
    id: string;
    name: string;
    description: string;
    icon: string;
    status: 'connected' | 'disconnected';
    lastSync?: string;
}

const connections: Connection[] = [
    {
        id: 'slack',
        name: 'Slack',
        description: 'Connect your Slack workspace to receive notifications and updates',
        icon: '💬',
        status: 'disconnected',
    },
    {
        id: 'google-calendar',
        name: 'Google Calendar',
        description: 'Sync your calendar events and schedule',
        icon: '📅',
        status: 'connected',
        lastSync: '2 hours ago',
    },
    {
        id: 'zapier',
        name: 'Zapier',
        description: 'Automate workflows and connect with other apps',
        icon: '⚡',
        status: 'disconnected',
    },
    {
        id: 'pipedream',
        name: 'Pipedream',
        description: 'Build, run, and share workflows',
        icon: '🔄',
        status: 'disconnected',
    },
    {
        id: 'ticktick',
        name: 'TickTick',
        description: 'Sync your tasks and to-dos',
        icon: '✅',
        status: 'disconnected',
    },
];

export default function Connections() {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Connections" />

            <SettingsLayout>
                <div className="space-y-8">
                    <HeadingSmall 
                        title="Connected Apps" 
                        description="Manage your connected applications and integrations" 
                    />

                    <div className="grid gap-6">
                        {connections.map((connection) => (
                            <Card key={connection.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <span className="text-2xl">{connection.icon}</span>
                                            <div>
                                                <CardTitle>{connection.name}</CardTitle>
                                                <CardDescription>{connection.description}</CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant={connection.status === 'connected' ? 'default' : 'secondary'}>
                                            {connection.status === 'connected' ? 'Connected' : 'Not Connected'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {connection.status === 'connected' && connection.lastSync && (
                                        <p className="text-sm text-muted-foreground">
                                            Last synced: {connection.lastSync}
                                        </p>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        variant={connection.status === 'connected' ? 'destructive' : 'default'}
                                        className="w-full sm:w-auto"
                                    >
                                        {connection.status === 'connected' ? 'Disconnect' : 'Connect'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                    <div className="rounded-lg border border-dashed p-8 text-center">
                        <h3 className="text-lg font-medium">Want to connect another app?</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            We're always adding new integrations. Let us know what you'd like to see next.
                        </p>
                        <Button variant="outline" className="mt-4">
                            Suggest an Integration
                        </Button>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
} 