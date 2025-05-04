import { PageProps } from '@inertiajs/core';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { useState } from 'react';
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';
import { formatCurrency } from "@/lib/utils";

interface Props extends PageProps {
    transaction: {
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
}

export default function Show({ transaction }: Props) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(route('transactions.destroy', transaction.id), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Transaction deleted successfully');
                router.visit(route('transactions.index'));
            },
            onError: () => {
                toast.error('Failed to delete transaction');
                setIsDeleting(false);
            }
        });
    };

    return (
        <>
            <Head title={`Transaction ${transaction.reference_number}`} />
            <div className="container mx-auto py-6">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={route('transactions.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Transaction Details</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Basic Information</h2>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Reference Number:</span>
                                    <span className="font-medium">{transaction.reference_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Type:</span>
                                    <span className="font-medium capitalize">{transaction.transaction_type.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status:</span>
                                    <span className="font-medium capitalize">{transaction.status}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Amount:</span>
                                    <span className="font-medium">{formatCurrency(transaction.amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Net Amount:</span>
                                    <span className="font-medium">{formatCurrency(transaction.net_amount)}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold mb-2">Timestamps</h2>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Created At:</span>
                                    <span className="font-medium">{new Date(transaction.created_at).toLocaleString()}</span>
                                </div>
                                {transaction.initiated_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Initiated At:</span>
                                        <span className="font-medium">{new Date(transaction.initiated_at).toLocaleString()}</span>
                                    </div>
                                )}
                                {transaction.processed_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Processed At:</span>
                                        <span className="font-medium">{new Date(transaction.processed_at).toLocaleString()}</span>
                                    </div>
                                )}
                                {transaction.completed_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Completed At:</span>
                                        <span className="font-medium">{new Date(transaction.completed_at).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Additional Information</h2>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Category:</span>
                                    <span className="font-medium">{transaction.category || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Fee Amount:</span>
                                    <span className="font-medium">{formatCurrency(transaction.fee_amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tax Amount:</span>
                                    <span className="font-medium">{formatCurrency(transaction.tax_amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">External Reference:</span>
                                    <span className="font-medium">{transaction.external_reference || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {transaction.failure_reason && (
                            <div>
                                <h2 className="text-lg font-semibold mb-2">Failure Information</h2>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Reason:</span>
                                        <span className="font-medium">{transaction.failure_reason}</span>
                                    </div>
                                    {transaction.failure_details && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Details:</span>
                                            <span className="font-medium">{transaction.failure_details}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <Button variant="outline" asChild>
                        <Link href={route('transactions.edit', transaction.id)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Transaction
                        </Link>
                    </Button>
                    <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Transaction
                    </Button>
                </div>

                <CustomAlertDialog
                    isOpen={isDeleteDialogOpen}
                    onClose={() => setIsDeleteDialogOpen(false)}
                    onConfirm={handleDelete}
                    title="Are you sure?"
                    description={`This action cannot be undone. This will permanently delete the transaction "${transaction.reference_number}".`}
                    isLoading={isDeleting}
                />
            </div>
        </>
    );
} 