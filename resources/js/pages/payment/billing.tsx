import { Head } from '@inertiajs/react';
import { PageProps } from '@inertiajs/core';

import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import { type BreadcrumbItem } from '@/types';
import BillingTabs from './components/billing-tabs';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Billing settings',
        href: '/settings/billing',
    },
];

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

interface BillingPageProps extends PageProps {
    subscription: any;
    paymentMethods: any[];
    invoices: any[];
    user: any;
    plans: Record<string, SubscriptionPlan[]>;
}

export default function Billing({ subscription, paymentMethods, invoices, user, plans }: BillingPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Billing settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Billing settings" description="Update your account's billing information and manage your subscription" />
                    <BillingTabs 
                        subscription={subscription}
                        paymentMethods={paymentMethods}
                        invoices={invoices}
                        user={user}
                        plans={plans}
                    />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
