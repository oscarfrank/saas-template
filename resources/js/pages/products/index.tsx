import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './components/table-columns';
import { type Product } from './components/table-columns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

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
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [key, setKey] = useState(0);

    const handlePageChange = (page: number) => {
        setIsLoading(true);
        setError(null);
        const params = new URLSearchParams(window.location.search);
        params.set('page', page.toString());
        
        router.get(route('products.index') + '?' + params.toString(), {}, { 
            preserveState: true,
            preserveScroll: true,
            only: ['products', 'pagination'],
            replace: true,
            onSuccess: () => {
                setIsLoading(false);
            },
            onError: (errors) => {
                setIsLoading(false);
                setError('Failed to load data. Please try again.');
            }
        });
    };

    const handleSortChange = (sort: string, direction: 'asc' | 'desc') => {
        setIsLoading(true);
        setError(null);
        router.get(route('products.index'), { sort, direction }, { 
            preserveState: true,
            preserveScroll: true,
            only: ['products', 'pagination'],
            onSuccess: () => {
                setIsLoading(false);
            },
            onError: (errors) => {
                setIsLoading(false);
                setError('Failed to load data. Please try again.');
            }
        });
    };

    const handleSearchChange = (search: string) => {
        setIsLoading(true);
        setError(null);
        router.get(route('products.index'), { search }, { 
            preserveState: true,
            preserveScroll: true,
            only: ['products', 'pagination'],
            onSuccess: () => {
                setIsLoading(false);
            },
            onError: (errors) => {
                setIsLoading(false);
                setError('Failed to load data. Please try again.');
            }
        });
    };

    const handlePerPageChange = (perPage: number) => {
        setIsLoading(true);
        setError(null);
        router.get(route('products.index'), { per_page: perPage }, { 
            preserveState: true,
            preserveScroll: true,
            only: ['products', 'pagination'],
            onSuccess: () => {
                setIsLoading(false);
            },
            onError: (errors) => {
                setIsLoading(false);
                setError('Failed to load data. Please try again.');
            }
        });
    };

    const handleBulkDelete = useCallback(async (products: Product[]) => {
        if (!window.confirm(`Are you sure you want to delete ${products.length} selected product(s)? This action cannot be undone.`)) {
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            // Delete products sequentially
            for (const product of products) {
                await router.delete(route('products.destroy', product.id), {
                    preserveState: true,
                    preserveScroll: true,
                });
            }
            
            toast.success('Selected products deleted successfully');
            
            // Force a complete table reset
            setKey(prev => prev + 1);
            
            // Reload the data
            router.reload({
                only: ['products', 'pagination'],
                onSuccess: () => {
                    setIsLoading(false);
                },
                onError: (errors) => {
                    setIsLoading(false);
                    setError('Failed to refresh data after deletion');
                }
            });
        } catch (error) {
            toast.error('Failed to delete some products');
            setIsLoading(false);
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products Management" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-end">
                    <Link href={route('products.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </Link>
                </div>
                <DataTable
                    key={key}
                    columns={columns}
                    data={products}
                    searchPlaceholder="Search products..."
                    searchColumns={["name", "description"]}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onSortChange={handleSortChange}
                    onSearchChange={handleSearchChange}
                    onPerPageChange={handlePerPageChange}
                    isLoading={isLoading}
                    error={error ?? undefined}
                    onBulkDelete={handleBulkDelete}
                    resetSelection={true}
                />
            </div>
        </AppLayout>
    );
}
