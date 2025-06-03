import { Head, router, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

import { useEffectiveTenant } from '@/hooks/use-effective-tenant';


interface Props {
    pendingInvites: Array<{
        id: string;
        organization: string;
        role: string;
        invited_at: string;
    }>;
}

interface ConfirmDialog {
    isOpen: boolean;
    type: 'accept' | 'decline' | null;
    inviteId: string | null;
    organization: string | null;
}

export default function Invites({ pendingInvites = [] }: Props) {
    const { effectiveTenant } = useEffectiveTenant();
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
        isOpen: false,
        type: null,
        inviteId: null,
        organization: null,
    });

    const handleAcceptInvite = (inviteId: string, organization: string) => {
        setConfirmDialog({
            isOpen: true,
            type: 'accept',
            inviteId,
            organization,
        });
    };

    const handleDeclineInvite = (inviteId: string, organization: string) => {
        setConfirmDialog({
            isOpen: true,
            type: 'decline',
            inviteId,
            organization,
        });
    };

    const confirmAction = () => {
        if (!confirmDialog.inviteId) return;

        if (confirmDialog.type === 'accept') {
            router.post(route('tenants.invites.accept', { invite: confirmDialog.inviteId }), {}, {
                onSuccess: () => {
                    toast.success('Invite accepted successfully');
                    router.reload();
                },
                onError: (errors) => {
                    toast.error(errors.message || 'Failed to accept invite');
                },
            });
        } else if (confirmDialog.type === 'decline') {
            router.post(route('tenants.invites.decline', { invite: confirmDialog.inviteId }), {}, {
                onSuccess: () => {
                    toast.success('Invite declined successfully');
                    router.reload();
                },
                onError: (errors) => {
                    toast.error(errors.message || 'Failed to decline invite');
                },
            });
        }

        setConfirmDialog({
            isOpen: false,
            type: null,
            inviteId: null,
            organization: null,
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <Head title="Pending Invites" />
            
            <div className="container max-w-3xl mx-auto py-12 px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Pending Invites</h1>
                    <p className="mt-2 text-muted-foreground">
                        You have {pendingInvites.length} pending invitation{pendingInvites.length !== 1 ? 's' : ''}
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Organization Invites</CardTitle>
                        <CardDescription>
                            Accept or decline invitations to join organizations
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pendingInvites.length > 0 ? (
                            <div className="space-y-4">
                                {pendingInvites.map((invite) => (
                                    <div key={invite.id} className="flex items-center justify-between rounded-md border p-4">
                                        <div>
                                            <p className="font-medium">{invite.organization}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)} • Invited {invite.invited_at}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDeclineInvite(invite.id, invite.organization)}
                                            >
                                                Decline
                                            </Button>
                                            <Button 
                                                size="sm"
                                                onClick={() => handleAcceptInvite(invite.id, invite.organization)}
                                            >
                                                Accept
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 space-y-4">
                                <p className="text-muted-foreground">No pending invites</p>
                                <div className="flex justify-center">
                                    <Link href={route('dashboard', effectiveTenant?.slug)}>
                                        <Button>
                                            Go to Dashboard
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {confirmDialog.type === 'accept' ? 'Accept Invitation' : 'Decline Invitation'}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmDialog.type === 'accept' 
                                ? `Are you sure you want to accept the invitation to join ${confirmDialog.organization}?`
                                : `Are you sure you want to decline the invitation from ${confirmDialog.organization}? This action cannot be undone.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={confirmDialog.type === 'accept' ? 'default' : 'destructive'}
                            onClick={confirmAction}
                        >
                            {confirmDialog.type === 'accept' ? 'Accept' : 'Decline'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 