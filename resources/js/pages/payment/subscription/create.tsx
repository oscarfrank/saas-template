import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Subscription Plans',
        href: '/admin/subscription-plans',
    },
    {
        title: 'Create Plan',
        href: '/admin/subscription-plans/create',
    },
];

interface Props {
    currencies: any[];
    billingPeriods: Record<string, string>;
}

export default function Create({ currencies, billingPeriods }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        description: '',
        price: 0,
        currency_id: '',
        billing_period: 'monthly',
        features: [''],
        is_active: true,
        is_featured: false,
        sort_order: 0,
        provider_plans: {
            stripe: {
                product_id: '',
                price_id: ''
            },
            paypal: {
                product_id: '',
                price_id: ''
            }
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('subscription-plans.store'));
    };

    const addFeature = () => {
        setData('features', [...data.features, '']);
    };

    const removeFeature = (index: number) => {
        setData('features', data.features.filter((_, i) => i !== index));
    };

    const updateFeature = (index: number, value: string) => {
        const newFeatures = [...data.features];
        newFeatures[index] = value;
        setData('features', newFeatures);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Subscription Plan" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between">
                    <h1 className="text-2xl font-semibold">Create Subscription Plan</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>
                                Enter the basic information for the subscription plan
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Plan Name</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        placeholder="Basic Plan"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slug">Slug</Label>
                                    <Input
                                        id="slug"
                                        value={data.slug}
                                        onChange={e => setData('slug', e.target.value)}
                                        placeholder="basic-plan"
                                        required
                                    />
                                    {errors.slug && (
                                        <p className="text-sm text-destructive">{errors.slug}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="price">Price</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={data.price}
                                        onChange={e => setData('price', parseFloat(e.target.value))}
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                    {errors.price && (
                                        <p className="text-sm text-destructive">{errors.price}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="currency_id">Currency</Label>
                                    <Select
                                        value={data.currency_id}
                                        onValueChange={value => setData('currency_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {currencies.map((currency) => (
                                                <SelectItem key={currency.id} value={currency.id}>
                                                    {currency.name} ({currency.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.currency_id && (
                                        <p className="text-sm text-destructive">{errors.currency_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="billing_period">Billing Period</Label>
                                    <Select
                                        value={data.billing_period}
                                        onValueChange={value => setData('billing_period', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select billing period" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(billingPeriods).map(([key, value]) => (
                                                <SelectItem key={key} value={key}>
                                                    {value}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.billing_period && (
                                        <p className="text-sm text-destructive">{errors.billing_period}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    placeholder="Enter plan description"
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive">{errors.description}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Features</CardTitle>
                            <CardDescription>
                                Add features included in this plan
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.features.map((feature, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        value={feature}
                                        onChange={e => updateFeature(index, e.target.value)}
                                        placeholder="Enter feature"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => removeFeature(index)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" onClick={addFeature}>
                                Add Feature
                            </Button>
                            {errors.features && (
                                <p className="text-sm text-destructive">{errors.features}</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Provider Settings</CardTitle>
                            <CardDescription>
                                Configure payment provider settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="stripe_product_id">Stripe Product ID</Label>
                                    <Input
                                        id="stripe_product_id"
                                        value={data.provider_plans.stripe.product_id}
                                        onChange={e => setData('provider_plans', {
                                            ...data.provider_plans,
                                            stripe: { ...data.provider_plans.stripe, product_id: e.target.value }
                                        })}
                                        placeholder="prod_xxx"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stripe_price_id">Stripe Price ID</Label>
                                    <Input
                                        id="stripe_price_id"
                                        value={data.provider_plans.stripe.price_id}
                                        onChange={e => setData('provider_plans', {
                                            ...data.provider_plans,
                                            stripe: { ...data.provider_plans.stripe, price_id: e.target.value }
                                        })}
                                        placeholder="price_xxx"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Status & Settings</CardTitle>
                            <CardDescription>
                                Configure plan status and visibility
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={setData.bind(null, 'is_active')}
                                    />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="is_featured"
                                        checked={data.is_featured}
                                        onCheckedChange={setData.bind(null, 'is_featured')}
                                    />
                                    <Label htmlFor="is_featured">Featured Plan</Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Create Plan
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
} 