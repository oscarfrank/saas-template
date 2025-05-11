import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { EmailTemplateForm } from './components/form';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Email Templates',
        href: '/admin/email-templates',
    },
    {
        title: 'Create Template',
        href: '/admin/email-templates/create',
    },
];

interface Props {
    placeholders: Record<string, string>;
}

export default function Create({ placeholders }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Email Template" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between">
                    <h1 className="text-2xl font-semibold">Create Email Template</h1>
                </div>

                <div className="mt-4">
                    <EmailTemplateForm placeholders={placeholders} />
                </div>
            </div>
        </AppLayout>
    );
} 