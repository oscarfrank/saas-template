import { PageProps } from '@inertiajs/core';
import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTenantRouter } from '@/hooks/use-tenant-router';


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
    currencies: { id: number; name: string; code: string }[];
    payment_methods: { id: number; name: string }[];
}

export default function Edit({ transaction, currencies, payment_methods }: Props) {
    const tenantRouter = useTenantRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        router.put(route('transactions.update', transaction.id), data, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Transaction updated successfully');
                router.visit(route('transactions.index'));
            },
            onError: (errors) => {
                toast.error('Failed to update transaction');
                setIsSubmitting(false);
            }
        });
    };

    return (
        <>
            <Head title={`Edit Transaction ${transaction.reference_number}`} />
            <div className="container mx-auto py-6">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={tenantRouter.route('transactions.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Edit Transaction</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="reference_number">Reference Number</Label>
                            <Input
                                id="reference_number"
                                name="reference_number"
                                defaultValue={transaction.reference_number}
                                placeholder="Enter reference number"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="transaction_type">Transaction Type</Label>
                            <Select name="transaction_type" required defaultValue={transaction.transaction_type}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="loan_disbursement">Loan Disbursement</SelectItem>
                                    <SelectItem value="loan_repayment">Loan Repayment</SelectItem>
                                    <SelectItem value="loan_interest_payment">Loan Interest Payment</SelectItem>
                                    <SelectItem value="loan_fee_payment">Loan Fee Payment</SelectItem>
                                    <SelectItem value="loan_late_fee">Loan Late Fee</SelectItem>
                                    <SelectItem value="investment_deposit">Investment Deposit</SelectItem>
                                    <SelectItem value="interest_payout">Interest Payout</SelectItem>
                                    <SelectItem value="principal_return">Principal Return</SelectItem>
                                    <SelectItem value="early_withdrawal">Early Withdrawal</SelectItem>
                                    <SelectItem value="investment_fee">Investment Fee</SelectItem>
                                    <SelectItem value="deposit">Deposit</SelectItem>
                                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                                    <SelectItem value="transfer">Transfer</SelectItem>
                                    <SelectItem value="fee">Fee</SelectItem>
                                    <SelectItem value="adjustment">Adjustment</SelectItem>
                                    <SelectItem value="refund">Refund</SelectItem>
                                    <SelectItem value="reversal">Reversal</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                defaultValue={transaction.amount}
                                placeholder="Enter amount"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="currency_id">Currency</Label>
                            <Select name="currency_id" required defaultValue={String(transaction.currency_id)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    {currencies.map((currency) => (
                                        <SelectItem key={currency.id} value={String(currency.id)}>
                                            {currency.name} ({currency.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select name="status" required defaultValue={transaction.status}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="reversed">Reversed</SelectItem>
                                    <SelectItem value="refunded">Refunded</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="payment_method_id">Payment Method</Label>
                            <Select name="payment_method_id" defaultValue={transaction.payment_method_id ? String(transaction.payment_method_id) : undefined}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    {payment_methods.map((method) => (
                                        <SelectItem key={method.id} value={String(method.id)}>
                                            {method.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="external_reference">External Reference</Label>
                            <Input
                                id="external_reference"
                                name="external_reference"
                                defaultValue={transaction.external_reference ?? ''}
                                placeholder="Enter external reference"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Input
                                id="category"
                                name="category"
                                defaultValue={transaction.category ?? ''}
                                placeholder="Enter category"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="failure_reason">Failure Reason</Label>
                            <Input
                                id="failure_reason"
                                name="failure_reason"
                                defaultValue={transaction.failure_reason ?? ''}
                                placeholder="Enter failure reason"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="failure_details">Failure Details</Label>
                            <Textarea
                                id="failure_details"
                                name="failure_details"
                                defaultValue={transaction.failure_details ?? ''}
                                placeholder="Enter failure details"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button variant="outline" asChild>
                            <Link href={tenantRouter.route('transactions.index')}>
                                Cancel
                            </Link>
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Updating...' : 'Update Transaction'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
} 