import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { EditForm } from './components/edit-form';
import { type Tenant } from './components/table-columns';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Organizations',
        href: '/tenants',
    },
    {
        title: 'Edit Organization',
        href: '/tenants/edit',
    },
];

interface EditProps {
    tenant: Tenant;
    errors: Record<string, string>;
}

export default function Edit({ tenant, errors }: EditProps) {
    const fields = [
        { name: 'name', type: 'text' as const, label: 'Organization Name', required: true },
        { name: 'slug', type: 'text' as const, label: 'Organization Slug', required: true },
    ];

    const handleSubmit = (formData: any) => {
        router.put(route('tenants.update', tenant.id), formData, {
            onSuccess: () => {
                toast.success('Organization updated successfully');
                router.visit(route('tenants.index'));
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Organization" />
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
                    onSubmit={handleSubmit}
                    processing={false}
                    errors={errors}
                    initialData={tenant}
                />
            </div>
        </AppLayout>
    );
} 