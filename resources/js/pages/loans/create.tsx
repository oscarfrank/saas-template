import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { EditForm } from './components/edit-form';
import { useTenantRouter } from '@/hooks/use-tenant-router';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Loans',
        href: '/loans',
    },
    {
        title: 'Create Loan',
        href: '/loans/create',
    },
];

interface Props {
    users: Array<{ 
        id: number; 
        first_name: string; 
        last_name: string; 
        email: string; 
    }>;
    currencies: Array<{ id: number; code: string; symbol: string }>;
    packages: Array<{ id: number; name: string }>;
    customPackages: Array<{ id: number; name: string }>;
}

export default function Create({ users, currencies, packages, customPackages }: Props) {
    const tenantRouter = useTenantRouter();
    const fields = [
        { 
            name: 'user_id', 
            type: 'select' as const, 
            label: 'Borrower', 
            required: true,
            options: users.map(user => ({ 
                value: user.id.toString(), 
                label: `${user.first_name} ${user.last_name}` 
            })),
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
            label: 'Duration (Days)', 
            required: true,
            min: 1
        },
        { 
            name: 'purpose', 
            type: 'textarea' as const, 
            label: 'Loan Purpose', 
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
        },
        { 
            name: 'status', 
            type: 'select' as const, 
            label: 'Status', 
            required: true,
            options: [
                { value: 'draft', label: 'Draft' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'disbursed', label: 'Disbursed' },
                { value: 'active', label: 'Active' },
                { value: 'in_arrears', label: 'In Arrears' },
                { value: 'defaulted', label: 'Defaulted' },
                { value: 'paid', label: 'Paid' },
                { value: 'closed', label: 'Closed' },
                { value: 'cancelled', label: 'Cancelled' }
            ]
        }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Loan" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-end">
                    <Link href={tenantRouter.route('loans.index')}>
                        <Button variant="outline" className="cursor-pointer">
                            Cancel
                        </Button>
                    </Link>
                </div>
                <EditForm
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
