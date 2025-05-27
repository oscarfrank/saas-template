import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Receipt, User } from "lucide-react";
import { PageProps } from "@inertiajs/core";
import { useState } from "react";
import { useForm, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface User {
    name: string;
    email: string;
    billing_address?: string;
}

interface Currency {
    code: string;
    symbol: string;
    symbol_position: 'before' | 'after';
}

interface ProviderPlan {
    product_id: string;
    price_id: string;
}

interface SubscriptionPlan {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    currency: Currency;
    billing_period: 'monthly' | 'yearly' | 'quarterly' | 'weekly';
    features: string[];
    is_active: boolean;
    is_featured: boolean;
    sort_order: number;
    provider_plans: {
        stripe: ProviderPlan;
        paypal: ProviderPlan;
    };
    formatted_price: string;
    period_label: string;
    full_price: string;
}

interface BillingTabsProps extends PageProps {
    subscription: any;
    paymentMethods: any[];
    invoices: any[];
    user: User;
    plans: Record<string, SubscriptionPlan[]>;
}

export default function BillingTabs({ subscription, paymentMethods = [], invoices = [], user, plans = {} }: BillingTabsProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');
    const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
    const [amount, setAmount] = useState('');
    
    const form = useForm({
        price_id: '',
        plan_id: null as number | null,
    });

    // Ensure user has default values if undefined
    const userData = user || {
        name: 'Guest User',
        email: 'guest@example.com',
        billing_address: undefined
    };

    const currentPlans = plans[selectedPeriod] || [];

    const handlePayment = (plan: SubscriptionPlan) => (e: React.FormEvent) => {
        e.preventDefault();

        router.post('/checkout/subscription', {
            price_id: plan.provider_plans.stripe.price_id,
            plan_id: plan.id

        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (response: { url?: string }) => {
                if (response.url) {
                    // window.location.href = response.url;
                    // console.log('ResponseL:', response);
                }
            },
            onError: (errors: Record<string, string>) => {
                console.error('Payment error:', errors);
                toast.error('Failed to initiate payment. Please try again.');
            }
        });
    };

    return (
        <Tabs defaultValue="plans" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="plans" className="cursor-pointer">Plans</TabsTrigger>
                <TabsTrigger value="payment" className="cursor-pointer">Payment Method</TabsTrigger>
                <TabsTrigger value="billing" className="cursor-pointer">Billing Info</TabsTrigger>
                <TabsTrigger value="invoices" className="cursor-pointer">Invoices</TabsTrigger>
            </TabsList>

            <TabsContent value="plans" className="space-y-4">
                <div className="flex justify-center space-x-4 mb-6">
                    <Button
                        variant={selectedPeriod === 'monthly' ? 'default' : 'outline'}
                        onClick={() => setSelectedPeriod('monthly')}
                    >
                        Monthly
                    </Button>
                    <Button
                        variant={selectedPeriod === 'yearly' ? 'default' : 'outline'}
                        onClick={() => setSelectedPeriod('yearly')}
                    >
                        Yearly (Save 20%)
                    </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {currentPlans.length > 0 ? (
                        currentPlans.map((plan) => (
                            <form key={plan.id} onSubmit={handlePayment(plan)}>
                                <Card 
                                    className={`${plan.is_featured ? 'border-primary' : ''} 
                                        ${subscription?.plan_id === plan.id ? 'ring-2 ring-primary' : ''}
                                        ${selectedPlan === plan.id ? 'ring-2 ring-primary' : ''}
                                        cursor-pointer transition-all duration-200 hover:shadow-lg`}
                                    onClick={() => setSelectedPlan(plan.id)}
                                >
                                    <CardHeader>
                                        <CardTitle>{plan.name}</CardTitle>
                                        <CardDescription>
                                            <span className="text-2xl font-bold">
                                                {plan.formatted_price || `${plan.currency?.symbol || '$'}${plan.price}`}
                                            </span>
                                            /{plan.period_label}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {plan.features.map((feature) => (
                                                <li key={feature} className="flex items-center">
                                                    <span className="mr-2">✓</span>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        <Button
                                            type="submit"
                                            className="mt-4 w-full"
                                            variant={subscription?.plan_id === plan.id ? "outline" : "default"}
                                            disabled={form.processing || subscription?.plan_id === plan.id}
                                        >
                                            {form.processing && selectedPlan === plan.id ? (
                                                "Processing..."
                                            ) : subscription?.plan_id === plan.id ? (
                                                "Current Plan"
                                            ) : (
                                                "Upgrade"
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </form>
                        ))
                    ) : (
                        <div className="col-span-3 text-center py-8">
                            <p className="text-muted-foreground">No subscription plans available at the moment.</p>
                        </div>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Methods</CardTitle>
                        <CardDescription>Manage your payment methods and billing information.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {paymentMethods && paymentMethods.length > 0 ? (
                            paymentMethods.map((method) => (
                                <div key={method.id} className="flex items-center space-x-4 mb-4">
                                    <CreditCard className="h-8 w-8" />
                                    <div>
                                        <p className="font-medium">{method.card.brand} ending in {method.card.last4}</p>
                                        <p className="text-sm text-muted-foreground">Expires {method.card.exp_month}/{method.card.exp_year}</p>
                                    </div>
                                    <Button variant="outline" className="ml-auto">Update</Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-muted-foreground">No payment methods found</p>
                                <Button className="mt-2">Add Payment Method</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Billing Information</CardTitle>
                        <CardDescription>Your billing address and contact information.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4">
                            <User className="h-8 w-8" />
                            <div>
                                <p className="font-medium">{userData.name}</p>
                                <p className="text-sm text-muted-foreground">{userData.email}</p>
                                {userData.billing_address && (
                                    <p className="text-sm text-muted-foreground">{userData.billing_address}</p>
                                )}
                            </div>
                            <Button variant="outline" className="ml-auto">Edit</Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="invoices" className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Invoices</CardTitle>
                        <CardDescription>View and download your recent invoices.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {invoices && invoices.length > 0 ? (
                            <div className="space-y-4">
                                {invoices.map((invoice) => (
                                    <div key={invoice.id} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <Receipt className="h-8 w-8" />
                                            <div>
                                                <p className="font-medium">Invoice #{invoice.number}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(invoice.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <p className="font-medium">${(invoice.amount_paid / 100).toFixed(2)}</p>
                                            <Button variant="outline" size="sm">Download</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-muted-foreground">No invoices found</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Fund Account Balance</CardTitle>
                        <CardDescription>Add funds to your account balance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            router.post('/payment/fund-balance', {
                                amount: amount
                            }, {
                                preserveScroll: true,
                                preserveState: true,
                                onSuccess: (response: { url?: string }) => {
                                    if (response.url) {
                                        window.location.href = response.url;
                                    }
                                },
                                onError: (errors: Record<string, string>) => {
                                    console.error('Payment error:', errors);
                                    toast.error('Failed to initiate payment. Please try again.');
                                }
                            });
                        }} className="space-y-4">
                            <div className="flex items-end gap-4">
                                <div className="flex-1">
                                    <Label htmlFor="amount">Amount</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        min="5"
                                        max="10000"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        required
                                    />
                                </div>
                                <Button type="submit" disabled={!amount || parseFloat(amount) < 5}>
                                    Fund Balance
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
} 