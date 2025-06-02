import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { type Product } from './components/table-columns';
import { ArrowLeft, Edit } from 'lucide-react';
import { useTenantRouter } from '@/hooks/use-tenant-router';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products',
        href: '/products',
    },
    {
        title: 'View Product',
        href: '/products/view',
    },
];

interface ShowProps {
    product: Product;
}

export default function Show({ product }: ShowProps) {
    const tenantRouter = useTenantRouter();
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`View Product - ${product.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between">
                    <Link href={tenantRouter.route('products.index')}>
                        <Button variant="outline" className="cursor-pointer">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Products
                        </Button>
                    </Link>
                    <Link href={tenantRouter.route('products.edit', { product: product.id })}>
                        <Button className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Product
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="p-6">
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-2xl font-semibold">{product.name}</h2>
                                <p className="text-muted-foreground">Product Details</p>
                            </div>

                            <div className="space-y-2">
                                <div>
                                    <h3 className="font-medium">Description</h3>
                                    <p className="text-muted-foreground">{product.description}</p>
                                </div>

                                <div>
                                    <h3 className="font-medium">Price</h3>
                                    <p className="text-muted-foreground">${product.price.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-2xl font-semibold">Product Image</h2>
                                <p className="text-muted-foreground">Featured Image</p>
                            </div>

                            <div className="aspect-square overflow-hidden rounded-lg">
                                <img
                                    src={product.featured_image ?? undefined}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
} 