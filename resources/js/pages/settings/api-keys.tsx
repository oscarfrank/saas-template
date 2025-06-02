import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'API Keys',
        href: '/settings/api-keys',
    },
];

interface ApiKey {
    id: string;
    name: string;
    key: string;
    createdAt: string;
    lastUsed: string;
    expiresAt?: string;
    permissions: string[];
    isActive: boolean;
}

const apiKeys: ApiKey[] = [
    {
        id: '1',
        name: 'Production API Key',
        key: 'sk_live_1234567890abcdef',
        createdAt: 'Jan 1, 2024',
        lastUsed: '2 hours ago',
        permissions: ['read', 'write'],
        isActive: true,
    },
    {
        id: '2',
        name: 'Development API Key',
        key: 'sk_test_0987654321fedcba',
        createdAt: 'Jan 15, 2024',
        lastUsed: '5 days ago',
        expiresAt: 'Mar 15, 2024',
        permissions: ['read'],
        isActive: true,
    },
    {
        id: '3',
        name: 'Legacy Integration',
        key: 'sk_legacy_abcdef1234567890',
        createdAt: 'Dec 1, 2023',
        lastUsed: '1 month ago',
        permissions: ['read'],
        isActive: false,
    },
];

export default function ApiKeys() {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="API Keys" />

            <SettingsLayout>
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <HeadingSmall 
                            title="API Keys" 
                            description="Manage your API keys and access tokens" 
                        />
                        <Button>Create New API Key</Button>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <Input
                                type="search"
                                placeholder="Search API keys..."
                                className="w-full"
                            />
                        </div>
                        <select className="rounded-md border border-input bg-background px-3 py-2">
                            <option value="all">All Keys</option>
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="grid gap-6">
                        {apiKeys.map((apiKey) => (
                            <Card key={apiKey.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>{apiKey.name}</CardTitle>
                                            <CardDescription>
                                                Created {apiKey.createdAt}
                                                {apiKey.expiresAt && ` • Expires ${apiKey.expiresAt}`}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
                                                {apiKey.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                            {apiKey.permissions.map((permission) => (
                                                <Badge key={permission} variant="outline">
                                                    {permission}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>API Key</Label>
                                            <div className="flex items-center space-x-2">
                                                <Input
                                                    type="password"
                                                    value={apiKey.key}
                                                    readOnly
                                                    className="font-mono"
                                                />
                                                <Button variant="outline" size="sm">
                                                    Copy
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    Show
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Last used: {apiKey.lastUsed}
                                        </p>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={apiKey.isActive}
                                            onCheckedChange={() => {}}
                                        />
                                        <Label>Active</Label>
                                    </div>
                                    <div className="space-x-2">
                                        <Button variant="outline" size="sm">
                                            Edit
                                        </Button>
                                        <Button variant="destructive" size="sm">
                                            Revoke
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                    <div className="rounded-lg border border-dashed p-8 text-center">
                        <h3 className="text-lg font-medium">API Documentation</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Learn how to use our API and integrate with your applications
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