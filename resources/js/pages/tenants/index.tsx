import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Table } from './components/table';
import { createColumns } from './components/table-columns';
import { type Tenant } from './components/table-columns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Organizations',
        href: '/tenants',
    },
];

interface Props {
    tenants: Tenant[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function Index({ tenants, pagination }: Props) {
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [key, setKey] = useState(0);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [selectedTenants, setSelectedTenants] = useState<Tenant[]>([]);

    const handlePageChange = (page: number) => {
        setIsLoading(true);
        setError(null);
        const params = new URLSearchParams(window.location.search);
        params.set('page', page.toString());
        
        router.get(route('tenants.index') + '?' + params.toString(), {}, { 
            preserveState: true,
            preserveScroll: true,
            only: ['tenants', 'pagination'],
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
        router.get(route('tenants.index'), { sort, direction }, { 
            preserveState: true,
            preserveScroll: true,
            only: ['tenants', 'pagination'],
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
        
        if (search.trim()) {
            router.get(route('tenants.index'), { search }, { 
                preserveState: true,
                preserveScroll: true,
                only: ['tenants', 'pagination'],
                onSuccess: () => {
                    setIsLoading(false);
                },
                onError: (errors) => {
                    setIsLoading(false);
                    setError('Failed to load data. Please try again.');
                }
            });
        } else {
            router.get(route('tenants.index'), {}, { 
                preserveState: true,
                preserveScroll: true,
                only: ['tenants', 'pagination'],
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
        router.get(route('tenants.index'), { per_page: perPage }, { 
            preserveState: true,
            preserveScroll: true,
            only: ['tenants', 'pagination'],
            onSuccess: () => {
                setIsLoading(false);
            },
            onError: (errors) => {
                setIsLoading(false);
                setError('Failed to load data. Please try again.');
            }
        });
    };

    const handleBulkDelete = useCallback(async (tenants: Tenant[]) => {
        setSelectedTenants(tenants);
        setIsBulkDeleteDialogOpen(true);
    }, []);

    const handleBulkDeleteConfirm = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            for (const tenant of selectedTenants) {
                await router.delete(route('tenants.destroy', tenant.id), {
                    preserveState: true,
                    preserveScroll: true,
                });
            }
            
            toast.success('Selected organizations deleted successfully');
            setKey(prev => prev + 1);
            
            router.reload({
                only: ['tenants', 'pagination'],
                onSuccess: () => {
                    setIsLoading(false);
                    setIsBulkDeleteDialogOpen(false);
                    setSelectedTenants([]);
                },
                onError: (errors) => {
                    setIsLoading(false);
                    setError('Failed to refresh data after deletion');
                }
            });
        } catch (error) {
            toast.error('Failed to delete some organizations');
            setIsLoading(false);
        }
    }, [selectedTenants]);

    const handleDelete = useCallback(async () => {
        if (!selectedTenant) return;

        setIsLoading(true);
        router.delete(route('tenants.destroy', selectedTenant.id), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Organization deleted successfully');
                setIsDeleteDialogOpen(false);
                setSelectedTenant(null);
                setKey(prev => prev + 1);
                router.reload({
                    only: ['tenants', 'pagination'],
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
                toast.error('Failed to delete organization');
                setIsLoading(false);
            }
        });
    }, [selectedTenant]);

    const handleDeleteClick = useCallback((tenant: Tenant) => {
        setSelectedTenant(tenant);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleDialogClose = useCallback(() => {
        setIsDeleteDialogOpen(false);
        setSelectedTenant(null);
    }, []);

    const columns = createColumns({
        onDelete: handleDeleteClick
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Organizations Management" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                    </div>
                    <Link href={route('tenants.create')}>
                        <Button className="cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Organization
                        </Button>
                    </Link>
                </div>
                <Table
                    key={key}
                    columns={columns}
                    data={tenants}
                    searchPlaceholder="Search organizations..."
                    searchColumns={["name", "slug"]}
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
                    onClose={handleDialogClose}
                    onConfirm={handleDelete}
                    title="Delete Organization"
                    description="Are you sure you want to delete this organization? This action cannot be undone."
                />

                <CustomAlertDialog
                    isOpen={isBulkDeleteDialogOpen}
                    onClose={() => setIsBulkDeleteDialogOpen(false)}
                    onConfirm={handleBulkDeleteConfirm}
                    title="Delete Organizations"
                    description={`Are you sure you want to delete ${selectedTenants.length} organizations? This action cannot be undone.`}
                />
            </div>
        </AppLayout>
    );
} 