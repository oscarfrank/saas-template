import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Table } from './components/table';
import { createColumns } from './components/table-columns';
import { type Product } from './components/table-columns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';
import { formatCurrency } from "@/lib/utils";

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
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

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
        
        // Only trigger search if there's actual input
        if (search.trim()) {
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
        } else {
            // If search is empty, just reload the page without search parameter
            router.get(route('products.index'), {}, { 
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
        }
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
        setSelectedProducts(products);
        setIsBulkDeleteDialogOpen(true);
    }, []);

    const handleBulkDeleteConfirm = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Delete products sequentially
            for (const product of selectedProducts) {
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
                    setIsBulkDeleteDialogOpen(false);
                    setSelectedProducts([]);
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
    }, [selectedProducts]);

    const handleDelete = useCallback(async () => {
        if (!selectedProduct) return;

        setIsLoading(true);
        router.delete(route('products.destroy', selectedProduct.id), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Product deleted successfully');
                setIsDeleteDialogOpen(false);
                setSelectedProduct(null);
                // Force a complete table reset
                setKey(prev => prev + 1);
                // Reload the data
                router.reload({
                    only: ['products', 'pagination'],
                    onSuccess: () => {
                        setIsLoading(false);
                    },
                    onError: () => {
                        setIsLoading(false);
                        toast.error('Failed to refresh data after deletion');
                    }
                });
            },
            onError: () => {
                toast.error('Failed to delete product');
                setIsLoading(false);
            }
        });
    }, [selectedProduct]);

    const handleDeleteClick = useCallback((product: Product) => {
        setSelectedProduct(product);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleDialogClose = useCallback(() => {
        setIsDeleteDialogOpen(false);
        setSelectedProduct(null);
    }, []);

    const columns = createColumns({
        onDelete: handleDeleteClick
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products Management" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                    </div>
                    <Link href={route('products.create')}>
                        <Button className="cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </Link>
                </div>
                <Table
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

                <CustomAlertDialog
                    isOpen={isDeleteDialogOpen}
                    onClose={() => setIsDeleteDialogOpen(false)}
                    onConfirm={handleDelete}
                    title="Are you sure?"
                    description={`This action cannot be undone. This will permanently delete the product "${selectedProduct?.name}".`}
                    isLoading={isLoading}
                />

                <CustomAlertDialog
                    isOpen={isBulkDeleteDialogOpen}
                    onClose={() => {
                        setIsBulkDeleteDialogOpen(false);
                        setSelectedProducts([]);
                    }}
                    onConfirm={handleBulkDeleteConfirm}
                    title="Are you sure?"
                    description={`This action cannot be undone. This will permanently delete ${selectedProducts.length} selected product(s).`}
                    confirmText="Delete Selected"
                    isLoading={isLoading}
                />
            </div>
        </AppLayout>
    );
}
