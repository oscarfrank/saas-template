import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EditForm } from './components/edit-form';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Loans',
        href: '/loans',
    },
    {
        title: 'Edit Loan',
        href: '/loans/edit',
    },
];

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
    package?: {
        id: number;
        name: string;
    };
    custom_package?: {
        id: number;
        name: string;
    };
    interest_type: string;
    interest_calculation: string;
    interest_payment_frequency: string;
}

interface Props {
    loan: Loan;
    users: Array<{ id: number; name: string; email: string }>;
    currencies: Array<{ id: number; code: string; symbol: string }>;
    packages: Array<{ id: number; name: string }>;
    customPackages: Array<{ id: number; name: string }>;
}

export default function Edit({ loan, users, currencies, packages, customPackages }: Props) {
    const fields = [
        { 
            name: 'user_id', 
            type: 'select' as const, 
            label: 'Borrower', 
            required: true,
            options: users.map(user => ({ value: user.id.toString(), label: user.name })),
            optionLabel: 'name',
            optionValue: 'id'
        },
        { 
            name: 'package_id', 
            type: 'select' as const, 
            label: 'Loan Package', 
            required: true,
            options: packages.map(pkg => ({ value: pkg.id.toString(), label: pkg.name })),
            optionLabel: 'name',
            optionValue: 'id'
        },
        { 
            name: 'custom_package_id', 
            type: 'select' as const, 
            label: 'Custom Package', 
            required: false,
            options: customPackages.map(pkg => ({ value: pkg.id.toString(), label: pkg.name })),
            optionLabel: 'name',
            optionValue: 'id'
        },
        { 
            name: 'amount', 
            type: 'number' as const, 
            label: 'Loan Amount', 
            required: true,
            min: 0
        },
        { 
            name: 'currency_id', 
            type: 'select' as const, 
            label: 'Currency', 
            required: true,
            options: currencies.map(currency => ({ value: currency.id.toString(), label: `${currency.code} (${currency.symbol})` })),
            optionLabel: 'code',
            optionValue: 'id'
        },
        { 
            name: 'interest_rate', 
            type: 'number' as const, 
            label: 'Interest Rate (%)', 
            required: true,
            min: 0,
            step: 0.01
        },
        { 
            name: 'interest_type', 
            type: 'select' as const, 
            label: 'Interest Type', 
            required: true,
            options: [
                { value: 'simple', label: 'Simple' },
                { value: 'compound', label: 'Compound' }
            ]
        },
        { 
            name: 'interest_calculation', 
            type: 'select' as const, 
            label: 'Interest Calculation', 
            required: true,
            options: [
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' }
            ]
        },
        { 
            name: 'interest_payment_frequency', 
            type: 'select' as const, 
            label: 'Payment Frequency', 
            required: true,
            options: [
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'biweekly', label: 'Bi-weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'yearly', label: 'Yearly' },
                { value: 'end_of_term', label: 'End of Term' }
            ]
        },
        { 
            name: 'duration_days', 
            type: 'number' as const, 
            label: 'Duration (days)', 
            required: true,
            min: 1
        },
        { 
            name: 'purpose', 
            type: 'textarea' as const, 
            label: 'Purpose', 
            required: false
        },
        { 
            name: 'start_date', 
            type: 'date' as const, 
            label: 'Start Date', 
            required: true
        },
        { 
            name: 'end_date', 
            type: 'date' as const, 
            label: 'End Date', 
            required: true
        }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Loan - ${loan.reference_number}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-end">
                    <Link href={route('loans.index')}>
                        <Button variant="outline" className="cursor-pointer">
                            Cancel
                        </Button>
                    </Link>
                </div>
                <EditForm
                    entity={loan}
                    fields={fields}
                    entityName="loan"
                    onSubmit={(formData) => {
                        // The form submission is handled by the EditForm component
                    }}
                    processing={false}
                    errors={{}}
                />
            </div>
        </AppLayout>
    );
} 