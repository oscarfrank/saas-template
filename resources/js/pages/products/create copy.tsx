import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './details/table-columns';
import { type Product } from './details/table-columns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Create Product',
        href: '/products/create',
    },
];


export default function Index() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products Management" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <h1>Add Product</h1>
            </div>
        </AppLayout>
    );
}
