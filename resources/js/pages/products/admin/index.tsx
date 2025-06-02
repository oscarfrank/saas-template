import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { UltimateTable } from '@/components/ui/ultimate-table';
import { createProductsTableConfig } from '../components/configs/config-user-table';
import { type Product } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products',
        href: '/products',
    },
];

interface Props {
    products: Product[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function Index({ products, pagination }: Props) {
    const tenantRouter = useTenantRouter();
    const tableConfig = createProductsTableConfig(products, pagination);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products Management" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                    </div>
                    <Link href={tenantRouter.route('products.create')}>
                        <Button className="cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </Link>
                </div>

                <UltimateTable config={tableConfig} />
            </div>
        </AppLayout>
    );
} 