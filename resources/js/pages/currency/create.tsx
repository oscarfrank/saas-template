import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Currencies',
        href: '/admin/currencies',
    },
    {
        title: 'Create Currency',
        href: '/admin/currencies/create',
    },
];

interface Props {
    types: Record<string, string>;
    riskLevels: Record<string, string>;
}

export default function Create({ types, riskLevels }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        name: '',
        symbol: '',
        type: 'fiat',
        decimal_places: 2,
        decimal_separator: '.',
        thousand_separator: ',',
        symbol_position: 'before',
        is_base_currency: false,
        exchange_rate_to_base: 1,
        is_active: true,
        min_transaction_amount: null,
        max_transaction_amount: null,
        withdrawal_fee_fixed: null,
        withdrawal_fee_percent: null,
        deposit_fee_fixed: null,
        deposit_fee_percent: null,
        risk_level: 'low',
        requires_enhanced_verification: false,
        description: '',
        additional_info: {},
        icon: null,
        is_default: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('currencies.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Currency" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between">
                    <h1 className="text-2xl font-semibold">Create Currency</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>
                                Enter the basic information for the currency
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Currency Code</Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={e => setData('code', e.target.value)}
                                        placeholder="USD"
                                        required
                                    />
                                    {errors.code && (
                                        <p className="text-sm text-destructive">{errors.code}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Currency Name</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        placeholder="US Dollar"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="symbol">Symbol</Label>
                                    <Input
                                        id="symbol"
                                        value={data.symbol}
                                        onChange={e => setData('symbol', e.target.value)}
                                        placeholder="$"
                                        required
                                    />
                                    {errors.symbol && (
                                        <p className="text-sm text-destructive">{errors.symbol}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select
                                        value={data.type}
                                        onValueChange={value => setData('type', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(types).map(([key, value]) => (
                                                <SelectItem key={key} value={key}>
                                                    {value}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.type && (
                                        <p className="text-sm text-destructive">{errors.type}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Display Settings</CardTitle>
                            <CardDescription>
                                Configure how the currency is displayed
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="decimal_places">Decimal Places</Label>
                                    <Input
                                        id="decimal_places"
                                        type="number"
                                        value={data.decimal_places}
                                        onChange={e => setData('decimal_places', parseInt(e.target.value))}
                                        min="0"
                                        max="18"
                                        required
                                    />
                                    {errors.decimal_places && (
                                        <p className="text-sm text-destructive">{errors.decimal_places}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="symbol_position">Symbol Position</Label>
                                    <Select
                                        value={data.symbol_position}
                                        onValueChange={value => setData('symbol_position', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select position" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="before">Before Amount</SelectItem>
                                            <SelectItem value="after">After Amount</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.symbol_position && (
                                        <p className="text-sm text-destructive">{errors.symbol_position}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Status & Settings</CardTitle>
                            <CardDescription>
                                Configure currency status and availability
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
                                        id="is_default"
                                        checked={data.is_default}
                                        onCheckedChange={setData.bind(null, 'is_default')}
                                    />
                                    <Label htmlFor="is_default">Default Currency</Label>
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
                            Create Currency
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
} 