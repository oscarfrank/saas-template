import { type ColumnDef } from '@tanstack/react-table';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Eye, MoreHorizontal, Pencil, Trash2, Copy, Share2, Download } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { formatDate } from "@/lib/utils";
import { useState } from 'react';
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';
import { useTenantRouter } from '@/hooks/use-tenant-router';

export type Ticket = {
    id: number;
    subject: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: 'technical' | 'billing' | 'account' | 'general';
    user_id: number;
    assigned_to: number | null;
    last_reply_at: string | null;
    created_at: string;
    updated_at: string;
    user: {
        name: string;
        email: string;
    };
    assignedTo?: {
        name: string;
        email: string;
    } | null;
};

interface TableColumnsProps {
    onDelete: (ticket: Ticket) => void;
}

export const createColumns = ({ onDelete }: TableColumnsProps): ColumnDef<Ticket>[] => [
    {
        id: "subject",
        accessorKey: "subject",
        header: "Subject",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const ticket = row.original;
            const tenantRouter = useTenantRouter();
            return (
                <Link 
                    href={tenantRouter.route('admin.tickets.show', { ticket: ticket.id })}
                    className="font-medium hover:underline cursor-pointer"
                >
                    {row.getValue("subject")}
                </Link>
            );
        },
    },
    {
        id: "status",
        accessorKey: "status",
        header: "Status",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            const statusColors = {
                open: "bg-blue-100 text-blue-800",
                in_progress: "bg-yellow-100 text-yellow-800",
                resolved: "bg-green-100 text-green-800",
                closed: "bg-gray-100 text-gray-800",
            };
            return (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
                    {status.replace('_', ' ')}
                </span>
            );
        },
    },
    {
        id: "priority",
        accessorKey: "priority",
        header: "Priority",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const priority = row.getValue("priority") as string;
            const priorityColors = {
                low: "bg-gray-100 text-gray-800",
                medium: "bg-blue-100 text-blue-800",
                high: "bg-yellow-100 text-yellow-800",
                urgent: "bg-red-100 text-red-800",
            };
            return (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[priority as keyof typeof priorityColors]}`}>
                    {priority}
                </span>
            );
        },
    },
    {
        id: "category",
        accessorKey: "category",
        header: "Category",
        enableSorting: true,
        enableHiding: true,
    },
    {
        id: "user",
        accessorKey: "user.name",
        header: "Created By",
        enableSorting: true,
        enableHiding: true,
    },
    {
        id: "last_reply_at",
        accessorKey: "last_reply_at",
        header: "Last Reply",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const date = row.getValue("last_reply_at") as string | null;
            return <div>{date ? formatDate(date) : 'No replies'}</div>;
        },
    },
    {
        id: "created_at",
        accessorKey: "created_at",
        header: "Created At",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            return <div>{formatDate(row.getValue("created_at"))}</div>;
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const ticket = row.original;
            const tenantRouter = useTenantRouter();
            const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
            const [isDeleting, setIsDeleting] = useState(false);

            const handleCopyId = () => {
                navigator.clipboard.writeText(String(ticket.id));
                toast.success('Ticket ID copied to clipboard');
            };

            const handleShare = () => {
                const url = tenantRouter.route('admin.tickets.show', { ticket: ticket.id });
                navigator.clipboard.writeText(url);
                toast.success('Ticket URL copied to clipboard');
            };

            const handleDelete = () => {
                setIsDeleting(true);
                tenantRouter.delete('tickets.destroy', { ticket: ticket.id }, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Ticket deleted successfully');
                        setIsDeleteDialogOpen(false);
                        tenantRouter.reload({
                            only: ['tickets', 'pagination'],
                            onSuccess: () => {
                                setIsDeleting(false);
                            },
                            onError: () => {
                                setIsDeleting(false);
                                toast.error('Failed to refresh data after deletion');
                            }
                        });
                    },
                    onError: () => {
                        toast.error('Failed to delete ticket');
                        setIsDeleting(false);
                    }
                });
            };

            return (
                <div className="flex items-center gap-2">
                    <Link href={tenantRouter.route('admin.tickets.show', { ticket: ticket.id })}>
                        <Button variant="outline" size="icon" className="cursor-pointer">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="cursor-pointer">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                                <Share2 className="mr-2 h-4 w-4" />
                                Share Ticket
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Ticket
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <CustomAlertDialog
                        isOpen={isDeleteDialogOpen}
                        onClose={() => setIsDeleteDialogOpen(false)}
                        onConfirm={handleDelete}
                        title="Are you sure?"
                        description={`This action cannot be undone. This will permanently delete the ticket "${ticket.subject}".`}
                        isLoading={isDeleting}
                    />
                </div>
            );
        },
    },
];
