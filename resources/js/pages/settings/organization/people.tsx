import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useTenantRouter } from '@/hooks/use-tenant-router';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
    role: 'owner' | 'admin' | 'editor' | 'member';
    avatar: string;
    joinedAt: string;
}

interface Invite {
    id: string;
    email: string;
    role: 'admin' | 'editor' | 'member';
    invitedBy: string;
    invitedAt: string;
    status: 'pending' | 'accepted' | 'expired';
}

interface Props {
    members: Member[];
    invites: Invite[];
    userRole: 'owner' | 'admin' | 'editor' | 'member';
}

export default function OrganizationPeople({ members, invites, userRole }: Props) {
    const tenantRouter = useTenantRouter();
    const { auth } = usePage<SharedData>().props;
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [isResendDialogOpen, setIsResendDialogOpen] = useState(false);
    const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
    const [inviteToCancel, setInviteToCancel] = useState<{ id: string; email: string; isInvitee: boolean } | null>(null);
    const [inviteToResend, setInviteToResend] = useState<{ id: string; email: string } | null>(null);
    const [memberToUpdate, setMemberToUpdate] = useState<{ id: string; email: string; currentRole: string } | null>(null);
    const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string; email: string } | null>(null);
    const [newInvite, setNewInvite] = useState<{ email: string; role: 'admin' | 'editor' | 'member' }>({ 
        email: '', 
        role: 'member' 
    });
    const [inviteError, setInviteError] = useState<string>('');

    // Check if user can manage invites
    const canManageInvites = userRole === 'owner' || userRole === 'admin';
    // Check if user can manage members (owner and admin only; editors manage script access, not org membership)
    const canManageMembers = userRole === 'owner' || userRole === 'admin';

    // Search and filter states
    const [memberSearch, setMemberSearch] = useState('');
    const [memberRoleFilter, setMemberRoleFilter] = useState('all');
    const [inviteSearch, setInviteSearch] = useState('');
    const [inviteStatusFilter, setInviteStatusFilter] = useState('all');

    // Filtered members
    const filteredMembers = members.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                            member.email.toLowerCase().includes(memberSearch.toLowerCase());
        const matchesRole = memberRoleFilter === 'all' || member.role === memberRoleFilter;
        return matchesSearch && matchesRole;
    });

    // Filtered invites
    const filteredInvites = invites.filter(invite => {
        const matchesSearch = invite.email.toLowerCase().includes(inviteSearch.toLowerCase());
        const matchesStatus = inviteStatusFilter === 'all' || invite.status === inviteStatusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleSendInvite = () => {
        // Clear any previous errors
        setInviteError('');

        // Check if trying to invite self
        if (newInvite.email.toLowerCase() === auth.user.email.toLowerCase()) {
            setInviteError("You can't invite yourself to the organization");
            return;
        }

        // Check if user already has a pending invite
        const hasPendingInvite = invites.some(
            invite => invite.email.toLowerCase() === newInvite.email.toLowerCase() && invite.status === 'pending'
        );

        if (hasPendingInvite) {
            const existingInvite = invites.find(
                invite => invite.email.toLowerCase() === newInvite.email.toLowerCase() && invite.status === 'pending'
            );
            setInviteError(
                "This person already has a pending invitation. You can either resend the existing invite or cancel it and send a new one."
            );
            return;
        }

        // Check if user is already a member
        const isAlreadyMember = members.some(
            member => member.email.toLowerCase() === newInvite.email.toLowerCase()
        );

        if (isAlreadyMember) {
            setInviteError("This person is already a member of the organization");
            return;
        }

        router.post(tenantRouter.route('settings.organization.invites.send'), newInvite, {
            onSuccess: () => {
                toast.success('Invite sent successfully');
                setIsInviteDialogOpen(false);
                setNewInvite({ email: '', role: 'member' });
                setInviteError('');
            },
            onError: (errors) => {
                toast.error(errors.email || 'Failed to send invite');
            },
        });
    };

    const handleCancelInvite = (inviteId: string) => {
        router.post(tenantRouter.route('settings.organization.invites.cancel', { invite: inviteId }), {}, {
            onSuccess: () => {
                toast.success('Invite cancelled successfully');
                setIsCancelDialogOpen(false);
                setInviteToCancel(null);
                router.reload();
            },
            onError: () => {
                toast.error('Failed to cancel invite');
            },
        });
    };

    const handleResendInvite = (inviteId: string) => {
        router.post(tenantRouter.route('settings.organization.invites.resend', { invite: inviteId }), {}, {
            onSuccess: () => {
                toast.success('Invite resent successfully');
                setIsResendDialogOpen(false);
                setInviteToResend(null);
            },
            onError: () => {
                toast.error('Failed to resend invite');
            },
        });
    };

    const handleAcceptInvite = (inviteId: string) => {
        router.post(tenantRouter.route('tenants.invites.accept', { invite: inviteId }), {}, {
            onSuccess: () => {
                toast.success('Invite accepted successfully');
                router.reload();
            },
            onError: (errors) => {
                toast.error(errors.message || 'Failed to accept invite');
            },
        });
    };

    const openCancelDialog = (invite: Invite) => {
        setInviteToCancel({
            id: invite.id,
            email: invite.email,
            isInvitee: invite.email === auth.user.email
        });
        setIsCancelDialogOpen(true);
    };

    const openResendDialog = (invite: Invite) => {
        setInviteToResend({
            id: invite.id,
            email: invite.email
        });
        setIsResendDialogOpen(true);
    };

    const handleChangeRole = () => {
        if (!memberToUpdate) return;

        router.post(tenantRouter.route('settings.organization.members.update-role', { member: memberToUpdate.id }), {
            role: memberToUpdate.currentRole
        }, {
            onSuccess: () => {
                toast.success('Role updated successfully');
                setIsChangeRoleDialogOpen(false);
                setMemberToUpdate(null);
                router.reload();
            },
            onError: (errors) => {
                toast.error(errors.role || 'Failed to update role');
            },
        });
    };

    const openChangeRoleDialog = (member: Member) => {
        setMemberToUpdate({
            id: member.id,
            email: member.email,
            currentRole: member.role
        });
        setIsChangeRoleDialogOpen(true);
    };

    const handleRemoveMember = () => {
        if (!memberToRemove) return;

        router.post(tenantRouter.route('settings.organization.members.remove', { member: memberToRemove.id }), {}, {
            onSuccess: () => {
                toast.success('Member removed successfully');
                setIsRemoveDialogOpen(false);
                setMemberToRemove(null);
                router.reload();
            },
            onError: (errors) => {
                toast.error(errors.member || 'Failed to remove member');
            },
        });
    };

    const openRemoveDialog = (member: Member) => {
        setMemberToRemove({
            id: member.id,
            name: member.name,
            email: member.email
        });
        setIsRemoveDialogOpen(true);
    };

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
                        {canManageInvites && (
                            <Dialog open={isInviteDialogOpen} onOpenChange={(open) => {
                                setIsInviteDialogOpen(open);
                                if (!open) {
                                    setNewInvite({ email: '', role: 'member' });
                                    setInviteError('');
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <Button>Invite People</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Invite to Organization</DialogTitle>
                                        <DialogDescription>
                                            Send an invitation to join your organization.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="colleague@company.com"
                                                value={newInvite.email}
                                                onChange={(e) => {
                                                    setNewInvite({ ...newInvite, email: e.target.value });
                                                    setInviteError('');
                                                }}
                                                className={inviteError ? "border-destructive" : ""}
                                            />
                                            {inviteError && (
                                                <p className="text-sm text-destructive">{inviteError}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="role">Role</Label>
                                            <select
                                                id="role"
                                                value={newInvite.role}
                                                onChange={(e) => setNewInvite({ ...newInvite, role: e.target.value as 'admin' | 'editor' | 'member' })}
                                                className="w-full rounded-md border border-input bg-background px-3 py-2"
                                            >
                                                <option value="member">Member</option>
                                                <option value="editor">Editor</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => {
                                            setIsInviteDialogOpen(false);
                                            setNewInvite({ email: '', role: 'member' });
                                            setInviteError('');
                                        }}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleSendInvite}>
                                            Send Invite
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    {/* Cancel Confirmation Dialog */}
                    <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {inviteToCancel?.isInvitee ? 'Decline Invite' : 'Cancel Invite'}
                                </DialogTitle>
                                <DialogDescription>
                                    {inviteToCancel?.isInvitee 
                                        ? 'Are you sure you want to decline this invitation? This action cannot be undone.'
                                        : `Are you sure you want to cancel the invitation for ${inviteToCancel?.email}? This action cannot be undone.`
                                    }
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        setIsCancelDialogOpen(false);
                                        setInviteToCancel(null);
                                    }}
                                >
                                    No, keep it
                                </Button>
                                <Button 
                                    variant="destructive"
                                    onClick={() => inviteToCancel && handleCancelInvite(inviteToCancel.id)}
                                >
                                    {inviteToCancel?.isInvitee ? 'Yes, decline' : 'Yes, cancel'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Resend Confirmation Dialog */}
                    <Dialog open={isResendDialogOpen} onOpenChange={setIsResendDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Resend Invite</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to resend the invitation to {inviteToResend?.email}?
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        setIsResendDialogOpen(false);
                                        setInviteToResend(null);
                                    }}
                                >
                                    No, cancel
                                </Button>
                                <Button 
                                    onClick={() => inviteToResend && handleResendInvite(inviteToResend.id)}
                                >
                                    Yes, resend
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Change Role Dialog */}
                    <Dialog open={isChangeRoleDialogOpen} onOpenChange={(open) => {
                        setIsChangeRoleDialogOpen(open);
                        if (!open) {
                            setMemberToUpdate(null);
                        }
                    }}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Change Member Role</DialogTitle>
                                <DialogDescription>
                                    Update the role for {memberToUpdate?.email}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <select
                                        id="role"
                                        value={memberToUpdate?.currentRole}
                                        onChange={(e) => setMemberToUpdate(prev => prev ? {
                                            ...prev,
                                            currentRole: e.target.value
                                        } : null)}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                                    >
                                        <option value="member">Member</option>
                                        <option value="editor">Editor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        setIsChangeRoleDialogOpen(false);
                                        setMemberToUpdate(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleChangeRole}>
                                    Update Role
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Remove Member Dialog */}
                    <Dialog open={isRemoveDialogOpen} onOpenChange={(open) => {
                        setIsRemoveDialogOpen(open);
                        if (!open) {
                            setMemberToRemove(null);
                        }
                    }}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Remove Member</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to remove {memberToRemove?.name} ({memberToRemove?.email}) from the organization? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        setIsRemoveDialogOpen(false);
                                        setMemberToRemove(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    variant="destructive"
                                    onClick={handleRemoveMember}
                                >
                                    Remove Member
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Tabs defaultValue="members" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="members">Members</TabsTrigger>
                            {canManageInvites && (
                                <TabsTrigger value="invites">Pending Invites</TabsTrigger>
                            )}
                        </TabsList>

                        <TabsContent value="members" className="space-y-6">
                            <div className="flex items-center space-x-4">
                                <div className="flex-1">
                                    <Input
                                        type="search"
                                        placeholder="Search members..."
                                        className="w-full"
                                        value={memberSearch}
                                        onChange={(e) => setMemberSearch(e.target.value)}
                                    />
                                </div>
                                <select 
                                    className="rounded-md border border-input bg-background px-3 py-2"
                                    value={memberRoleFilter}
                                    onChange={(e) => setMemberRoleFilter(e.target.value)}
                                >
                                    <option value="all">All Roles</option>
                                    <option value="owner">Owners</option>
                                    <option value="admin">Admins</option>
                                    <option value="editor">Editors</option>
                                    <option value="member">Members</option>
                                </select>
                            </div>

                            <div className="grid gap-4">
                                {filteredMembers.map((member) => (
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
                                                    member.role === 'admin' ? 'secondary' :
                                                    member.role === 'editor' ? 'secondary' : 'outline'
                                                }>
                                                    {member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : 'Member'}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">
                                                Joined {member.joinedAt}
                                            </p>
                                        </CardContent>
                                        {canManageMembers && (
                                            <CardFooter>
                                                {member.email !== auth.user.email && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => openChangeRoleDialog(member)}
                                                    >
                                                        Change Role
                                                    </Button>
                                                )}
                                                {member.role !== 'owner' && member.email !== auth.user.email && (
                                                    <Button 
                                                        variant="destructive" 
                                                        size="sm" 
                                                        className="ml-2"
                                                        onClick={() => openRemoveDialog(member)}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </CardFooter>
                                        )}
                                    </Card>
                                ))}
                                {filteredMembers.length === 0 && (
                                    <p className="text-center text-muted-foreground py-4">
                                        No members found matching your search criteria
                                    </p>
                                )}
                            </div>
                        </TabsContent>

                        {canManageInvites && (
                            <TabsContent value="invites" className="space-y-6">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-1">
                                        <Input
                                            type="search"
                                            placeholder="Search invites..."
                                            className="w-full"
                                            value={inviteSearch}
                                            onChange={(e) => setInviteSearch(e.target.value)}
                                        />
                                    </div>
                                    <select 
                                        className="rounded-md border border-input bg-background px-3 py-2"
                                        value={inviteStatusFilter}
                                        onChange={(e) => setInviteStatusFilter(e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="accepted">Accepted</option>
                                        <option value="expired">Expired</option>
                                    </select>
                                </div>

                                <div className="grid gap-4">
                                    {filteredInvites.map((invite) => (
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
                                            <CardFooter className="flex gap-2">
                                                {invite.status === 'pending' && (
                                                    <>
                                                        {invite.email === auth.user.email ? (
                                                            <>
                                                                <Button 
                                                                    size="sm"
                                                                    onClick={() => handleAcceptInvite(invite.id)}
                                                                >
                                                                    Accept Invite
                                                                </Button>
                                                                <Button 
                                                                    variant="destructive" 
                                                                    size="sm"
                                                                    onClick={() => openCancelDialog(invite)}
                                                                >
                                                                    Decline
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm"
                                                                    onClick={() => openResendDialog(invite)}
                                                                >
                                                                    Resend Invite
                                                                </Button>
                                                                <Button 
                                                                    variant="destructive" 
                                                                    size="sm"
                                                                    onClick={() => openCancelDialog(invite)}
                                                                >
                                                                    Cancel Invite
                                                                </Button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </CardFooter>
                                        </Card>
                                    ))}
                                    {filteredInvites.length === 0 && (
                                        <p className="text-center text-muted-foreground py-4">
                                            No invites found matching your search criteria
                                        </p>
                                    )}
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
} 