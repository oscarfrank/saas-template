import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Organization',
        href: '/settings/organization',
    },
    {
        title: 'Teamspaces',
        href: '/settings/organization/teamspaces',
    },
];

interface Teamspace {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    createdAt: string;
    isPrivate: boolean;
    members: {
        id: string;
        name: string;
        avatar: string;
        role: 'admin' | 'member';
    }[];
}

const teamspaces: Teamspace[] = [
    {
        id: '1',
        name: 'Engineering',
        description: 'Engineering team workspace',
        memberCount: 8,
        createdAt: 'Jan 1, 2024',
        isPrivate: false,
        members: [
            { id: '1', name: 'John Doe', avatar: '👨‍💻', role: 'admin' },
            { id: '2', name: 'Jane Smith', avatar: '👩‍💻', role: 'member' },
        ],
    },
    {
        id: '2',
        name: 'Design',
        description: 'Design team workspace',
        memberCount: 5,
        createdAt: 'Jan 15, 2024',
        isPrivate: false,
        members: [
            { id: '3', name: 'Alice Brown', avatar: '👩‍🎨', role: 'admin' },
            { id: '4', name: 'Bob Wilson', avatar: '👨‍🎨', role: 'member' },
        ],
    },
    {
        id: '3',
        name: 'Product',
        description: 'Product team workspace',
        memberCount: 6,
        createdAt: 'Feb 1, 2024',
        isPrivate: true,
        members: [
            { id: '5', name: 'Charlie Davis', avatar: '👨‍💼', role: 'admin' },
            { id: '6', name: 'Diana Evans', avatar: '👩‍💼', role: 'member' },
        ],
    },
];

export default function OrganizationTeamspaces() {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Organization Teamspaces" />

            <SettingsLayout>
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <HeadingSmall 
                            title="Teamspaces" 
                            description="Create and manage team workspaces" 
                        />
                        <Button>Create Teamspace</Button>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <Input
                                type="search"
                                placeholder="Search teamspaces..."
                                className="w-full"
                            />
                        </div>
                        <select className="rounded-md border border-input bg-background px-3 py-2">
                            <option value="all">All Teamspaces</option>
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                        </select>
                    </div>

                    <div className="grid gap-6">
                        {teamspaces.map((teamspace) => (
                            <Card key={teamspace.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>{teamspace.name}</CardTitle>
                                            <CardDescription>{teamspace.description}</CardDescription>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Badge variant={teamspace.isPrivate ? 'secondary' : 'outline'}>
                                                {teamspace.isPrivate ? 'Private' : 'Public'}
                                            </Badge>
                                            <Badge variant="outline">
                                                {teamspace.memberCount} members
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex -space-x-2">
                                            {teamspace.members.map((member) => (
                                                <div
                                                    key={member.id}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-sm"
                                                    title={member.name}
                                                >
                                                    {member.avatar}
                                                </div>
                                            ))}
                                            {teamspace.memberCount > teamspace.members.length && (
                                                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-sm">
                                                    +{teamspace.memberCount - teamspace.members.length}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Created {teamspace.createdAt}
                                        </p>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between">
                                    <Button variant="outline" size="sm">
                                        Manage Members
                                    </Button>
                                    <div className="space-x-2">
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
                </div>
            </SettingsLayout>
        </AppLayout>
    );
} 