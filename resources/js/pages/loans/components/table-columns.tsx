import { type ColumnDef } from '@tanstack/react-table';
import { Link } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Button } from '@/components/ui/button';
import { 
    Eye, 
    MoreHorizontal, 
    Pencil, 
    Trash2, 
    Copy, 
    Share2, 
    CheckCircle2, 
    XCircle, 
    DollarSign, 
    FileText,
    AlertCircle,
    MessageSquare,
    Edit,
    CheckCircle
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { formatCurrency } from "@/lib/utils";
import { useState } from 'react';
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export type Loan = {
    id: number;
    reference_number: string;
    user: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    };
    amount: number;
    currency: {
        id: number;
        code: string;
        symbol: string;
    };
    status: string;
    interest_rate: number;
    interest_type: string;
    interest_calculation: string;
    interest_payment_frequency: string;
    duration_days: number;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
    updated_at: string;
    package?: {
        id: number;
        name: string;
    };
    custom_package?: {
        id: number;
        name: string;
    };
    purpose: string;
    monthly_payment_amount: number;
    total_payments: number;
    completed_payments: number;
    principal_paid: number;
    interest_paid: number;
    fees_paid: number;
    principal_remaining: number;
    total_amount_due: number;
    current_balance: number;
    days_past_due: number;
    next_payment_due_date: string | null;
    next_payment_amount: number | null;
    last_payment_date: string | null;
    last_payment_amount: number | null;
};

interface TableColumnsProps {
    onDelete: (id: number) => void;
}

const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
        pending: 'bg-yellow-500',
        approved: 'bg-blue-500',
        rejected: 'bg-red-500',
        active: 'bg-green-500',
        in_arrears: 'bg-orange-500',
        defaulted: 'bg-red-600',
        paid: 'bg-green-600',
        cancelled: 'bg-red-400'
    };
    return colors[status] || 'bg-gray-500';
};

const canApprove = (status: string) => ['pending_approval'].includes(status);
const canReject = (status: string) => ['pending_approval', 'approved'].includes(status);
const canDisburse = (status: string) => ['approved'].includes(status);
const canMarkAsPaid = (status: string) => ['active', 'in_arrears'].includes(status);
const canClose = (status: string) => ['paid', 'defaulted'].includes(status);
const canCancel = (status: string) => ['draft', 'pending_approval', 'approved'].includes(status);

export const createColumns = ({ onDelete }: TableColumnsProps): ColumnDef<Loan>[] => [
    {
        id: "reference_number",
        accessorKey: "reference_number",
        header: "Reference",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const loan = row.original;
            const tenantRouter = useTenantRouter();
            return (
                <Link 
                    href={tenantRouter.route('loans.show', { loan: loan.id })}
                    className="font-medium hover:underline cursor-pointer"
                >
                    {row.getValue("reference_number")}
                </Link>
            );
        },
    },
    {
        id: "user",
        accessorFn: (row) => `${row.user.first_name} ${row.user.last_name}`,
        header: "Borrower",
        enableSorting: true,
    },
    {
        id: "amount",
        accessorKey: "amount",
        header: "Amount",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"));
            const currency = row.original.currency.code;
            return <div className="font-medium">{formatCurrency(amount, currency)}</div>;
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
            return (
                <Badge className={`${getStatusColor(status)} text-white`}>
                    {status.replace('_', ' ').toUpperCase()}
                </Badge>
            );
        },
    },
    {
        id: "interest_rate",
        accessorKey: "interest_rate",
        header: "Interest Rate",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const rate = parseFloat(row.getValue("interest_rate"));
            return <div>{rate.toFixed(2)}%</div>;
        },
    },
    {
        id: "duration_days",
        accessorKey: "duration_days",
        header: "Duration",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const days = row.getValue("duration_days") as number;
            return <div>{days} days</div>;
        },
    },
    {
        id: "start_date",
        accessorKey: "start_date",
        header: "Start Date",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const date = row.getValue("start_date");
            return <div>{date ? new Date(date as string).toLocaleDateString() : 'N/A'}</div>;
        },
    },
    {
        id: "end_date",
        accessorKey: "end_date",
        header: "End Date",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const date = row.getValue("end_date");
            return <div>{date ? new Date(date as string).toLocaleDateString() : 'N/A'}</div>;
        },
    },
    {
        id: "created_at",
        accessorKey: "created_at",
        header: "Created At",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            return <div>{new Date(row.getValue("created_at")).toLocaleDateString()}</div>;
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const loan = row.original;
            const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
            const [isDeleting, setIsDeleting] = useState(false);
            const tenantRouter = useTenantRouter();

            const handleCopyId = () => {
                navigator.clipboard.writeText(String(loan.id));
                toast.success('Loan ID copied to clipboard');
            };

            const handleShare = () => {
                const url = tenantRouter.route('loans.show', { loan: loan.id });
                navigator.clipboard.writeText(url);
                toast.success('Loan URL copied to clipboard');
            };

            const handleDelete = () => {
                setIsDeleting(true);
                tenantRouter.delete('loans.destroy', { loan: loan.id }, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Loan deleted successfully');
                        setIsDeleteDialogOpen(false);
                        tenantRouter.reload({
                            only: ['loans', 'pagination'],
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
                        setIsDeleting(false);
                        toast.error('Failed to delete loan');
                    }
                });
            };

            const handleStatusChange = (newStatus: string, action: string) => {
                tenantRouter.put('loans.update-status', { status: newStatus }, { id: loan.id }, {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success(`Loan ${action} successfully`);
                        tenantRouter.reload({
                            only: ['loans', 'pagination']
                        });
                    },
                    onError: () => {
                        toast.error(`Failed to ${action} loan`);
                    }
                });
            };

            return (
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={handleCopyId}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleShare}>
                                <Share2 className="mr-2 h-4 w-4" />
                                Share
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={tenantRouter.route('loans.show', { loan: loan.id })}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={tenantRouter.route('loans.edit', { loan: loan.id })}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </DropdownMenuItem>
                            {canApprove(loan.status) && (
                                <DropdownMenuItem onClick={() => handleStatusChange('approved', 'approve')}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Approve
                                </DropdownMenuItem>
                            )}
                            {canReject(loan.status) && (
                                <DropdownMenuItem onClick={() => handleStatusChange('rejected', 'reject')}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                </DropdownMenuItem>
                            )}
                            {canDisburse(loan.status) && (
                                <DropdownMenuItem onClick={() => handleStatusChange('active', 'disburse')}>
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Disburse
                                </DropdownMenuItem>
                            )}
                            {canMarkAsPaid(loan.status) && (
                                <DropdownMenuItem onClick={() => handleStatusChange('paid', 'mark as paid')}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark as Paid
                                </DropdownMenuItem>
                            )}
                            {canClose(loan.status) && (
                                <DropdownMenuItem onClick={() => handleStatusChange('closed', 'close')}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Close
                                </DropdownMenuItem>
                            )}
                            {canCancel(loan.status) && (
                                <DropdownMenuItem onClick={() => handleStatusChange('cancelled', 'cancel')}>
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    Cancel
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <CustomAlertDialog
                        isOpen={isDeleteDialogOpen}
                        onClose={() => setIsDeleteDialogOpen(false)}
                        onConfirm={handleDelete}
                        title="Delete Loan"
                        description={`Are you sure you want to delete loan "${loan.reference_number}"? This action cannot be undone.`}
                        isLoading={isDeleting}
                    />
                </div>
            );
        },
    },
];
