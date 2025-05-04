import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Edit, MessageSquare, Send } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin',
    },
    {
        title: 'Tickets',
        href: '/admin/tickets',
    },
    {
        title: 'View Ticket',
        href: '#',
    },
];

interface Props {
    ticket: {
        id: number;
        subject: string;
        description: string;
        status: string;
        priority: string;
        category: string;
        created_at: string;
        last_reply_at: string | null;
        user: {
            name: string;
            email: string;
        };
        assignedTo: {
            name: string;
            email: string;
        } | null;
        replies: Array<{
            id: number;
            message: string;
            is_internal: boolean;
            created_at: string;
            user: {
                name: string;
                email: string;
            };
        }>;
    };
}

export default function Show({ ticket }: Props) {
    const [message, setMessage] = useState('');
    const [isInternal, setIsInternal] = useState(false);

    const handleReply = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!message.trim()) {
            toast.error('Please enter a message');
            return;
        }

        router.post(route('tickets.reply', ticket.id), {
            message,
            is_internal: isInternal,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setMessage('');
                setIsInternal(false);
                toast.success('Reply sent successfully');
            },
            onError: () => {
                toast.error('Failed to send reply');
            }
        });
    };

    const statusColors = {
        open: "bg-blue-100 text-blue-800",
        in_progress: "bg-yellow-100 text-yellow-800",
        resolved: "bg-green-100 text-green-800",
        closed: "bg-gray-100 text-gray-800",
    };

    const priorityColors = {
        low: "bg-gray-100 text-gray-800",
        medium: "bg-blue-100 text-blue-800",
        high: "bg-yellow-100 text-yellow-800",
        urgent: "bg-red-100 text-red-800",
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`View Ticket - ${ticket.subject}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between">
                    <Link href={route('admin.tickets.index')}>
                        <Button variant="outline" className="cursor-pointer">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Tickets
                        </Button>
                    </Link>
                    <div className="flex gap-2">
                        {ticket.status === 'open' && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => router.put(route('tickets.update', ticket.id), {
                                        status: 'in_progress'
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                        onSuccess: () => toast.success('Ticket marked as in progress')
                                    })}
                                >
                                    Mark as In Progress
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.put(route('tickets.update', ticket.id), {
                                        status: 'resolved'
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                        onSuccess: () => toast.success('Ticket marked as resolved')
                                    })}
                                >
                                    Mark as Resolved
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.put(route('tickets.update', ticket.id), {
                                        status: 'closed'
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                        onSuccess: () => toast.success('Ticket marked as closed')
                                    })}
                                >
                                    Mark as Closed
                                </Button>
                            </>
                        )}
                        {ticket.status === 'in_progress' && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => router.put(route('tickets.update', ticket.id), {
                                        status: 'open'
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                        onSuccess: () => toast.success('Ticket reopened')
                                    })}
                                >
                                    Reopen Ticket
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.put(route('tickets.update', ticket.id), {
                                        status: 'resolved'
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                        onSuccess: () => toast.success('Ticket marked as resolved')
                                    })}
                                >
                                    Mark as Resolved
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.put(route('tickets.update', ticket.id), {
                                        status: 'closed'
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                        onSuccess: () => toast.success('Ticket marked as closed')
                                    })}
                                >
                                    Mark as Closed
                                </Button>
                            </>
                        )}
                        {ticket.status === 'resolved' && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => router.put(route('tickets.update', ticket.id), {
                                        status: 'open'
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                        onSuccess: () => toast.success('Ticket reopened')
                                    })}
                                >
                                    Reopen Ticket
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.put(route('tickets.update', ticket.id), {
                                        status: 'closed'
                                    }, {
                                        preserveState: true,
                                        preserveScroll: true,
                                        onSuccess: () => toast.success('Ticket marked as closed')
                                    })}
                                >
                                    Mark as Closed
                                </Button>
                            </>
                        )}
                        {ticket.status === 'closed' && (
                            <Button
                                variant="outline"
                                onClick={() => router.put(route('tickets.update', ticket.id), {
                                    status: 'open'
                                }, {
                                    preserveState: true,
                                    preserveScroll: true,
                                    onSuccess: () => toast.success('Ticket reopened')
                                })}
                            >
                                Reopen Ticket
                            </Button>
                        )}
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (confirm('Are you sure you want to delete this ticket?')) {
                                    router.delete(route('tickets.destroy', ticket.id), {
                                        preserveState: true,
                                        onSuccess: () => {
                                            toast.success('Ticket deleted successfully');
                                            router.visit(route('admin.tickets.index'));
                                        }
                                    });
                                }
                            }}
                        >
                            Delete Ticket
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="p-6">
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-2xl font-semibold">{ticket.subject}</h2>
                                <p className="text-muted-foreground">Ticket Details</p>
                            </div>

                            <div className="space-y-2">
                                <div>
                                    <h3 className="font-medium">Description</h3>
                                    <p className="text-muted-foreground">{ticket.description}</p>
                                </div>

                                <div className="flex gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status as keyof typeof statusColors]}`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[ticket.priority as keyof typeof priorityColors]}`}>
                                        {ticket.priority}
                                    </span>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {ticket.category}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="font-medium">Created By</h3>
                                    <p className="text-muted-foreground">{ticket.user.name}</p>
                                </div>

                                <div>
                                    <h3 className="font-medium">Assigned To</h3>
                                    <p className="text-muted-foreground">{ticket.assignedTo?.name || 'Unassigned'}</p>
                                </div>

                                <div>
                                    <h3 className="font-medium">Created At</h3>
                                    <p className="text-muted-foreground">{formatDate(ticket.created_at)}</p>
                                </div>

                                <div>
                                    <h3 className="font-medium">Last Reply</h3>
                                    <p className="text-muted-foreground">{ticket.last_reply_at ? formatDate(ticket.last_reply_at) : 'No replies'}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex flex-col h-[600px]">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-2xl font-semibold">Conversation</h2>
                                    <p className="text-muted-foreground">Ticket replies and updates</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => document.getElementById('reply-form')?.scrollIntoView({ behavior: 'smooth' })}>
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Add Reply
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-4">
                                {ticket.replies.length === 0 ? (
                                    <div className="text-center py-8">
                                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground">No replies yet. Be the first to respond!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {ticket.replies.map((reply) => (
                                            <div key={reply.id} className="border rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <span className="text-sm font-medium text-primary">
                                                                {reply.user.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{reply.user.name}</p>
                                                            <p className="text-sm text-muted-foreground">{formatDate(reply.created_at)}</p>
                                                        </div>
                                                    </div>
                                                    {reply.is_internal && (
                                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                            Internal Note
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="prose prose-sm max-w-none">
                                                    <p className="text-muted-foreground whitespace-pre-wrap">{reply.message}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div id="reply-form" className="border-t pt-6 mt-4">
                                {ticket.status !== 'resolved' ? (
                                    <>
                                        <h3 className="text-lg font-medium mb-4">Add a Reply</h3>
                                        <form onSubmit={handleReply} className="space-y-4">
                                            <div>
                                                <label htmlFor="message" className="block text-sm font-medium text-muted-foreground mb-1">
                                                    Message
                                                </label>
                                                <textarea
                                                    id="message"
                                                    value={message}
                                                    onChange={(e) => setMessage(e.target.value)}
                                                    placeholder="Type your reply here..."
                                                    className="w-full rounded-lg border p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
                                                    rows={4}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id="internal"
                                                        checked={isInternal}
                                                        onChange={(e) => setIsInternal(e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    <label htmlFor="internal" className="text-sm text-muted-foreground">
                                                        Internal Note (only visible to staff)
                                                    </label>
                                                </div>
                                                <Button type="submit" disabled={!message.trim()}>
                                                    <Send className="h-4 w-4 mr-2" />
                                                    Send Reply
                                                </Button>
                                            </div>
                                        </form>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground">This ticket has been resolved. Reopen the ticket to add more replies.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
} 