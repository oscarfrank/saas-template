import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { EditForm } from './components/edit-form';
import { router } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Loan Packages',
        href: '/loan-packages',
    },
];

interface Props {
    currencies: Array<{ id: number; code: string; name: string }>;
}

export default function Create({ currencies }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        description: '',
        user_type: 'borrower',
        min_amount: '',
        max_amount: '',
        currency_id: '',
        min_duration_days: '',
        max_duration_days: '',
        has_fixed_duration: false,
        fixed_duration_days: '',
        interest_rate: '',
        interest_type: 'simple',
        interest_calculation: 'monthly',
        interest_payment_frequency: 'monthly',
        origination_fee_fixed: '',
        origination_fee_percentage: '',
        late_payment_fee_fixed: '',
        late_payment_fee_percentage: '',
        grace_period_days: '',
        allows_early_repayment: false,
        early_repayment_fee_percentage: '',
        requires_collateral: false,
        collateral_percentage: '',
        collateral_requirements: '',
        min_credit_score: '',
        min_income: '',
        min_kyc_level: '',
        eligible_countries: [],
        risk_level: 'medium',
        is_active: true,
        available_from: '',
        available_until: '',
        available_quantity: '',
        icon: null as File | null,
        color_code: '',
        display_order: '',
        is_featured: false,
        terms_document: null as File | null,
        contract_template: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('loan-packages.store'), {
            preserveScroll: true,
        });
    };

    const fields = [
        {
            name: 'name',
            type: 'text' as const,
            label: 'Name',
            required: true,
            colSpan: 2,
        },
        {
            name: 'code',
            type: 'text' as const,
            label: 'Code',
            required: true,
        },
        {
            name: 'description',
            type: 'textarea' as const,
            label: 'Description',
            required: true,
            colSpan: 3,
        },
        {
            name: 'user_type',
            type: 'select' as const,
            label: 'User Type',
            required: true,
            options: [
                { value: 'borrower', label: 'Borrower' },
                { value: 'lender', label: 'Lender' },
            ],
            defaultValue: 'borrower',
        },
        {
            name: 'min_amount',
            type: 'number' as const,
            label: 'Minimum Amount',
            required: true,
        },
        {
            name: 'max_amount',
            type: 'number' as const,
            label: 'Maximum Amount',
            required: true,
        },
        {
            name: 'currency_id',
            type: 'select' as const,
            label: 'Currency',
            required: true,
            options: currencies.map(currency => ({
                value: currency.id.toString(),
                label: `${currency.code} - ${currency.name}`,
            })),
        },
        {
            name: 'min_duration_days',
            type: 'number' as const,
            label: 'Minimum Duration (Days)',
            required: true,
        },
        {
            name: 'max_duration_days',
            type: 'number' as const,
            label: 'Maximum Duration (Days)',
            required: true,
        },
        {
            name: 'has_fixed_duration',
            type: 'checkbox' as const,
            label: 'Has Fixed Duration',
            defaultValue: false,
        },
        {
            name: 'fixed_duration_days',
            type: 'number' as const,
            label: 'Fixed Duration (Days)',
            required: false,
        },
        {
            name: 'interest_rate',
            type: 'number' as const,
            label: 'Interest Rate (%)',
            required: true,
        },
        {
            name: 'interest_type',
            type: 'select' as const,
            label: 'Interest Type',
            required: true,
            options: [
                { value: 'simple', label: 'Simple' },
                { value: 'compound', label: 'Compound' },
            ],
            defaultValue: 'simple',
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
                { value: 'yearly', label: 'Yearly' },
            ],
            defaultValue: 'monthly',
        },
        {
            name: 'interest_payment_frequency',
            type: 'select' as const,
            label: 'Interest Payment Frequency',
            required: true,
            options: [
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'biweekly', label: 'Biweekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'yearly', label: 'Yearly' },
                { value: 'end_of_term', label: 'End of Term' },
            ],
            defaultValue: 'monthly',
        },
        {
            name: 'origination_fee_fixed',
            type: 'number' as const,
            label: 'Origination Fee (Fixed)',
            required: true,
        },
        {
            name: 'origination_fee_percentage',
            type: 'number' as const,
            label: 'Origination Fee (%)',
            required: true,
        },
        {
            name: 'late_payment_fee_fixed',
            type: 'number' as const,
            label: 'Late Payment Fee (Fixed)',
            required: true,
        },
        {
            name: 'late_payment_fee_percentage',
            type: 'number' as const,
            label: 'Late Payment Fee (%)',
            required: true,
        },
        {
            name: 'grace_period_days',
            type: 'number' as const,
            label: 'Grace Period (Days)',
            required: true,
        },
        {
            name: 'allows_early_repayment',
            type: 'checkbox' as const,
            label: 'Allows Early Repayment',
            defaultValue: false,
        },
        {
            name: 'early_repayment_fee_percentage',
            type: 'number' as const,
            label: 'Early Repayment Fee (%)',
            required: true,
        },
        {
            name: 'requires_collateral',
            type: 'checkbox' as const,
            label: 'Requires Collateral',
            defaultValue: false,
        },
        {
            name: 'collateral_percentage',
            type: 'number' as const,
            label: 'Collateral Percentage (%)',
            required: false,
        },
        {
            name: 'collateral_requirements',
            type: 'textarea' as const,
            label: 'Collateral Requirements',
            required: false,
            colSpan: 2,
        },
        {
            name: 'min_credit_score',
            type: 'number' as const,
            label: 'Minimum Credit Score',
            required: false,
        },
        {
            name: 'min_income',
            type: 'number' as const,
            label: 'Minimum Income',
            required: false,
        },
        {
            name: 'min_kyc_level',
            type: 'number' as const,
            label: 'Minimum KYC Level',
            required: true,
        },
        {
            name: 'risk_level',
            type: 'select' as const,
            label: 'Risk Level',
            required: true,
            options: [
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
            ],
            defaultValue: 'medium',
        },
        {
            name: 'is_active',
            type: 'checkbox' as const,
            label: 'Active',
            defaultValue: true,
        },
        {
            name: 'available_from',
            type: 'datetime' as const,
            label: 'Available From',
            required: false,
        },
        {
            name: 'available_until',
            type: 'datetime' as const,
            label: 'Available Until',
            required: false,
        },
        {
            name: 'available_quantity',
            type: 'number' as const,
            label: 'Available Quantity',
            required: false,
        },
        {
            name: 'icon',
            type: 'file' as const,
            label: 'Icon',
            accept: 'image/*',
        },
        {
            name: 'color_code',
            type: 'text' as const,
            label: 'Color Code',
            required: false,
        },
        {
            name: 'display_order',
            type: 'number' as const,
            label: 'Display Order',
            required: true,
        },
        {
            name: 'is_featured',
            type: 'checkbox' as const,
            label: 'Featured',
            defaultValue: false,
        },
        {
            name: 'terms_document',
            type: 'file' as const,
            label: 'Terms Document',
            accept: '.pdf,.doc,.docx',
        },
        {
            name: 'contract_template',
            type: 'file' as const,
            label: 'Contract Template',
            accept: '.pdf,.doc,.docx',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Loan Package" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">Create Loan Package</h1>
                    <Link href={route('loan-packages.index')}>
                        <Button variant="outline">Cancel</Button>
                    </Link>
                </div>

                <EditForm
                    fields={fields}
                    entityName="Loan Package"
                    onSubmit={handleSubmit}
                    processing={processing}
                    errors={errors}
                    data={data}
                    setData={setData}
                />
            </div>
        </AppLayout>
    );
}
