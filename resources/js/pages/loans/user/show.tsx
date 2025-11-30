import { PageProps } from '@/types';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, FileText, MessageSquare, DollarSign, Image as ImageIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import PaymentForm from '@/components/PaymentForm';
import PaymentHistory from '@/components/PaymentHistory';
import { useTenantRouter } from '@/hooks/use-tenant-router';

interface Loan {
    id: number;
    reference_number: string;
    user: {
        id: number;
        name: string;
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
    current_interest_due: number;
    days_past_due: number;
    next_payment_due_date: string;
    next_payment_amount: number;
    last_payment_date: string;
    last_payment_amount: number;
    created_at: string;
    updated_at: string;
    origination_fee_amount: number;
    platform_fee_amount: number;
    late_payment_fee_fixed: number;
    late_payment_fee_percentage: number;
    early_repayment_fixed_fee: number;
    early_repayment_fee_percentage: number;
    early_repayment_period_days: number;
    grace_period_days: number;
    has_collateral: boolean;
    collateral_description: string;
    allows_early_repayment: boolean;
    documents: Array<{
        id: number;
        name: string;
        type: string;
        file_path: string;
        file_size: number;
        mime_type: string;
        description: string;
        uploaded_by: number;
        uploadedBy: {
            id: number;
            name: string;
        };
        created_at: string;
        updated_at: string;
    }>;
    notes: Array<{
        id: number;
        content: string;
        created_by: {
            id: number;
            name: string;
        };
        updated_by: {
            id: number;
            name: string;
        };
        created_at: string;
        updated_at: string;
    }>;
    payments?: Payment[];
}

interface PaymentMethod {
    id: number;
    name: string;
    method_type: string;
    is_online: boolean;
    callback_url?: string;
    configuration?: Record<string, any>;
}

interface PaymentBreakdown {
    total_payment: number;
    late_fees_amount: number;
    early_repayment_fees_amount: number;
    fees_amount: number;
    interest_amount: number;
    principal_amount: number;
    remaining_payment: number;
}

interface Payment {
    id: number;
    payment_number: number;
    amount: number;
    status: string;
    due_date: string;
    payment_at?: string;
    approved_at?: string;
    payer_name: string;
    notes?: string;
    attachment?: string;
    payment_method?: {
        id: number;
        name: string;
        method_type: string;
    };
    late_fees_amount?: number;
    early_repayment_fees_amount?: number;
    fees_amount?: number;
    interest_amount?: number;
    principal_amount?: number;
    remaining_payment?: number;
}

interface Props extends PageProps {
    loan: Loan;
    payment_methods: Array<PaymentMethod>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'My Loans',
        href: '/loans',
    },
    {
        title: 'Loan Details',
        href: '/loans/view',
    },
];

