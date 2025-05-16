import { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';

interface PaymentMethod {
    id: number;
    name: string;
    method_type: string;
    is_online: boolean;
    callback_url?: string;
    configuration?: Record<string, any>;
}

interface PaymentFormProps {
    loanId: number;
    paymentMethods: PaymentMethod[];
    onSubmit: (data: FormData) => void;
}

export default function PaymentForm({ loanId, paymentMethods, onSubmit }: PaymentFormProps) {
    const [file, setFile] = useState<File | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        payment_method_id: '',
        reference_number: '',
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
        proof_file: null as File | null,
    });

    useEffect(() => {
        if (data.payment_method_id) {
            const method = paymentMethods.find(m => m.id.toString() === data.payment_method_id);
            setSelectedMethod(method || null);
        } else {
            setSelectedMethod(null);
        }
    }, [data.payment_method_id, paymentMethods]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('amount', data.amount);
        formData.append('payment_method_id', data.payment_method_id);
        
        // Only append reference number for manual payments
        if (!selectedMethod?.is_online) {
            formData.append('reference_number', data.reference_number);
        }
        
        formData.append('payment_date', data.payment_date);
        formData.append('notes', data.notes);
        
        // Only append proof file for manual payments
        if (!selectedMethod?.is_online && file) {
            formData.append('proof_file', file);
        }
        
        onSubmit(formData);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setData('proof_file', e.target.files[0]);
        }
    };

    const handleOnlinePayment = async () => {
        if (!selectedMethod?.callback_url) return;
        
        try {
            const response = await fetch(selectedMethod.callback_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    loan_id: loanId,
                    amount: data.amount,
                    payment_method_id: data.payment_method_id,
                    payment_date: data.payment_date,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                // Handle the payment gateway response
                if (result.redirect_url) {
                    window.location.href = result.redirect_url;
                }
            } else {
                throw new Error('Payment gateway error');
            }
        } catch (error) {
            console.error('Payment gateway error:', error);
            // Handle error appropriately
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Submit Payment</CardTitle>
                <CardDescription>
                    {selectedMethod?.is_online 
                        ? 'Complete your payment using the selected payment method.'
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
                                value={data.amount}
                                onChange={e => setData('amount', e.target.value)}
                                required
                            />
                            {errors.amount && (
                                <Alert variant="destructive">
                                    <AlertDescription>{errors.amount}</AlertDescription>
                                </Alert>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="payment_method">Payment Method</Label>
                            <Select
                                value={data.payment_method_id}
                                onValueChange={value => setData('payment_method_id', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    {paymentMethods.map(method => (
                                        <SelectItem key={method.id} value={method.id.toString()}>
                                            {method.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.payment_method_id && (
                                <Alert variant="destructive">
                                    <AlertDescription>{errors.payment_method_id}</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </div>

                    {!selectedMethod?.is_online && (
                        <>
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
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={e => setData('notes', e.target.value)}
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

                    {selectedMethod?.is_online ? (
                        <Button 
                            type="button" 
                            onClick={handleOnlinePayment} 
                            disabled={processing || !data.amount || !data.payment_method_id}
                        >
                            {processing ? 'Processing...' : 'Proceed to Payment'}
                        </Button>
                    ) : (
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Submitting...' : 'Submit Payment'}
                        </Button>
                    )}
                </form>
            </CardContent>
        </Card>
    );
} 