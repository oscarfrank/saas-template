import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';

interface PaymentFormProps {
    loanId: number;
    onSubmit: (formData: FormData, paymentType: 'online' | 'offline') => void;
    initialAmount?: string;
}

type PaymentType = 'online' | 'offline';

export default function PaymentForm({ loanId, onSubmit, initialAmount }: PaymentFormProps) {
    const [file, setFile] = useState<File | null>(null);
    const [paymentType, setPaymentType] = useState<PaymentType | ''>('');
    
    const { data, setData, post, processing, errors, reset } = useForm({
        amount: initialAmount || '',
        payment_type: '',
        reference_number: '',
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
        proof_file: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('amount', data.amount);
        formData.append('payment_type', paymentType);
        
        if (paymentType === 'offline') {
            formData.append('reference_number', data.reference_number);
            formData.append('payment_date', data.payment_date);
            formData.append('notes', data.notes);
            if (file) {
                formData.append('proof_file', file);
            }
        }
        
        onSubmit(formData, paymentType as PaymentType);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setData('proof_file', e.target.files[0]);
        }
    };

    const handlePaymentTypeChange = (value: string) => {
        setPaymentType(value as PaymentType);
        setData('payment_type', value);
    };

    const handleAmountChange = (value: string) => {
        setData('amount', value);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Submit Payment</CardTitle>
                <CardDescription>
                    {paymentType === 'online' 
                        ? 'Complete your payment using our secure online payment system.'
                        : 'Please provide the payment details and upload proof of payment.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min={initialAmount}
                                value={data.amount}
                                onChange={(e) => handleAmountChange(e.target.value)}
                                required
                            />
                            {errors.amount && (
                                <Alert variant="destructive">
                                    <AlertDescription>{errors.amount}</AlertDescription>
                                </Alert>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="payment_type">Payment Type</Label>
                            <Select
                                value={data.payment_type}
                                onValueChange={handlePaymentTypeChange}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select payment type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="online">Online Payment</SelectItem>
                                    <SelectItem value="offline">Offline Payment</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.payment_type && (
                                <Alert variant="destructive">
                                    <AlertDescription>{errors.payment_type}</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </div>

                    {paymentType === 'online' && (
                        <Alert>
                            <AlertDescription>
                                Online payment covers: Credit/Debit Card, Bank Transfer, and Mobile Banking Apps.
                                You will be redirected to our secure payment gateway to complete your transaction.
                            </AlertDescription>
                        </Alert>
                    )}

                    {paymentType === 'offline' && (
                        <>
                            <Alert>
                                <AlertDescription>
                                    Offline payment covers: Cash deposits at bank branches, Mobile App screenshots,
                                    or any other manual payment method. Please ensure to provide all required details.
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reference_number">Reference Number</Label>
                                    <Input
                                        id="reference_number"
                                        value={data.reference_number}
                                        onChange={e => setData('reference_number', e.target.value)}
                                        required
                                    />
                                    {errors.reference_number && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.reference_number}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payment_date">Payment Date</Label>
                                    <Input
                                        id="payment_date"
                                        type="date"
                                        value={data.payment_date}
                                        onChange={e => setData('payment_date', e.target.value)}
                                        required
                                    />
                                    {errors.payment_date && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.payment_date}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes (Optional)</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                />
                                {errors.notes && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{errors.notes}</AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="proof_file">Proof of Payment</Label>
                                <Input
                                    id="proof_file"
                                    type="file"
                                    onChange={handleFileChange}
                                    required
                                />
                                {errors.proof_file && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{errors.proof_file}</AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </>
                    )}

                    <Button 
                        type="submit" 
                        disabled={processing || !data.amount || !data.payment_type}
                    >
                        {processing ? 'Processing...' : paymentType === 'online' ? 'Proceed to Payment' : 'Submit Payment'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
} 