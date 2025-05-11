import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { EditForm } from './components/edit-form';

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

export default function Create() {
    const fields = [
        { 
            name: 'user_id', 
            type: 'select' as const, 
            label: 'Borrower', 
            required: true,
            options: [], // Will be populated from the backend
            optionLabel: 'name',
            optionValue: 'id'
        },
        { 
            name: 'package_id', 
            type: 'select' as const, 
            label: 'Loan Package', 
            required: true,
            options: [], // Will be populated from the backend
            optionLabel: 'name',
            optionValue: 'id'
        },
        { 
            name: 'custom_package_id', 
            type: 'select' as const, 
            label: 'Custom Package', 
            required: false,
            options: [], // Will be populated from the backend
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
            options: [], // Will be populated from the backend
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
        }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Loan" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-end">
                    <Link href={route('loans.index')}>
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
