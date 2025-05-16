import { format } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Payment {
    id: number;
    amount: number;
    payment_method: {
        name: string;
    };
    reference_number: string;
    payment_date: string;
    status: 'pending' | 'approved' | 'rejected';
    interest_amount: number;
    principal_amount: number;
    fees_amount: number;
    notes: string | null;
    approved_at: string | null;
    approved_by_user: {
        first_name: string;
        last_name: string;
    } | null;
    rejection_reason: string | null;
}

interface PaymentHistoryProps {
    payments: Payment[];
}

export default function PaymentHistory({ payments }: PaymentHistoryProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-500';
            case 'pending':
                return 'bg-yellow-500';
            case 'rejected':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Split</TableHead>
                            <TableHead>Notes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell>
                                    {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell>${payment.amount.toFixed(2)}</TableCell>
                                <TableCell>{payment.payment_method.name}</TableCell>
                                <TableCell>{payment.reference_number}</TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(payment.status)}>
                                        {payment.status}
                                    </Badge>
                                    {payment.status === 'approved' && payment.approved_by_user && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            by {payment.approved_by_user.first_name} {payment.approved_by_user.last_name}
                                        </div>
                                    )}
                                    {payment.status === 'rejected' && payment.rejection_reason && (
                                        <div className="text-xs text-red-500 mt-1">
                                            {payment.rejection_reason}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="text-xs">
                                        <div>Principal: ${payment.principal_amount.toFixed(2)}</div>
                                        <div>Interest: ${payment.interest_amount.toFixed(2)}</div>
                                        <div>Fees: ${payment.fees_amount.toFixed(2)}</div>
                                    </div>
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                    {payment.notes}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
} 