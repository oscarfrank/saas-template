import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Audit Logs',
        href: '/settings/audit-logs',
    },
];

interface AuditLog {
    id: string;
    action: string;
    description: string;
    user: {
        name: string;
        email: string;
        avatar: string;
    };
    timestamp: string;
    ip: string;
    userAgent: string;
    metadata: Record<string, any>;
}

const auditLogs: AuditLog[] = [
    {
        id: '1',
        action: 'user.login',
        description: 'User logged in',
        user: {
            name: 'John Doe',
            email: 'john@example.com',
            avatar: '👨‍💼',
        },
        timestamp: '2024-03-15 14:30:00',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        metadata: {
            method: 'password',
            success: true,
        },
    },
    {
        id: '2',
        action: 'settings.update',
        description: 'Updated organization settings',
        user: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            avatar: '👩‍💼',
        },
        timestamp: '2024-03-15 13:45:00',
        ip: '192.168.1.2',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        metadata: {
            changes: ['name', 'logo'],
        },
    },
    {
        id: '3',
        action: 'api_key.create',
        description: 'Created new API key',
        user: {
            name: 'Bob Johnson',
            email: 'bob@example.com',
            avatar: '👨‍💻',
        },
        timestamp: '2024-03-15 12:15:00',
        ip: '192.168.1.3',
        userAgent: 'Mozilla/5.0 (Linux; Android 11)',
        metadata: {
            keyName: 'Production API Key',
            permissions: ['read', 'write'],
        },
    },
];

const actionTypes = [
    'user.login',
    'user.logout',
    'user.create',
    'user.update',
    'user.delete',
    'settings.update',
    'api_key.create',
    'api_key.update',
    'api_key.delete',
    'webhook.create',
    'webhook.update',
    'webhook.delete',
];

export default function AuditLogs() {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Logs" />

            <SettingsLayout>
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <HeadingSmall 
                            title="Audit Logs" 
                            description="View system activity and user actions" 
                        />
                        <Button variant="outline">Export Logs</Button>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <Input
                                type="search"
                                placeholder="Search audit logs..."
                                className="w-full"
                            />
                        </div>
                        <Select defaultValue="all">
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                {actionTypes.map((action) => (
                                    <SelectItem key={action} value={action}>
                                        {action}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input
                            type="date"
                            className="w-[180px]"
                        />
                    </div>

                    <div className="grid gap-6">
                        {auditLogs.map((log) => (
                            <Card key={log.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <span className="text-2xl">{log.user.avatar}</span>
                                            <div>
                                                <CardTitle>{log.user.name}</CardTitle>
                                                <CardDescription>{log.user.email}</CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant="outline">
                                            {log.action}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm font-medium">{log.description}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {log.timestamp}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <Label>IP Address</Label>
                                                <p className="text-muted-foreground">{log.ip}</p>
                                            </div>
                                            <div>
                                                <Label>User Agent</Label>
                                                <p className="text-muted-foreground truncate">{log.userAgent}</p>
                                            </div>
                                        </div>
                                        {Object.entries(log.metadata).length > 0 && (
                                            <div>
                                                <Label>Additional Information</Label>
                                                <pre className="mt-2 rounded-md bg-muted p-4 text-sm">
                                                    {JSON.stringify(log.metadata, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing 3 of 150 logs
                        </p>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                                Previous
                            </Button>
                            <Button variant="outline" size="sm">
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
} 