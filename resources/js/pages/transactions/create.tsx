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
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transactions',
        href: '/transactions',
    },
    {
        title: 'Create Transaction',
        href: '/transactions/create',
    },
];

interface Props extends PageProps {
    currencies: { id: number; name: string; code: string }[];
    payment_methods: { id: number; name: string }[];
    users: { id: number; first_name: string; last_name: string; email: string }[];
}

export default function Create({ currencies, payment_methods, users }: Props) {
    const tenantRouter = useTenantRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        router.post(tenantRouter.route('transactions.store'), data, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Transaction created successfully');
                router.visit(tenantRouter.route('transactions.index'));
            },
            onError: (errors) => {
                toast.error('Failed to create transaction');
                setIsSubmitting(false);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Transaction" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={tenantRouter.route('transactions.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Create Transaction</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="reference_number">Reference Number</Label>
                            <Input
                                id="reference_number"
                                name="reference_number"
                                placeholder="Enter reference number"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="transaction_type">Transaction Type</Label>
                            <Select name="transaction_type" required>
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
                                placeholder="Enter amount"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="currency_id">Currency</Label>
                            <Select name="currency_id" required>
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
                            <Select name="status" required>
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
                            <Select name="payment_method_id">
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
                            <Label htmlFor="user_id">User</Label>
                            <Select name="user_id" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select user" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map((user) => (
                                        <SelectItem key={user.id} value={String(user.id)}>
                                            {user.first_name} {user.last_name} ({user.email})
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
                                placeholder="Enter external reference"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="failure_reason">Failure Reason</Label>
                            <Input
                                id="failure_reason"
                                name="failure_reason"
                                placeholder="Enter failure reason"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="failure_details">Failure Details</Label>
                            <Textarea
                                id="failure_details"
                                name="failure_details"
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
                            {isSubmitting ? 'Creating...' : 'Create Transaction'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
