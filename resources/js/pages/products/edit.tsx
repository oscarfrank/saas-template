import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { EditForm } from './components/edit-form';
import { type Product } from './components/table-columns';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products',
        href: '/products',
    },
    {
        title: 'Edit Product',
        href: '/products/edit',
    },
];

interface EditProps {
    product: Product;
}

export default function Edit({ product }: EditProps) {
    const fields = [
        { name: 'name', type: 'text' as const, label: 'Name', required: true },
        { name: 'description', type: 'textarea' as const, label: 'Description', required: true },
        { name: 'price', type: 'number' as const, label: 'Price', required: true },
        { name: 'image', type: 'file' as const, label: 'Image', accept: 'image/*' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Product" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-end">
                    <Link href={route('products.index')}>
                        <Button variant="outline">
                            Cancel
                        </Button>
                    </Link>
                </div>
                <EditForm
                    entity={product}
                    fields={fields}
                    entityName="product"
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