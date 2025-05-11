import { PageProps } from '@/types';
import { Head, useForm, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Edit } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    days_past_due: number;
    next_payment_due_date: string;
    next_payment_amount: number;
    last_payment_date: string;
    last_payment_amount: number;
    created_at: string;
    updated_at: string;
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
    payments?: Array<{
        id: number;
        payment_number: number;
        amount: number;
        status: string;
        due_date: string;
        payer_name: string;
        notes?: string;
        attachment?: string;
    }>;
}

interface Props extends PageProps {
    loan: Loan;
    payment_methods: Array<{
        id: number;
        name: string;
        method_type: string;
    }>;
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            roles: string[];
        };
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Loans',
        href: '/loans',
    },
    {
        title: 'View Loan',
        href: '/loans/view',
    },
];

export default function Show({ loan, payment_methods, auth }: Props) {
    const { data, setData, post, processing } = useForm({
        content: '',
    });

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

    const handleAddNote = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('loans.notes.add', loan.id), {
            onSuccess: () => {
                toast.success('Note added successfully');
                setData('content', '');
            },
        });
    };

    const handleDocumentUpload = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        if (documentData.file) {
            formData.append('file', documentData.file);
            formData.append('name', documentData.file.name);
        }
        formData.append('type', documentData.type);
        formData.append('description', documentData.description);

        postDocument(route('loans.documents.upload', loan.id), {
            preserveScroll: true,
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

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('payment_method_id', paymentData.payment_method_id);
        formData.append('amount', parseFloat(paymentData.amount).toString());
        if (paymentData.payment_proof) {
            formData.append('payment_proof', paymentData.payment_proof);
        }
        formData.append('notes', paymentData.notes || '');

        postPayment(route('loans.payments.submit', loan.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Payment submitted successfully');
                setPaymentData({
                    payment_method_id: '',
                    amount: '',
                    payment_proof: null,
                    notes: '',
                });
            },
            onError: (errors: Record<string, string>) => {
                Object.values(errors).forEach((error) => {
                    toast.error(error);
                });
            },
        });
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'bg-gray-500',
            pending_approval: 'bg-yellow-500',
            approved: 'bg-green-500',
            rejected: 'bg-red-500',
            disbursed: 'bg-blue-500',
            active: 'bg-green-500',
            in_arrears: 'bg-orange-500',
            defaulted: 'bg-red-500',
            paid: 'bg-green-500',
            closed: 'bg-gray-500',
            // Payment status colors
            scheduled: 'bg-blue-500',
            due: 'bg-yellow-500',
            pending: 'bg-yellow-500',
            processing: 'bg-blue-500',
            completed: 'bg-green-500',
            failed: 'bg-red-500',
            cancelled: 'bg-gray-500',
            waived: 'bg-purple-500',
            partial: 'bg-orange-500'
        };
        return colors[status] || 'bg-gray-500';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`View Loan - ${loan.reference_number}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between">
                    <Link href={route('loans.index')}>
                        <Button variant="outline" className="cursor-pointer">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Loans
                        </Button>
                    </Link>
                    <Link href={route('loans.edit', loan.id)}>
                        <Button className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Loan
                        </Button>
                    </Link>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                        <TabsTrigger value="notes">Notes</TabsTrigger>
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
                                    <div>
                                        <p className="text-sm font-medium">Amount</p>
                                        <p className="text-lg font-semibold">
                                            {formatCurrency(loan.amount, loan.currency.code)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Interest Rate</p>
                                        <p>{loan.interest_rate}%</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Duration</p>
                                        <p>{loan.duration_days} days</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Purpose</p>
                                        <p>{loan.purpose || 'N/A'}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Borrower Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium">Name</p>
                                        <p>{loan.user.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Email</p>
                                        <p>{loan.user.email}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Payment Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium">Monthly Payment</p>
                                        <p className="text-lg font-semibold">
                                            {formatCurrency(loan.monthly_payment_amount, loan.currency.code)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Total Payments</p>
                                        <p>{loan.total_payments}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Completed Payments</p>
                                        <p>{loan.completed_payments}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Next Payment Due</p>
                                        <p>
                                            {loan.next_payment_due_date
                                                ? format(new Date(loan.next_payment_due_date), 'PPP')
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Financial Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium">Principal Paid</p>
                                        <p className="text-lg font-semibold">
                                            {formatCurrency(loan.principal_paid, loan.currency.code)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Interest Paid</p>
                                        <p className="text-lg font-semibold">
                                            {formatCurrency(loan.interest_paid, loan.currency.code)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Fees Paid</p>
                                        <p className="text-lg font-semibold">
                                            {formatCurrency(loan.fees_paid, loan.currency.code)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Current Balance</p>
                                        <p className="text-lg font-semibold">
                                            {formatCurrency(loan.current_balance, loan.currency.code)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="documents">
                        <Card>
                            <CardHeader>
                                <CardTitle>Loan Documents</CardTitle>
                                <CardDescription>Upload and manage loan-related documents</CardDescription>
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
                                                                Uploaded by {document.uploadedBy?.name || 'Unknown'} on{' '}
                                                                {format(new Date(document.created_at), 'PPP p')}
                                                            </p>
                                                            {document.description && (
                                                                <p className="text-sm mt-2">{document.description}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => window.open(route('loans.documents.download', [loan.id, document.id]), '_blank')}
                                                            >
                                                                Download
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => {
                                                                    if (confirm('Are you sure you want to delete this document?')) {
                                                                        router.delete(route('loans.documents.delete', [loan.id, document.id]), {
                                                                            preserveScroll: true,
                                                                            onSuccess: () => {
                                                                                toast.success('Document deleted successfully');
                                                                            },
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                Delete
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

                    <TabsContent value="notes">
                        <Card>
                            <CardHeader>
                                <CardTitle>Loan Notes</CardTitle>
                                <CardDescription>Add and view notes about this loan</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <form onSubmit={handleAddNote} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Add Note</label>
                                            <Textarea
                                                value={data.content}
                                                onChange={e => setData('content', e.target.value)}
                                                placeholder="Enter your note here..."
                                                rows={4}
                                                required
                                            />
                                        </div>
                                        <Button type="submit" disabled={processing}>
                                            Add Note
                                        </Button>
                                    </form>

                                    <div className="mt-6">
                                        <h3 className="text-lg font-medium mb-4">Previous Notes</h3>
                                        <div className="space-y-4">
                                            {loan.notes?.map(note => (
                                                <div key={note.id} className="border rounded-lg p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <p className="font-medium">{note.created_by.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {format(new Date(note.created_at), 'PPP p')}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {note.updated_at !== note.created_at && (
                                                                <p className="text-sm text-muted-foreground">
                                                                    Edited by {note.updated_by.name} on{' '}
                                                                    {format(new Date(note.updated_at), 'PPP p')}
                                                                </p>
                                                            )}
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => {
                                                                    if (confirm('Are you sure you want to delete this note?')) {
                                                                        router.delete(route('loans.notes.delete', [loan.id, note.id]), {
                                                                            preserveScroll: true,
                                                                            onSuccess: () => {
                                                                                toast.success('Note deleted successfully');
                                                                            },
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <p className="whitespace-pre-wrap">{note.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="payments">
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
                                                {loan.next_payment_due_date
                                                    ? format(new Date(loan.next_payment_due_date), 'PPP')
                                                    : 'N/A'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Amount: {formatCurrency(loan.next_payment_amount, loan.currency.code)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Last Payment</p>
                                            <p className="text-lg font-semibold">
                                                {loan.last_payment_date
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
                                                                    Due Date: {format(new Date(payment.due_date), 'PPP')}
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
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => window.open(route('loans.payments.download-proof', [loan.id, payment.id]), '_blank')}
                                                                    >
                                                                        View Proof
                                                                    </Button>
                                                                </div>
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

                                    <div className="mt-6">
                                        <h3 className="text-lg font-medium mb-4">Make a Payment</h3>
                                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                                            <div>
                                                <Label htmlFor="payment_method">Payment Method</Label>
                                                <Select
                                                    value={paymentData.payment_method_id}
                                                    onValueChange={(value) => setPaymentData('payment_method_id', value)}
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
                                                <Label htmlFor="amount">Payment Amount</Label>
                                                <Input
                                                    id="amount"
                                                    type="number"
                                                    value={paymentData.amount}
                                                    onChange={(e) => setPaymentData('amount', e.target.value)}
                                                    min={loan.next_payment_amount}
                                                    step="0.01"
                                                    required
                                                />
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Minimum payment: {formatCurrency(loan.next_payment_amount, loan.currency.code)}
                                                </p>
                                            </div>

                                            <div>
                                                <Label htmlFor="payment_proof">Payment Proof</Label>
                                                <Input
                                                    id="payment_proof"
                                                    type="file"
                                                    onChange={(e) => setPaymentData('payment_proof', e.target.files?.[0] || null)}
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    required
                                                />
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Upload receipt, screenshot, or other proof of payment
                                                </p>
                                            </div>

                                            <div>
                                                <Label htmlFor="notes">Notes</Label>
                                                <Textarea
                                                    id="notes"
                                                    value={paymentData.notes}
                                                    onChange={(e) => setPaymentData('notes', e.target.value)}
                                                    placeholder="Add any additional information about your payment"
                                                />
                                            </div>

                                            <Button type="submit" disabled={paymentProcessing}>
                                                Submit Payment
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
} 