export default function Show({ loan, payment_methods }: Props) {
    const tenantRouter = useTenantRouter();

    const { data: documentData, setData: setDocumentData, post: postDocument, processing: documentProcessing } = useForm({
        file: null as File | null,
        type: '',
        description: '',
    });

    const { data: paymentData, setData: setPaymentData, post: postPayment, processing: paymentProcessing } = useForm({
        payment_method_id: '',
        amount: loan.next_payment_amount?.toString() || '',
        payment_proof: null as File | null,
        notes: '',
    });

    const [activeTab, setActiveTab] = useState('details');
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const paymentsTabRef = useRef<HTMLDivElement>(null);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [paymentBreakdownOpen, setPaymentBreakdownOpen] = useState(false);
    const [selectedPaymentBreakdown, setSelectedPaymentBreakdown] = useState<PaymentBreakdown | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<string>('');
    const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown | null>(null);

    const handleDocumentUpload = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        if (documentData.file) {
            formData.append('file', documentData.file);
            formData.append('name', documentData.file.name);
        }
        formData.append('type', documentData.type);
        formData.append('description', documentData.description);

        postDocument(tenantRouter.route('loans.documents.upload', { id: loan.id }), {
            onSuccess: () => {
                toast.success('Document uploaded successfully');
                setDocumentData({
                    file: null,
                    type: '',
                    description: '',
                });
            },
            onError: (errors: Record<string, string>) => {
                Object.values(errors).forEach((error) => {
                    toast.error(error);
                });
            },
        });
    };

    const handlePaymentSubmit = (formData: FormData, paymentType: 'online' | 'offline') => {
        if (paymentType === 'online') {
            // For online payments, we'll redirect to the payment gateway
            tenantRouter.post('loans.payments.store', formData, { loan: loan.id }, {
                onSuccess: () => {
                    toast.success('Payment submitted successfully');
                    setShowPaymentForm(false);
                    setPaymentDialogOpen(false);
                    // Refresh the current page instead of redirecting
                    tenantRouter.reload();
                },
                onError: (errors: Record<string, string>) => {
                    Object.values(errors).forEach((error) => {
                        toast.error(error);
                    });
                },
            });
        } else {
            // For offline payments, we'll submit normally
            tenantRouter.post('loans.payments.store', formData, { loan: loan.id }, {
                onSuccess: () => {
                    toast.success('Payment submitted successfully');
                    setShowPaymentForm(false);
                    setPaymentDialogOpen(false);
                    // Refresh the current page instead of redirecting
                    tenantRouter.reload();
                },
                onError: (errors: Record<string, string>) => {
                    Object.values(errors).forEach((error) => {
                        toast.error(error);
                    });
                },
            });
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-500',
            approved: 'bg-blue-500',
            rejected: 'bg-red-500',
            active: 'bg-green-500',
            in_arrears: 'bg-orange-500',
            defaulted: 'bg-red-600',
            paid: 'bg-green-600',
            cancelled: 'bg-red-400',
            // Payment status colors
            scheduled: 'bg-blue-500',
            due: 'bg-yellow-500',
            processing: 'bg-blue-500',
            completed: 'bg-green-500',
            failed: 'bg-red-500',
            waived: 'bg-purple-500',
            partial: 'bg-orange-500'
        };
        return colors[status] || 'bg-gray-500';
    };

    const handlePreviewImage = (payment: Payment) => {
        if (payment.attachment) {
            setPreviewImage(tenantRouter.route('loans.payments.download-proof', { id: loan.id, paymentId: payment.id }));
            setPreviewOpen(true);
        }
    };

    const handleMakePaymentClick = () => {
        setPaymentAmount(loan.next_payment_amount?.toString() || '');
        setPaymentBreakdown(calculatePaymentBreakdown(loan.next_payment_amount || 0));
        setPaymentDialogOpen(true);
    };

    const handleShowPaymentBreakdown = (payment: Payment) => {
        setSelectedPaymentBreakdown({
            total_payment: payment.amount,
            late_fees_amount: payment.late_fees_amount || 0,
            early_repayment_fees_amount: payment.early_repayment_fees_amount || 0,
            fees_amount: payment.fees_amount || 0,
            interest_amount: payment.interest_amount || 0,
            principal_amount: payment.principal_amount || 0,
            remaining_payment: payment.remaining_payment || 0,
        });
        setPaymentBreakdownOpen(true);
    };

    const calculatePaymentBreakdown = (amount: number) => {
        // Calculate days since loan start
        const startDate = new Date(loan.start_date);
        const currentDate = new Date();
        const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate if we're in grace period
        const isInGracePeriod = daysSinceStart <= loan.grace_period_days;
        
        // Calculate if this is an early repayment
        const isEarlyRepayment = daysSinceStart < loan.early_repayment_period_days;
        
        // Calculate late payment fee
        let lateFeesAmount = 0;
        if (!isInGracePeriod && loan.days_past_due > 0) {
            if (loan.late_payment_fee_fixed > 0) {
                lateFeesAmount = loan.late_payment_fee_fixed;
            } else if (loan.late_payment_fee_percentage > 0) {
                lateFeesAmount = loan.current_balance * (loan.late_payment_fee_percentage / 100);
            }
        }

        // Calculate early repayment fee
        let earlyRepaymentFeesAmount = 0;
        if (isEarlyRepayment && loan.allows_early_repayment) {
            if (loan.early_repayment_fixed_fee > 0) {
                earlyRepaymentFeesAmount = loan.early_repayment_fixed_fee;
            } else if (loan.early_repayment_fee_percentage > 0) {
                earlyRepaymentFeesAmount = loan.current_balance * (loan.early_repayment_fee_percentage / 100);
            }
        }

        // Calculate interest amount
        const interestAmount = loan.current_interest_due;

        // Calculate remaining amount after fees and interest
        let remainingAmount = amount - lateFeesAmount - earlyRepaymentFeesAmount - interestAmount;
        
        // Apply remaining amount to principal
        const principalAmount = Math.max(0, Math.min(remainingAmount, loan.principal_remaining));
        remainingAmount -= principalAmount;

        return {
            total_payment: amount,
            late_fees_amount: lateFeesAmount,
            early_repayment_fees_amount: earlyRepaymentFeesAmount,
            fees_amount: 0, // Fixed fees are already paid
            interest_amount: interestAmount,
            principal_amount: principalAmount,
            remaining_payment: remainingAmount
        };
    };

    const calculateMinimumPayment = () => {
        // Calculate days since loan start
        const startDate = new Date(loan.start_date);
        const currentDate = new Date();
        const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate if we're in grace period
        const isInGracePeriod = daysSinceStart <= loan.grace_period_days;
        
        // Calculate late payment fee if applicable
        let lateFeesAmount = 0;
        if (!isInGracePeriod && loan.days_past_due > 0) {
            if (loan.late_payment_fee_fixed > 0) {
                lateFeesAmount = loan.late_payment_fee_fixed;
            } else if (loan.late_payment_fee_percentage > 0) {
                lateFeesAmount = loan.current_balance * (loan.late_payment_fee_percentage / 100);
            }
        }

        // Calculate early repayment fee if applicable
        let earlyRepaymentFeesAmount = 0;
        if (daysSinceStart < loan.early_repayment_period_days && loan.allows_early_repayment) {
            if (loan.early_repayment_fixed_fee > 0) {
                earlyRepaymentFeesAmount = loan.early_repayment_fixed_fee;
            } else if (loan.early_repayment_fee_percentage > 0) {
                earlyRepaymentFeesAmount = loan.current_balance * (loan.early_repayment_fee_percentage / 100);
            }
        }

        // Minimum payment should cover all fees and interest
        return lateFeesAmount + earlyRepaymentFeesAmount + loan.current_interest_due;
    };

    const handleAmountChange = (value: string) => {
        setPaymentAmount(value);
        const amount = parseFloat(value) || 0;
        setPaymentBreakdown(calculatePaymentBreakdown(amount));
    };

    const handleProceedToPayment = () => {
        if (!paymentAmount) {
            toast.error('Please enter a payment amount');
            return;
        }

        const amount = parseFloat(paymentAmount);
        if (amount < calculateMinimumPayment()) {
            toast.error(`Minimum payment amount is ${formatCurrency(calculateMinimumPayment(), loan.currency.code)}`);
            return;
        }

        setPaymentDialogOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Loan Details - ${loan.reference_number}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between">
                    <Link href={tenantRouter.route('user-loans')}>
                        <Button variant="outline" className="cursor-pointer">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Loans
                        </Button>
                    </Link>
                </div>

                {/* Grace Period Alert */}
                {loan.status === 'active' && loan.grace_period_days > 0 && (
                    <Card className="border-yellow-500/50 bg-yellow-500/5">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-yellow-700">
                                        {(() => {
                                            const referenceDate = loan.last_payment_date ? new Date(loan.last_payment_date) : new Date(loan.start_date);
                                            const today = new Date();
                                            const daysSinceReference = Math.floor((today.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
                                            const remainingGraceDays = loan.grace_period_days - daysSinceReference;

                                            if (remainingGraceDays > 0) {
                                                return `You have ${remainingGraceDays} days remaining in your grace period. After this period, late payment fees will apply.`;
                                            } else if (remainingGraceDays === 0) {
                                                return "Today is the last day of your grace period. Make a payment today to avoid late fees.";
                                            } else {
                                                return `Your grace period has ended ${Math.abs(remainingGraceDays)} days ago. Late payment fees now apply.`;
                                            }
                                        })()}
                                    </p>
                                </div>
                                {loan.next_payment_due_date && (
                                    <Button 
                                        variant="outline" 
                                        className="border-yellow-500 text-yellow-700 hover:bg-yellow-500/10"
                                        onClick={handleMakePaymentClick}
                                    >
                                        Make Payment
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardContent className="p-6">
                        <div className="grid gap-6">
                            {/* Basic Loan Information */}
                            <div className="grid gap-4 md:grid-cols-4 border-b pb-6">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Reference Number</p>
                                    <p className="text-lg font-semibold">{loan.reference_number}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Activation Date</p>
                                    <p className="text-lg font-semibold">
                                        {loan.start_date && !isNaN(new Date(loan.start_date).getTime())
                                            ? format(new Date(loan.start_date), 'PPP')
                                            : 'Not yet active'}
                                    </p>
                                </div>
                                <div className="bg-primary/5 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground">Starting Amount</p>
                                    <p className="text-xl font-bold text-primary">
                                        {formatCurrency(loan.amount, loan.currency.code)}
                                    </p>
                                </div>
                                <div className="bg-emerald-500/5 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-emerald-600">Current Balance</p>
                                    <p className="text-xl font-bold text-emerald-600">
                                        {formatCurrency(loan.current_balance, loan.currency.code)}
                                    </p>
                                    <p className="text-xs text-emerald-600/80 mt-1">
                                        {loan.current_balance < loan.amount ? 'Remaining' : 'Total'}
                                    </p>
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="grid gap-4 md:grid-cols-4">
                                <div className="bg-muted/50 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground">Principal Paid</p>
                                    <p className="text-lg font-semibold">
                                        {formatCurrency(loan.principal_paid, loan.currency.code)}
                                    </p>
                                </div>
                                <div className="bg-muted/50 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground">Interest Paid</p>
                                    <p className="text-lg font-semibold">
                                        {formatCurrency(loan.interest_paid, loan.currency.code)}
                                    </p>
                                </div>
                                <div className="bg-muted/50 p-4 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground">Fees Paid</p>
                                    <p className="text-lg font-semibold">
                                        {formatCurrency(loan.fees_paid, loan.currency.code)}
                                    </p>
                                </div>
                                <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20">
                                    <p className="text-sm font-medium text-primary">Next Payment Due</p>
                                    <p className="text-xl font-bold text-primary">
                                        {loan.next_payment_due_date && !isNaN(new Date(loan.next_payment_due_date).getTime())
                                            ? format(new Date(loan.next_payment_due_date), 'PPP')
                                            : 'N/A'}
                                    </p>
                                    <p className="text-sm text-primary/80 mt-1">
                                        Amount: {formatCurrency(loan.current_balance + loan.current_interest_due, loan.currency.code)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                        <TabsTrigger value="payments">Payments</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Loan Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium">Status</p>
                                        <Badge className={getStatusColor(loan.status)}>
                                            {loan.status.replace('_', ' ').toUpperCase()}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium">Current Amount</p>
                                            <p className="text-lg font-semibold">
                                                {formatCurrency(loan.current_balance, loan.currency.code)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Starting Amount</p>
                                            <p className="text-lg font-semibold">
                                                {formatCurrency(loan.amount, loan.currency.code)}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Purpose</p>
                                        <p>{loan.purpose || 'N/A'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium">Interest Rate</p>
                                            <p className="text-lg font-semibold">{loan.interest_rate}%</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Duration</p>
                                            <p className="text-lg font-semibold">{loan.duration_days} days</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium">Monthly Payment</p>
                                            <p className="text-lg font-semibold">
                                                {formatCurrency(loan.interest_rate * loan.current_balance / 100, loan.currency.code)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Total Payments</p>
                                            <p className="text-lg font-semibold">{loan.completed_payments}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Current Interest Due</p>
                                            <p className="text-lg font-semibold">
                                                {!loan.current_interest_due || isNaN(loan.current_interest_due) || !isFinite(loan.current_interest_due)
                                                    ? formatCurrency(0, loan.currency.code)
                                                    : formatCurrency(loan.current_interest_due, loan.currency.code)
                                                }
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Interest accrued up to today
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Next Payment Due</p>
                                            <p className="text-lg font-semibold">
                                                {loan.next_payment_due_date && !isNaN(new Date(loan.next_payment_due_date).getTime())
                                                    ? format(new Date(loan.next_payment_due_date), 'PPP')
                                                    : 'N/A'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Amount: {formatCurrency(loan.current_balance + loan.current_interest_due, loan.currency.code)}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Loan Charges & Fees</CardTitle>
                                    <CardDescription>All applicable charges and fees for this loan</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Grace Period - Moved to top for prominence */}
                                    {loan.grace_period_days > 0 && (
                                        <div className="space-y-1 border-b pb-4">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-medium">Grace Period</p>
                                                <p className="text-sm font-semibold">{loan.grace_period_days} days</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                During this {loan.grace_period_days}-day period, you can make payments without incurring late fees. After this period, late payment fees will apply.
                                            </p>
                                        </div>
                                    )}

                                    {/* Late Payment Information */}
                                    {(loan.late_payment_fee_fixed > 0 || loan.late_payment_fee_percentage > 0) && (
                                        <div className="space-y-1 border-b pb-4">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-medium">Late Payment Fee</p>
                                                <p className="text-sm font-semibold">
                                                    {loan.late_payment_fee_fixed > 0 
                                                        ? formatCurrency(loan.late_payment_fee_fixed, loan.currency.code)
                                                        : `${loan.late_payment_fee_percentage}% of payment amount`
                                                    }
                                                </p>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                This fee will be charged for each payment made after the due date and grace period.
                                            </p>
                                            {loan.grace_period_days > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    Note: You have {loan.grace_period_days} days grace period before late fees apply.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Origination Fee */}
                                    {loan.origination_fee_amount > 0 && (
                                        <div className="space-y-1 border-b pb-4">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-medium">Origination Fee</p>
                                                <p className="text-sm font-semibold">
                                                    {formatCurrency(loan.origination_fee_amount, loan.currency.code)}
                                                </p>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                One-time fee charged when the loan is disbursed. You will receive {formatCurrency(loan.amount - loan.origination_fee_amount, loan.currency.code)} after this fee is deducted.
                                            </p>
                                        </div>
                                    )}

                                    {/* Platform Fee */}
                                    {loan.platform_fee_amount > 0 && (
                                        <div className="space-y-1 border-b pb-4">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-medium">Platform Fee</p>
                                                <p className="text-sm font-semibold">
                                                    {formatCurrency(loan.platform_fee_amount, loan.currency.code)}
                                                </p>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Fee charged for using the platform services
                                            </p>
                                        </div>
                                    )}

                                    {/* Early Repayment Fees */}
                                    {loan.allows_early_repayment && (
                                        <div className="space-y-1 border-b pb-4">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-medium">Early Repayment Fee</p>
                                                <p className="text-sm font-semibold">
                                                    {loan.early_repayment_fixed_fee > 0 
                                                        ? formatCurrency(loan.early_repayment_fixed_fee, loan.currency.code)
                                                        : `${loan.early_repayment_fee_percentage}% of remaining balance`
                                                    }
                                                </p>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Charged when repaying the loan before the end of the {loan.early_repayment_period_days}-day grace period. After {loan.early_repayment_period_days} days, this fee will no longer apply.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="documents">
                        <Card>
                            <CardHeader>
                                <CardTitle>Loan Documents</CardTitle>
                                <CardDescription>View and upload loan-related documents</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <form onSubmit={handleDocumentUpload} className="space-y-4">
                                        <div>
                                            <Label htmlFor="file">Upload Document</Label>
                                            <Input
                                                id="file"
                                                type="file"
                                                onChange={(e) => setDocumentData('file', e.target.files?.[0] || null)}
                                                className="mt-1"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="type">Document Type</Label>
                                            <Select 
                                                value={documentData.type} 
                                                onValueChange={(value) => setDocumentData('type', value)}
                                                required
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Select document type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="identification">Identification</SelectItem>
                                                    <SelectItem value="proof_of_income">Proof of Income</SelectItem>
                                                    <SelectItem value="bank_statement">Bank Statement</SelectItem>
                                                    <SelectItem value="contract">Contract</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea
                                                id="description"
                                                value={documentData.description}
                                                onChange={(e) => setDocumentData('description', e.target.value)}
                                                className="mt-1"
                                                rows={3}
                                            />
                                        </div>
                                        <Button type="submit" disabled={documentProcessing}>Upload Document</Button>
                                    </form>

                                    <div className="mt-6">
                                        <h3 className="text-lg font-medium mb-4">Uploaded Documents</h3>
                                        <div className="space-y-4">
                                            {loan.documents?.map((document) => (
                                                <div key={document.id} className="border rounded-lg p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium">{document.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Type: {document.type.replace('_', ' ').toUpperCase()}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Uploaded on {format(new Date(document.created_at), 'PPP p')}
                                                            </p>
                                                            {document.description && (
                                                                <p className="text-sm mt-2">{document.description}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => window.open(tenantRouter.route('loans.documents.download', { id: loan.id, documentId: document.id }), '_blank')}
                                                            >
                                                                Download
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!loan.documents || loan.documents.length === 0) && (
                                                <p className="text-muted-foreground">No documents uploaded yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="payments" ref={paymentsTabRef}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment History</CardTitle>
                                <CardDescription>View and manage loan payments</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <p className="text-sm font-medium">Next Payment Due</p>
                                            <p className="text-lg font-semibold">
                                                {loan.next_payment_due_date && !isNaN(new Date(loan.next_payment_due_date).getTime())
                                                    ? format(new Date(loan.next_payment_due_date), 'PPP')
                                                    : 'N/A'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Amount: {formatCurrency(loan.current_balance + loan.current_interest_due, loan.currency.code)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Last Payment</p>
                                            <p className="text-lg font-semibold">
                                                {loan.last_payment_date && !isNaN(new Date(loan.last_payment_date).getTime())
                                                    ? format(new Date(loan.last_payment_date), 'PPP')
                                                    : 'N/A'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Amount: {formatCurrency(loan.last_payment_amount, loan.currency.code)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <h3 className="text-lg font-medium mb-4">Payment History</h3>
                                        <div className="space-y-4">
                                            {loan.payments?.map((payment) => (
                                                <Card key={payment.id}>
                                                    <CardContent className="p-4">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-medium">Payment #{payment.payment_number}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Amount: {formatCurrency(payment.amount, loan.currency.code)}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Payment Date: {payment.payment_at && !isNaN(new Date(payment.payment_at).getTime())
                                                                        ? format(new Date(payment.payment_at), 'PPP')
                                                                        : 'N/A'}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Approved Date: {payment.approved_at && !isNaN(new Date(payment.approved_at).getTime())
                                                                        ? format(new Date(payment.approved_at), 'PPP')
                                                                        : 'N/A'}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Last Payment: {loan.last_payment_date && !isNaN(new Date(loan.last_payment_date).getTime())
                                                                        ? format(new Date(loan.last_payment_date), 'PPP')
                                                                        : 'N/A'}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Payment Method: {payment.payment_method?.name || 'N/A'}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Status: <Badge className={getStatusColor(payment.status)}>
                                                                        {payment.status.toUpperCase()}
                                                                    </Badge>
                                                                </p>
                                                                {payment.notes && (
                                                                    <p className="text-sm mt-2">
                                                                        Notes: {payment.notes}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {payment.attachment && (
                                                                <div className="flex gap-2">
                                                                    <div className="flex flex-col items-center gap-2">
                                                                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                                                                            <img
                                                                                src={tenantRouter.route('loans.payments.download-proof', { id: loan.id, paymentId: payment.id })}
                                                                                alt="Payment Proof"
                                                                                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                                                onClick={() => handlePreviewImage(payment)}
                                                                            />
                                                                        </div>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => handlePreviewImage(payment)}
                                                                            className="flex items-center gap-2"
                                                                        >
                                                                            <ImageIcon className="h-4 w-4" />
                                                                            View Full
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {payment.status === 'completed' && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleShowPaymentBreakdown(payment)}
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    <DollarSign className="h-4 w-4" />
                                                                    View Breakdown
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                            {(!loan.payments || loan.payments.length === 0) && (
                                                <p className="text-sm text-muted-foreground">No payment history available.</p>
                                            )}
                                        </div>
                                    </div>

                                    {loan.status === 'active' && (
                                        <div className="mt-6">
                                            <h3 className="text-lg font-medium mb-4">Make a Payment</h3>
                                            <Card className="mb-4">
                                                <CardHeader>
                                                    <CardTitle>Payment Amount</CardTitle>
                                                    <CardDescription>Enter the amount you wish to pay</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-4">
                                                        <div className="flex gap-4 items-end">
                                                            <div className="flex-1">
                                                                <Label htmlFor="payment-amount">Amount</Label>
                                                                <Input
                                                                    id="payment-amount"
                                                                    type="number"
                                                                    step="0.01"
                                                                    min={calculateMinimumPayment()}
                                                                    value={paymentAmount}
                                                                    onChange={(e) => handleAmountChange(e.target.value)}
                                                                    placeholder={`Minimum ${formatCurrency(calculateMinimumPayment(), loan.currency.code)}`}
                                                                    className={`mt-1 ${paymentAmount && parseFloat(paymentAmount) < calculateMinimumPayment() ? 'border-red-500' : ''}`}
                                                                />
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    Minimum payment: {formatCurrency(calculateMinimumPayment(), loan.currency.code)} (fees + interest)
                                                                </p>
                                                                {paymentAmount && parseFloat(paymentAmount) < calculateMinimumPayment() && (
                                                                    <p className="text-xs text-red-500 mt-1">
                                                                        Amount must be at least {formatCurrency(calculateMinimumPayment(), loan.currency.code)} to cover fees and interest
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <Button
                                                                onClick={handleProceedToPayment}
                                                                disabled={!paymentBreakdown || parseFloat(paymentAmount) < calculateMinimumPayment()}
                                                            >
                                                                Proceed to Payment
                                                            </Button>
                                                        </div>

                                                        {paymentBreakdown && (
                                                            <div className="mt-4 space-y-4">
                                                                <div className="grid gap-4">
                                                                    <div className="flex justify-between items-center border-b pb-2">
                                                                        <p className="text-sm font-medium">Total Payment Amount</p>
                                                                        <p className="text-sm font-semibold">
                                                                            {formatCurrency(paymentBreakdown.total_payment, loan.currency.code)}
                                                                        </p>
                                                                    </div>
                                                                    
                                                                    {paymentBreakdown.late_fees_amount > 0 && (
                                                                        <div className="flex justify-between items-center border-b pb-2">
                                                                            <div>
                                                                                <p className="text-sm font-medium">Late Payment Fees</p>
                                                                                <p className="text-xs text-muted-foreground">Charged for late payment</p>
                                                                            </div>
                                                                            <p className="text-sm font-semibold">
                                                                                {formatCurrency(paymentBreakdown.late_fees_amount, loan.currency.code)}
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    {paymentBreakdown.early_repayment_fees_amount > 0 && (
                                                                        <div className="flex justify-between items-center border-b pb-2">
                                                                            <div>
                                                                                <p className="text-sm font-medium">Early Repayment Fees</p>
                                                                                <p className="text-xs text-muted-foreground">Charged for early repayment</p>
                                                                            </div>
                                                                            <p className="text-sm font-semibold">
                                                                                {formatCurrency(paymentBreakdown.early_repayment_fees_amount, loan.currency.code)}
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    <div className="flex justify-between items-center border-b pb-2">
                                                                        <div>
                                                                            <p className="text-sm font-medium">Interest Payment</p>
                                                                            <p className="text-xs text-muted-foreground">Accrued interest to be paid</p>
                                                                        </div>
                                                                        <p className="text-sm font-semibold">
                                                                            {formatCurrency(paymentBreakdown.interest_amount, loan.currency.code)}
                                                                        </p>
                                                                    </div>

                                                                    <div className="flex justify-between items-center border-b pb-2">
                                                                        <div>
                                                                            <p className="text-sm font-medium">Principal Payment</p>
                                                                            <p className="text-xs text-muted-foreground">Amount to be applied to loan balance</p>
                                                                        </div>
                                                                        <p className="text-sm font-semibold">
                                                                            {formatCurrency(paymentBreakdown.principal_amount, loan.currency.code)}
                                                                        </p>
                                                                    </div>

                                                                    {paymentBreakdown.remaining_payment > 0 && (
                                                                        <div className="flex justify-between items-center pt-2">
                                                                            <div>
                                                                                <p className="text-sm font-medium">Remaining Amount</p>
                                                                                <p className="text-xs text-muted-foreground">Amount that will be refunded</p>
                                                                            </div>
                                                                            <p className="text-sm font-semibold">
                                                                                {formatCurrency(paymentBreakdown.remaining_payment, loan.currency.code)}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Payment Dialog */}
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Make a Payment</DialogTitle>
                        <DialogDescription>
                            Complete your payment using one of the available payment methods
                        </DialogDescription>
                    </DialogHeader>

                    <PaymentForm
                        loanId={loan.id}
                        initialAmount={paymentAmount}
                        onSubmit={(formData, paymentType) => {
                            handlePaymentSubmit(formData, paymentType);
                            setPaymentDialogOpen(false);
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Image Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Payment Proof</DialogTitle>
                    </DialogHeader>
                    {previewImage && (
                        <div className="relative w-full h-[600px]">
                            <img
                                src={previewImage}
                                alt="Payment Proof"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Payment Breakdown Dialog */}
            <Dialog open={paymentBreakdownOpen} onOpenChange={setPaymentBreakdownOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Payment Allocation Breakdown</DialogTitle>
                        <DialogDescription>
                            Detailed breakdown of how your payment was allocated
                        </DialogDescription>
                    </DialogHeader>
                    {selectedPaymentBreakdown && (
                        <div className="space-y-4">
                            <div className="grid gap-4">
                                <div className="flex justify-between items-center border-b pb-2">
                                    <p className="text-sm font-medium">Total Payment Amount</p>
                                    <p className="text-sm font-semibold">
                                        {formatCurrency(selectedPaymentBreakdown.total_payment, loan.currency.code)}
                                    </p>
                                </div>
                                
                                {selectedPaymentBreakdown.late_fees_amount > 0 && (
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <div>
                                            <p className="text-sm font-medium">Late Payment Fees</p>
                                            <p className="text-xs text-muted-foreground">Charged for late payment</p>
                                        </div>
                                        <p className="text-sm font-semibold">
                                            {formatCurrency(selectedPaymentBreakdown.late_fees_amount, loan.currency.code)}
                                        </p>
                                    </div>
                                )}

                                {selectedPaymentBreakdown.early_repayment_fees_amount > 0 && (
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <div>
                                            <p className="text-sm font-medium">Early Repayment Fees</p>
                                            <p className="text-xs text-muted-foreground">Charged for early repayment</p>
                                        </div>
                                        <p className="text-sm font-semibold">
                                            {formatCurrency(selectedPaymentBreakdown.early_repayment_fees_amount, loan.currency.code)}
                                        </p>
                                    </div>
                                )}

                                {selectedPaymentBreakdown.fees_amount > 0 && (
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <div>
                                            <p className="text-sm font-medium">Regular Fees</p>
                                            <p className="text-xs text-muted-foreground">Standard loan fees</p>
                                        </div>
                                        <p className="text-sm font-semibold">
                                            {formatCurrency(selectedPaymentBreakdown.fees_amount, loan.currency.code)}
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-between items-center border-b pb-2">
                                    <div>
                                        <p className="text-sm font-medium">Interest Payment</p>
                                        <p className="text-xs text-muted-foreground">Accrued interest paid</p>
                                    </div>
                                    <p className="text-sm font-semibold">
                                        {formatCurrency(selectedPaymentBreakdown.interest_amount, loan.currency.code)}
                                    </p>
                                </div>

                                <div className="flex justify-between items-center border-b pb-2">
                                    <div>
                                        <p className="text-sm font-medium">Principal Payment</p>
                                        <p className="text-xs text-muted-foreground">Amount applied to loan balance</p>
                                    </div>
                                    <p className="text-sm font-semibold">
                                        {formatCurrency(selectedPaymentBreakdown.principal_amount, loan.currency.code)}
                                    </p>
                                </div>

                                {selectedPaymentBreakdown.remaining_payment > 0 && (
                                    <div className="flex justify-between items-center pt-2">
                                        <div>
                                            <p className="text-sm font-medium">Remaining Amount</p>
                                            <p className="text-xs text-muted-foreground">Amount not yet allocated</p>
                                        </div>
                                        <p className="text-sm font-semibold">
                                            {formatCurrency(selectedPaymentBreakdown.remaining_payment, loan.currency.code)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
} 