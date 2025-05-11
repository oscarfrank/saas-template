import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Loan Packages',
        href: '/loan-packages',
    },
    {
        title: 'View Loan Package',
        href: '/loan-packages/view',
    },
];

interface ShowProps {
    loanPackage: {
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
        };
        min_duration_days: number;
        max_duration_days: number;
        interest_rate: number;
        interest_type: 'simple' | 'compound';
        interest_calculation: 'daily' | 'weekly' | 'monthly' | 'yearly';
        interest_payment_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'end_of_term';
        risk_level: 'low' | 'medium' | 'high';
        is_active: boolean;
        created_at: string;
        updated_at: string;
    };
}

export default function Show({ loanPackage }: ShowProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`View Loan Package - ${loanPackage.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between">
                    <Link href={route('loan-packages.index')}>
                        <Button variant="outline" className="cursor-pointer">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Loan Packages
                        </Button>
                    </Link>
                    <Link href={route('loan-packages.edit', loanPackage.id)}>
                        <Button className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Loan Package
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="p-6">
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-2xl font-semibold">{loanPackage.name}</h2>
                                <p className="text-muted-foreground">Loan Package Details</p>
                            </div>

                            <div className="space-y-2">
                                <div>
                                    <h3 className="font-medium">Code</h3>
                                    <p className="text-muted-foreground">{loanPackage.code}</p>
                                </div>

                                <div>
                                    <h3 className="font-medium">Description</h3>
                                    <p className="text-muted-foreground">{loanPackage.description}</p>
                                </div>

                                <div>
                                    <h3 className="font-medium">User Type</h3>
                                    <p className="text-muted-foreground capitalize">{loanPackage.user_type}</p>
                                </div>

                                <div>
                                    <h3 className="font-medium">Amount Range</h3>
                                    <p className="text-muted-foreground">
                                        {loanPackage.currency ? 
                                            `${formatCurrency(loanPackage.min_amount, loanPackage.currency.code)} - ${formatCurrency(loanPackage.max_amount, loanPackage.currency.code)}` :
                                            `${loanPackage.min_amount} - ${loanPackage.max_amount}`
                                        }
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-medium">Duration Range</h3>
                                    <p className="text-muted-foreground">
                                        {loanPackage.min_duration_days} - {loanPackage.max_duration_days} days
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-medium">Interest Rate</h3>
                                    <p className="text-muted-foreground">
                                        {loanPackage.interest_rate}% ({loanPackage.interest_type})
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-medium">Interest Calculation</h3>
                                    <p className="text-muted-foreground capitalize">{loanPackage.interest_calculation}</p>
                                </div>

                                <div>
                                    <h3 className="font-medium">Payment Frequency</h3>
                                    <p className="text-muted-foreground capitalize">{loanPackage.interest_payment_frequency.replace('_', ' ')}</p>
                                </div>

                                <div>
                                    <h3 className="font-medium">Risk Level</h3>
                                    <p className="text-muted-foreground capitalize">{loanPackage.risk_level}</p>
                                </div>

                                <div>
                                    <h3 className="font-medium">Status</h3>
                                    <p className="text-muted-foreground">
                                        {loanPackage.is_active ? 'Active' : 'Inactive'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-2xl font-semibold">Additional Information</h2>
                                <p className="text-muted-foreground">Created and Updated Dates</p>
                            </div>

                            <div className="space-y-2">
                                <div>
                                    <h3 className="font-medium">Created At</h3>
                                    <p className="text-muted-foreground">
                                        {new Date(loanPackage.created_at).toLocaleString()}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-medium">Last Updated</h3>
                                    <p className="text-muted-foreground">
                                        {new Date(loanPackage.updated_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
} 