import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight, Clock, Percent, Shield, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Table } from '../components/table';
import { createColumns } from '../components/table-columns';
import { Plus } from 'lucide-react';
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Loan Packages',
        href: '/loan-packages',
    },
    {
        title: 'Browse Packages',
        href: '/loan-packages/browse',
    },
];

interface LoanPackage {
    id: number;
    name: string;
    code: string;
    description: string;
    user_type: 'borrower' | 'lender';
    min_amount: number;
    max_amount: number;
    currency: {
        code: string;
        name: string;
        id: number;
    };
    min_duration_days: number;
    max_duration_days: number;
    interest_rate: number;
    interest_type: 'simple' | 'compound';
    interest_calculation: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interest_payment_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'end_of_term';
    risk_level: 'low' | 'medium' | 'high';
    is_active: boolean;
    color_code: string | null;
    is_featured: boolean;
}

interface Props {
    loanPackages: LoanPackage[];
    user: any;
    loanSettings: {
        allow_loans_without_kyc: boolean;
    };
}

const getRiskLevelColor = (level: string) => {
    switch (level) {
        case 'low':
            return 'bg-green-100 text-green-800';
        case 'medium':
            return 'bg-yellow-100 text-yellow-800';
        case 'high':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const getInterestTypeColor = (type: string) => {
    switch (type) {
        case 'simple':
            return 'bg-blue-100 text-blue-800';
        case 'compound':
            return 'bg-purple-100 text-purple-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export default function Browse({ loanPackages, user, loanSettings }: Props) {

    const { tenant } = usePage().props;


    const [selectedPackage, setSelectedPackage] = useState<LoanPackage | null>(null);
    const [isActivating, setIsActivating] = useState(false);
    const [loanAmount, setLoanAmount] = useState<string>('');
    const [showKycDialog, setShowKycDialog] = useState(false);

    const activePackages = loanPackages.filter(pkg => pkg.is_active);
    const featuredPackages = activePackages.filter(pkg => pkg.is_featured);
    const regularPackages = activePackages.filter(pkg => !pkg.is_featured);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        if (value === '') {
            setLoanAmount('');
            return;
        }
        const numericValue = parseInt(value, 10);
        if (!isNaN(numericValue)) {
            setLoanAmount(numericValue.toLocaleString());
        }
    };

    const handleActivate = async () => {
        if (!selectedPackage) return;

        // Check KYC only if loans without KYC are not allowed
        if (!loanSettings.allow_loans_without_kyc && !user.kyc_verified_at) {
            setShowKycDialog(true);
            return;
        }

        // Convert formatted amount back to number
        const numericAmount = parseInt(loanAmount.replace(/,/g, ''), 10);
        
        if (isNaN(numericAmount)) {
            toast.error('Please enter a valid loan amount');
            return;
        }

        if (numericAmount < selectedPackage.min_amount || numericAmount > selectedPackage.max_amount) {
            toast.error(`Amount must be between ${formatCurrency(selectedPackage.min_amount, selectedPackage.currency.code)} and ${formatCurrency(selectedPackage.max_amount, selectedPackage.currency.code)}`);
            return;
        }

        setIsActivating(true);
        try {
            router.post(route('user-loans.store', { tenant }), {
                package_id: selectedPackage.id,
                amount: numericAmount,
                duration_days: selectedPackage.min_duration_days,
                currency_id: selectedPackage.currency.id,
                interest_rate: selectedPackage.interest_rate,
                interest_type: selectedPackage.interest_type,
                interest_calculation: selectedPackage.interest_calculation,
                interest_payment_frequency: selectedPackage.interest_payment_frequency,
                purpose: 'Loan package activation',
                status: 'pending'
            }, {
                onSuccess: () => {
                    toast.success('Loan package activated successfully');
                    setSelectedPackage(null);
                    setLoanAmount('');
                },
                onError: (errors) => {
                    toast.error('Failed to activate loan package');
                    console.error(errors);
                },
                onFinish: () => {
                    setIsActivating(false);
                }
            });
        } catch (error) {
            console.error('Error activating loan package:', error);
            setIsActivating(false);
        }
    };

    const handleKycRedirect = () => {
        // If user has a pending KYC, redirect to KYC status page
        if (user.kyc_verification?.status === 'pending') {
            router.visit(route('kyc.show'));
        } else {
            // Otherwise, redirect to KYC submission page
            router.visit(route('kyc.create'));
        }
    };

    const PackageCard = ({ pkg }: { pkg: LoanPackage }) => (
        <Card key={pkg.id} className="overflow-hidden">
            <div 
                className="h-2 w-full" 
                style={{ backgroundColor: pkg.color_code || '#3b82f6' }}
            />
            <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-semibold">{pkg.name}</h3>
                        <p className="text-sm text-muted-foreground">{pkg.code}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                        {pkg.user_type}
                    </Badge>
                </div>

                <p className="text-muted-foreground line-clamp-2">{pkg.description}</p>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Amount Range</p>
                        <p className="font-medium">
                            {formatCurrency(pkg.min_amount, pkg.currency.code)} - {formatCurrency(pkg.max_amount, pkg.currency.code)}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium">{pkg.min_duration_days} - {pkg.max_duration_days} days</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Badge className={getRiskLevelColor(pkg.risk_level)}>
                        <Shield className="mr-1 h-3 w-3" />
                        {pkg.risk_level} Risk
                    </Badge>
                    <Badge className={getInterestTypeColor(pkg.interest_type)}>
                        <Percent className="mr-1 h-3 w-3" />
                        {pkg.interest_type} Interest
                    </Badge>
                    <Badge variant="outline">
                        <Clock className="mr-1 h-3 w-3" />
                        {pkg.interest_payment_frequency.replace('_', ' ')}
                    </Badge>
                </div>

                <div className="pt-4">
                    <Button className="w-full" onClick={() => setSelectedPackage(pkg)}>
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Browse Loan Packages" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Featured Packages Section */}
                {featuredPackages.length > 0 && (
                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold">Featured Packages</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {featuredPackages.map((pkg) => (
                                <PackageCard key={pkg.id} pkg={pkg} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Regular Packages Section */}
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">Available Packages</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {regularPackages.map((pkg) => (
                            <PackageCard key={pkg.id} pkg={pkg} />
                        ))}
                    </div>
                </section>

                {/* Package Details Modal */}
                <Dialog open={!!selectedPackage} onOpenChange={() => {
                    setSelectedPackage(null);
                    setLoanAmount('');
                }}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{selectedPackage?.name}</DialogTitle>
                            <DialogDescription>{selectedPackage?.code}</DialogDescription>
                        </DialogHeader>

                        {selectedPackage && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium mb-2">Package Details</h4>
                                        <div className="space-y-2">
                                            <p><span className="text-muted-foreground">Type:</span> {selectedPackage.user_type}</p>
                                            <p><span className="text-muted-foreground">Amount Range:</span> {formatCurrency(selectedPackage.min_amount, selectedPackage.currency.code)} - {formatCurrency(selectedPackage.max_amount, selectedPackage.currency.code)}</p>
                                            <p><span className="text-muted-foreground">Duration:</span> {selectedPackage.min_duration_days} - {selectedPackage.max_duration_days} days</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-2">Interest Details</h4>
                                        <div className="space-y-2">
                                            <p><span className="text-muted-foreground">Rate:</span> {selectedPackage.interest_rate}%</p>
                                            <p><span className="text-muted-foreground">Type:</span> {selectedPackage.interest_type}</p>
                                            <p><span className="text-muted-foreground">Calculation:</span> {selectedPackage.interest_calculation}</p>
                                            <p><span className="text-muted-foreground">Payment Frequency:</span> {selectedPackage.interest_payment_frequency.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-2">Description</h4>
                                    <p className="text-muted-foreground">{selectedPackage.description}</p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Badge className={getRiskLevelColor(selectedPackage.risk_level)}>
                                        <Shield className="mr-1 h-3 w-3" />
                                        {selectedPackage.risk_level} Risk
                                    </Badge>
                                    <Badge className={getInterestTypeColor(selectedPackage.interest_type)}>
                                        <Percent className="mr-1 h-3 w-3" />
                                        {selectedPackage.interest_type} Interest
                                    </Badge>
                                    <Badge variant="outline">
                                        <Clock className="mr-1 h-3 w-3" />
                                        {selectedPackage.interest_payment_frequency.replace('_', ' ')}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="loanAmount" className="text-sm font-medium">
                                        Enter Loan Amount ({selectedPackage.currency.code})
                                    </label>
                                    <Input
                                        id="loanAmount"
                                        type="text"
                                        value={loanAmount}
                                        onChange={handleAmountChange}
                                        placeholder={`Enter amount between ${formatCurrency(selectedPackage.min_amount, selectedPackage.currency.code)} and ${formatCurrency(selectedPackage.max_amount, selectedPackage.currency.code)}`}
                                        className="text-right"
                                    />
                                </div>

                                <DialogFooter>
                                    <Button variant="outline" onClick={() => {
                                        setSelectedPackage(null);
                                        setLoanAmount('');
                                    }}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleActivate} disabled={isActivating || !loanAmount}>
                                        {isActivating ? 'Activating...' : 'Activate Package'}
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* KYC Verification Dialog */}
                <Dialog open={showKycDialog} onOpenChange={setShowKycDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>KYC Verification Required</DialogTitle>
                            <DialogDescription>
                                {user.kyc_verification?.status === 'pending' 
                                    ? 'Your KYC verification is currently pending review. Please check your KYC status.'
                                    : 'You need to complete your KYC verification before you can activate a loan package. This is required to ensure the security and compliance of our platform.'}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowKycDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleKycRedirect}>
                                {user.kyc_verification?.status === 'pending' ? 'Check KYC Status' : 'Complete KYC'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
} 