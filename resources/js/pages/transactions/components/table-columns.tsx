import { type ColumnDef } from '@tanstack/react-table';
import { Link, router } from '@inertiajs/react';
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
import { formatCurrency } from "@/lib/utils";
import { useState } from 'react';
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';
import { useTenantRouter } from '@/hooks/use-tenant-router';


export type Transaction = {
    id: number;
    reference_number: string;
    user_id: number;
    transaction_type: string;
    category: string | null;
    amount: number;
    currency_id: number;
    fee_amount: number;
    tax_amount: number;
    net_amount: number;
    status: string;
    payment_method_id: number | null;
    external_reference: string | null;
    initiated_at: string | null;
    processed_at: string | null;
    completed_at: string | null;
    failed_at: string | null;
    cancelled_at: string | null;
    failure_reason: string | null;
    failure_details: string | null;
    created_at: string;
    updated_at: string;
};

interface TableColumnsProps {
    onDelete: (transaction: Transaction) => void;
}

export const createColumns = ({ onDelete }: TableColumnsProps): ColumnDef<Transaction>[] => [
    {
        id: "reference_number",
        accessorKey: "reference_number",
        header: "Reference",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const transaction = row.original;
            return (
                <Link 
                    href={route('transactions.show', transaction.id)}
                    className="font-medium hover:underline cursor-pointer"
                >
                    {row.getValue("reference_number")}
                </Link>
            );
        },
    },
    {
        id: "transaction_type",
        accessorKey: "transaction_type",
        header: "Type",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const type = row.getValue("transaction_type") as string;
            return <div className="capitalize">{type.replace(/_/g, ' ')}</div>;
        },
    },
    {
        id: "amount",
        accessorKey: "amount",
        header: "Amount",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"));
            return <div className="font-medium">{formatCurrency(amount)}</div>;
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
            return <div className="capitalize">{status}</div>;
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
            const transaction = row.original;
            const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
            const [isDeleting, setIsDeleting] = useState(false);

            const handleCopyId = () => {
                navigator.clipboard.writeText(String(transaction.id));
                toast.success('Transaction ID copied to clipboard');
            };

            const handleShare = () => {
                const url = route('transactions.show', transaction.id);
                navigator.clipboard.writeText(url);
                toast.success('Transaction URL copied to clipboard');
            };

            const handleDelete = () => {
                setIsDeleting(true);
                router.delete(route('transactions.destroy', transaction.id), {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Transaction deleted successfully');
                        setIsDeleteDialogOpen(false);
                        router.reload({
                            only: ['transactions', 'pagination'],
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
                        toast.error('Failed to delete transaction');
                        setIsDeleting(false);
                    }
                });
            };

            return (
                <div className="flex items-center gap-2">
                    <Link href={route('transactions.show', transaction.id)}>
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
                            <DropdownMenuItem asChild>
                                <Link href={route('transactions.edit', transaction.id)} className="cursor-pointer">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Transaction
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleCopyId} className="cursor-pointer">
                                <Copy className="mr-2 h-4 w-4" />
                                Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                                <Share2 className="mr-2 h-4 w-4" />
                                Share Transaction
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Transaction
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <CustomAlertDialog
                        isOpen={isDeleteDialogOpen}
                        onClose={() => setIsDeleteDialogOpen(false)}
                        onConfirm={handleDelete}
                        title="Are you sure?"
                        description={`This action cannot be undone. This will permanently delete the transaction "${transaction.reference_number}".`}
                        isLoading={isDeleting}
                    />
                </div>
            );
        },
    },
];
