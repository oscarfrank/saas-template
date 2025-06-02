import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Organization',
        href: '/settings/organization',
    },
    {
        title: 'People',
        href: '/settings/organization/people',
    },
];

interface Member {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'member';
    avatar: string;
    joinedAt: string;
}

interface Invite {
    id: string;
    email: string;
    role: 'admin' | 'member';
    invitedBy: string;
    invitedAt: string;
    status: 'pending' | 'accepted' | 'expired';
}

const members: Member[] = [
    {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'owner',
        avatar: '👨‍💼',
        joinedAt: 'Jan 1, 2024',
    },
    {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'admin',
        avatar: '👩‍💼',
        joinedAt: 'Jan 15, 2024',
    },
    {
        id: '3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        role: 'member',
        avatar: '👨‍💻',
        joinedAt: 'Feb 1, 2024',
    },
];

const invites: Invite[] = [
    {
        id: '1',
        email: 'alice@example.com',
        role: 'member',
        invitedBy: 'John Doe',
        invitedAt: '2 days ago',
        status: 'pending',
    },
    {
        id: '2',
        email: 'charlie@example.com',
        role: 'admin',
        invitedBy: 'Jane Smith',
        invitedAt: '1 day ago',
        status: 'pending',
    },
];

export default function OrganizationPeople() {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Organization People" />

            <SettingsLayout>
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <HeadingSmall 
                            title="People" 
                            description="Manage your organization members and invites" 
                        />
                        <Button>Invite People</Button>
                    </div>

                    <Tabs defaultValue="members" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="members">Members</TabsTrigger>
                            <TabsTrigger value="invites">Pending Invites</TabsTrigger>
                        </TabsList>

                        <TabsContent value="members" className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <div className="flex-1">
                                    <Input
                                        type="search"
                                        placeholder="Search members..."
                                        className="w-full"
                                    />
                                </div>
                                <select className="rounded-md border border-input bg-background px-3 py-2">
                                    <option value="all">All Roles</option>
                                    <option value="owner">Owners</option>
                                    <option value="admin">Admins</option>
                                    <option value="member">Members</option>
                                </select>
                            </div>

                            <div className="grid gap-4">
                                {members.map((member) => (
                                    <Card key={member.id}>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <span className="text-2xl">{member.avatar}</span>
                                                    <div>
                                                        <CardTitle>{member.name}</CardTitle>
                                                        <CardDescription>{member.email}</CardDescription>
                                                    </div>
                                                </div>
                                                <Badge variant={
                                                    member.role === 'owner' ? 'default' :
                                                    member.role === 'admin' ? 'secondary' : 'outline'
                                                }>
                                                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">
                                                Joined {member.joinedAt}
                                            </p>
                                        </CardContent>
                                        <CardFooter>
                                            <Button variant="outline" size="sm">
                                                Change Role
                                            </Button>
                                            {member.role !== 'owner' && (
                                                <Button variant="destructive" size="sm" className="ml-2">
                                                    Remove
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="invites" className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <div className="flex-1">
                                    <Input
                                        type="search"
                                        placeholder="Search invites..."
                                        className="w-full"
                                    />
                                </div>
                                <select className="rounded-md border border-input bg-background px-3 py-2">
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="expired">Expired</option>
                                </select>
                            </div>

                            <div className="grid gap-4">
                                {invites.map((invite) => (
                                    <Card key={invite.id}>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle>{invite.email}</CardTitle>
                                                    <CardDescription>
                                                        Invited by {invite.invitedBy} • {invite.invitedAt}
                                                    </CardDescription>
                                                </div>
                                                <Badge variant="outline">
                                                    {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardFooter>
                                            <Button variant="outline" size="sm">
                                                Resend Invite
                                            </Button>
                                            <Button variant="destructive" size="sm" className="ml-2">
                                                Cancel Invite
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
} 