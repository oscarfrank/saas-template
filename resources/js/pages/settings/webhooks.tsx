import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Webhooks',
        href: '/settings/webhooks',
    },
];

interface Webhook {
    id: string;
    name: string;
    url: string;
    events: string[];
    createdAt: string;
    lastTriggered?: string;
    isActive: boolean;
    status: 'active' | 'failed' | 'pending';
}

const webhooks: Webhook[] = [
    {
        id: '1',
        name: 'Order Notifications',
        url: 'https://api.example.com/webhooks/orders',
        events: ['order.created', 'order.updated', 'order.completed'],
        createdAt: 'Jan 1, 2024',
        lastTriggered: '5 minutes ago',
        isActive: true,
        status: 'active',
    },
    {
        id: '2',
        name: 'Customer Updates',
        url: 'https://api.example.com/webhooks/customers',
        events: ['customer.created', 'customer.updated'],
        createdAt: 'Jan 15, 2024',
        lastTriggered: '1 hour ago',
        isActive: true,
        status: 'active',
    },
    {
        id: '3',
        name: 'Payment Processing',
        url: 'https://api.example.com/webhooks/payments',
        events: ['payment.succeeded', 'payment.failed'],
        createdAt: 'Feb 1, 2024',
        lastTriggered: '2 days ago',
        isActive: false,
        status: 'failed',
    },
];

const availableEvents = [
    'order.created',
    'order.updated',
    'order.completed',
    'customer.created',
    'customer.updated',
    'payment.succeeded',
    'payment.failed',
    'subscription.created',
    'subscription.updated',
    'subscription.cancelled',
];

export default function Webhooks() {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Webhooks" />

            <SettingsLayout>
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <HeadingSmall 
                            title="Webhooks" 
                            description="Manage your webhook endpoints and event subscriptions" 
                        />
                        <Button>Create Webhook</Button>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <Input
                                type="search"
                                placeholder="Search webhooks..."
                                className="w-full"
                            />
                        </div>
                        <select className="rounded-md border border-input bg-background px-3 py-2">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="failed">Failed</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>

                    <div className="grid gap-6">
                        {webhooks.map((webhook) => (
                            <Card key={webhook.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>{webhook.name}</CardTitle>
                                            <CardDescription>
                                                Created {webhook.createdAt}
                                                {webhook.lastTriggered && ` • Last triggered ${webhook.lastTriggered}`}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Badge variant={
                                                webhook.status === 'active' ? 'default' :
                                                webhook.status === 'failed' ? 'destructive' : 'secondary'
                                            }>
                                                {webhook.status.charAt(0).toUpperCase() + webhook.status.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Endpoint URL</Label>
                                            <div className="flex items-center space-x-2">
                                                <Input
                                                    value={webhook.url}
                                                    readOnly
                                                    className="font-mono"
                                                />
                                                <Button variant="outline" size="sm">
                                                    Copy
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Events</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {webhook.events.map((event) => (
                                                    <Badge key={event} variant="outline">
                                                        {event}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={webhook.isActive}
                                            onCheckedChange={() => {}}
                                        />
                                        <Label>Active</Label>
                                    </div>
                                    <div className="space-x-2">
                                        <Button variant="outline" size="sm">
                                            Test
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            Edit
                                        </Button>
                                        <Button variant="destructive" size="sm">
                                            Delete
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                    <div className="rounded-lg border border-dashed p-8 text-center">
                        <h3 className="text-lg font-medium">Webhook Documentation</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Learn how to set up and use webhooks in your applications
                        </p>
                        <Button variant="outline" className="mt-4">
                            View Documentation
                        </Button>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
} 