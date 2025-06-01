import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { EditForm } from './components/edit-form';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Organizations',
        href: '/tenants',
    },
    {
        title: 'Create Organization',
        href: '/tenants/create',
    },
];

export default function Create() {
    const fields = [
        { name: 'name' as const, type: 'text' as const, label: 'Organization Name', required: true },
        { name: 'slug' as const, type: 'text' as const, label: 'Organization URL', required: true },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Organization" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-end">
                    <Link href={route('tenants.index')}>
                        <Button variant="outline" className="cursor-pointer">
                            Cancel
                        </Button>
                    </Link>
                </div>
                <EditForm
                    fields={fields}
                    entityName="organization"
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