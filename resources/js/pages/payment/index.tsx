import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const plans = [
    {
        id: 'basic',
        name: 'Basic Plan',
        price: 9.99,
        priceId: 'price_1RR9w6R9ZcfVoXsQZe99J48q', // You'll need to replace this with your actual Stripe price ID
        features: ['Feature 1', 'Feature 2', 'Feature 3']
    },
    {
        id: 'standard',
        name: 'Standard Plan',
        price: 14.99,
        priceId: 'price_1RRABHR9ZcfVoXsQI2IMSSE5', // You'll need to replace this with your actual Stripe price ID
        features: ['Feature 1', 'Feature 2', 'Feature 3']
    },
    {
        id: 'premium',
        name: 'Premium Plan',
        price: 19.99,
        priceId: 'price_1RRABbR9ZcfVoXsQ8T7yaF7E', // You'll need to replace this with your actual Stripe price ID
        features: ['All Basic Features', 'Pro Feature 1', 'Pro Feature 2']
    }
];

const PaymentPage: React.FC = () => {
    const [selectedPlan, setSelectedPlan] = useState(plans[0]);

    const { post, processing, errors } = useForm({
        price_id: selectedPlan.priceId,
    });

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        
        post('/payment/create-checkout-session', {
            onSuccess: (response) => {
                if (response.url) {
                    window.location.href = response.url;
                }
            },
            onError: (errors) => {
                console.error('Payment error:', errors);
                toast.error('Failed to initiate payment. Please try again.');
            },
        });
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h1>
            <form onSubmit={handlePayment}>
                <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {plans.map((plan) => (
                        <Card 
                            key={plan.id}
                            className={`p-6 cursor-pointer transition-all ${
                                selectedPlan.id === plan.id 
                                    ? 'border-primary ring-2 ring-primary' 
                                    : 'hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedPlan(plan)}
                        >
                            <h2 className="text-xl font-bold mb-2">{plan.name}</h2>
                            <p className="text-3xl font-bold mb-4">
                                ${plan.price}
                                <span className="text-sm font-normal text-gray-500">/month</span>
                            </p>
                            <ul className="space-y-2 mb-6">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-center">
                                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    ))}
                </div>

                <div className="max-w-md mx-auto mt-8">
                    <Button
                        type="submit"
                        disabled={processing}
                        className="w-full"
                    >
                        {processing ? 'Processing...' : `Subscribe to ${selectedPlan.name}`}
                    </Button>
                    
                    {errors.price_id && (
                        <p className="text-red-500 text-sm mt-2">{errors.price_id}</p>
                    )}
                    
                    <p className="text-sm text-gray-500 text-center mt-4">
                        You will be redirected to Stripe to complete the payment
                    </p>
                </div>
            </form>
        </div>
    );
};

export default PaymentPage;
