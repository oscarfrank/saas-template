import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EditForm } from './components/edit-form';
import { CheckCircle, XCircle, DollarSign, PlayCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTenantRouter } from '@/hooks/use-tenant-router';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Loans',
        href: '/loans',
    },
    {
        title: 'Edit Loan',
        href: '/loans/edit',
    },
];

interface Loan {
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
    duration_days: number;
    start_date: string;
    end_date: string;
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
    next_payment_due_date: string;
    next_payment_amount: number;
    last_payment_date: string;
    last_payment_amount: number;
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
    interest_type: string;
    interest_calculation: string;
    interest_payment_frequency: string;
}

interface Props {
    loan: Loan;
    users: Array<{ 
        id: number; 
        first_name: string; 
        last_name: string; 
        email: string; 
    }>;
    currencies: Array<{ id: number; code: string; symbol: string }>;
    packages: Array<{ id: number; name: string }>;
    customPackages: Array<{ id: number; name: string }>;
    payment_methods: Array<{ id: number; name: string }>;
}

export default function Edit({ loan, users, currencies, packages, customPackages, payment_methods }: Props) {
    const tenantRouter = useTenantRouter();
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);
    const [approvalNotes, setApprovalNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [disbursementTransactionId, setDisbursementTransactionId] = useState('');

    const handleStatusUpdate = (newStatus: string) => {
        setPendingStatus(newStatus);
        setApprovalNotes('');
        setRejectionReason('');
        setPaymentMethodId('');
        setDisbursementTransactionId('');
        setStatusDialogOpen(true);
    };

    const confirmStatusUpdate = () => {
        if (!pendingStatus) return;
        
        const data: any = {
            status: pendingStatus
        };

        if (pendingStatus === 'approved') {
            data.approval_notes = approvalNotes;
        } else if (pendingStatus === 'rejected') {
            data.rejection_reason = rejectionReason;
        } else if (pendingStatus === 'active') {
            data.payment_method_id = paymentMethodId;
            data.disbursement_transaction_id = disbursementTransactionId;
            data.start_date = new Date().toISOString().split('T')[0];
            data.end_date = new Date(Date.now() + loan.duration_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }
        
        tenantRouter.put('loans.update-status', data, { id: loan.id }, {
            onSuccess: () => {
                toast.success(`Loan status updated to ${pendingStatus}`);
                setStatusDialogOpen(false);
                setPendingStatus(null);
                setApprovalNotes('');
                setRejectionReason('');
                setPaymentMethodId('');
                setDisbursementTransactionId('');
            },
            onError: (errors) => {
                toast.error('Failed to update loan status');
                setStatusDialogOpen(false);
                setPendingStatus(null);
                setApprovalNotes('');
                setRejectionReason('');
                setPaymentMethodId('');
                setDisbursementTransactionId('');
            }
        });
    };

    const handleDelete = () => {
        if (deleteConfirmation !== loan.reference_number) {
            toast.error('Please enter the correct loan reference number');
            return;
        }

        tenantRouter.delete('loans.destroy', { loan: loan.id }, {
            onSuccess: () => {
                toast.success('Loan deleted successfully');
                tenantRouter.visit('loans.index');
            },
            onError: () => {
                toast.error('Failed to delete loan');
            }
        });
    };

    const getStatusActionButtons = () => {
        const buttons = [];
        
        switch (loan.status) {
            case 'pending':
                buttons.push(
                    <Button
                        key="approve"
                        variant="default"
                        onClick={() => handleStatusUpdate('approved')}
                        className="bg-green-600 hover:bg-green-700 cursor-pointer"
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Loan
                    </Button>,
                    <Button
                        key="reject"
                        variant="destructive"
                        onClick={() => handleStatusUpdate('rejected')}
                        className="cursor-pointer"
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject Loan
                    </Button>
                );
                break;
            case 'approved':
                buttons.push(
                    <Button
                        key="activate"
                        variant="default"
                        onClick={() => handleStatusUpdate('active')}
                        className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                    >
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Activate Loan
                    </Button>
                );
                break;
            case 'active':
            case 'in_arrears':
                buttons.push(
                    <Button
                        key="mark-paid"
                        variant="default"
                        onClick={() => handleStatusUpdate('paid')}
                        className="bg-green-600 hover:bg-green-700 cursor-pointer"
                    >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Mark as Paid
                    </Button>
                );
                break;
        }

        if (['pending', 'approved', 'active', 'in_arrears'].includes(loan.status)) {
            buttons.push(
                <Button
                    key="cancel"
                    variant="destructive"
                    onClick={() => handleStatusUpdate('cancelled')}
                    className="cursor-pointer"
                >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Loan
                </Button>
            );
        }

        return buttons;
    };

    const fields = [
        { 
            name: 'user_id', 
            type: 'select' as const, 
            label: 'Borrower', 
            required: true,
            options: users.map(user => ({ 
                value: user.id.toString(), 
                label: `${user.first_name} ${user.last_name}` 
            })),
            defaultValue: loan.user.id.toString()
        },
        { 
            name: 'package_id', 
            type: 'select' as const, 
            label: 'Loan Package', 
            required: true,
            options: packages.map(pkg => ({ value: pkg.id.toString(), label: pkg.name })),
            optionLabel: 'name',
            optionValue: 'id'
        },
        { 
            name: 'custom_package_id', 
            type: 'select' as const, 
            label: 'Custom Package', 
            required: false,
            options: customPackages.map(pkg => ({ value: pkg.id.toString(), label: pkg.name })),
            optionLabel: 'name',
            optionValue: 'id'
        },
        { 
            name: 'amount', 
            type: 'number' as const, 
            label: 'Loan Amount', 
            required: true,
            min: 0
        },
        { 
            name: 'currency_id', 
            type: 'select' as const, 
            label: 'Currency', 
            required: true,
            options: currencies.map(currency => ({ value: currency.id.toString(), label: `${currency.code} (${currency.symbol})` })),
            optionLabel: 'code',
            optionValue: 'id'
        },
        { 
            name: 'interest_rate', 
            type: 'number' as const, 
            label: 'Interest Rate (%)', 
            required: true,
            min: 0,
            step: 0.01
        },
        { 
            name: 'interest_type', 
            type: 'select' as const, 
            label: 'Interest Type', 
            required: true,
            options: [
                { value: 'simple', label: 'Simple' },
                { value: 'compound', label: 'Compound' }
            ]
        },
        { 
            name: 'interest_calculation', 
            type: 'select' as const, 
            label: 'Interest Calculation', 
            required: true,
            options: [
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' }
            ]
        },
        { 
            name: 'interest_payment_frequency', 
            type: 'select' as const, 
            label: 'Payment Frequency', 
            required: true,
            options: [
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'biweekly', label: 'Bi-weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'yearly', label: 'Yearly' },
                { value: 'end_of_term', label: 'End of Term' }
            ]
        },
        { 
            name: 'duration_days', 
            type: 'number' as const, 
            label: 'Duration (days)', 
            required: true,
            min: 1
        },
        { 
            name: 'purpose', 
            type: 'textarea' as const, 
            label: 'Purpose', 
            required: false
        },
        { 
            name: 'start_date', 
            type: 'date' as const, 
            label: 'Start Date', 
            required: true
        },
        { 
            name: 'end_date', 
            type: 'date' as const, 
            label: 'End Date', 
            required: true
        },
        { 
            name: 'status', 
            type: 'select' as const, 
            label: 'Status', 
            required: true,
            options: [
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'active', label: 'Active' },
                { value: 'in_arrears', label: 'In Arrears' },
                { value: 'defaulted', label: 'Defaulted' },
                { value: 'paid', label: 'Paid' },
                { value: 'cancelled', label: 'Cancelled' }
            ]
        }
    ];

    // Filter out the current user from the users list if editing
    const availableUsers = users.filter(user => user.id !== loan.user.id);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Loan - ${loan.reference_number}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <Link href={route('loans.index')}>
                        <Button variant="outline" className="cursor-pointer">
                            Cancel
                        </Button>
                    </Link>
                    <div className="flex gap-2">
                        {getStatusActionButtons()}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Status Update</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to update this loan's status to {pendingStatus?.replace('_', ' ').toUpperCase()}?
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        
                        {pendingStatus === 'approved' && (
                            <div className="mt-4">
                                <Label htmlFor="approval_notes">Approval Notes</Label>
                                <Textarea
                                    id="approval_notes"
                                    value={approvalNotes}
                                    onChange={(e) => setApprovalNotes(e.target.value)}
                                    placeholder="Enter any notes about the approval..."
                                    className="mt-1"
                                />
                            </div>
                        )}
                        
                        {pendingStatus === 'rejected' && (
                            <div className="mt-4">
                                <Label htmlFor="rejection_reason">Reason for Rejection</Label>
                                <Textarea
                                    id="rejection_reason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Enter the reason for rejection..."
                                    className="mt-1"
                                    required
                                />
                            </div>
                        )}

                        {pendingStatus === 'active' && (
                            <div className="mt-4 space-y-4">
                                <div>
                                    <Label htmlFor="payment_method">Payment Method</Label>
                                    <Select
                                        value={paymentMethodId}
                                        onValueChange={setPaymentMethodId}
                                        required
                                    >
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
                                <div>
                                    <Label htmlFor="disbursement_transaction_id">Disbursement Transaction ID</Label>
                                    <Input
                                        id="disbursement_transaction_id"
                                        value={disbursementTransactionId}
                                        onChange={(e) => setDisbursementTransactionId(e.target.value)}
                                        placeholder="Enter disbursement transaction ID"
                                        required
                                    />
                                </div>
                            </div>
                        )}
                        
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={confirmStatusUpdate}
                                disabled={
                                    (pendingStatus === 'rejected' && !rejectionReason) ||
                                    (pendingStatus === 'approved' && !approvalNotes) ||
                                    (pendingStatus === 'active' && (!paymentMethodId || !disbursementTransactionId))
                                }
                            >
                                Confirm
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Loan</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the loan
                                and all associated data. To confirm, please enter the loan reference number:
                                <span className="font-semibold ml-1">{loan.reference_number}</span>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="mt-4">
                            <Label htmlFor="delete_confirmation">Loan Reference Number</Label>
                            <Input
                                id="delete_confirmation"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                placeholder="Enter loan reference number"
                                className="mt-1"
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                                disabled={deleteConfirmation !== loan.reference_number}
                            >
                                Delete Loan
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <EditForm
                    entity={loan}
                    fields={fields}
                    entityName="loan"
                    onSubmit={(formData) => {
                        // The form submission is handled by the EditForm component
                    }}
                    processing={false}
                    errors={{}}
                    availableUsers={availableUsers}
                />
            </div>
        </AppLayout>
    );
} 