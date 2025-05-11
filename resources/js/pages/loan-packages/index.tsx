import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Table } from './components/table';
import { createColumns } from './components/table-columns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';
import { formatCurrency } from "@/lib/utils";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Loan Packages',
        href: '/loan-packages',
    },
];

interface Props {
    loanPackages: {
        data: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function Index({ loanPackages }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);

    const handleBulkDelete = async (selectedRows: any[]) => {
        if (!selectedRows.length) return;

        setIsDeleting(true);
        try {
            await router.post(route('loan-packages.bulk-delete'), {
                ids: selectedRows.map(row => row.id)
            }, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Selected loan packages deleted successfully');
                    router.reload({ only: ['loanPackages'] });
                },
                onError: () => {
                    toast.error('Failed to delete selected loan packages');
                },
                onFinish: () => {
                    setIsDeleting(false);
                }
            });
        } catch (error) {
            console.error('Bulk delete failed:', error);
            setIsDeleting(false);
        }
    };

    const handleBulkArchive = async (selectedRows: any[]) => {
        if (!selectedRows.length) return;

        setIsArchiving(true);
        try {
            await router.post(route('loan-packages.bulk-archive'), {
                ids: selectedRows.map(row => row.id)
            }, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Selected loan packages archived successfully');
                    router.reload({ only: ['loanPackages'] });
                },
                onError: () => {
                    toast.error('Failed to archive selected loan packages');
                },
                onFinish: () => {
                    setIsArchiving(false);
                }
            });
        } catch (error) {
            console.error('Bulk archive failed:', error);
            setIsArchiving(false);
        }
    };

    const columns = createColumns({
        onDelete: (loanPackage) => {
            router.delete(route('loan-packages.destroy', loanPackage.id), {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Loan package deleted successfully');
                    router.reload({ only: ['loanPackages'] });
                },
                onError: () => {
                    toast.error('Failed to delete loan package');
                }
            });
        }
    });

    const bulkActions = [
        {
            label: 'Delete Selected',
            action: handleBulkDelete,
            icon: null
        },
        {
            label: 'Archive Selected',
            action: handleBulkArchive,
            icon: null
        }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Loan Packages" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between">
                    <h1 className="text-2xl font-semibold">Loan Packages</h1>
                    <Button
                        onClick={() => router.visit(route('loan-packages.create'))}
                        className="cursor-pointer"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Package
                    </Button>
                </div>
                <Table
                    columns={columns}
                    data={loanPackages.data}
                    searchPlaceholder="Search loan packages..."
                    searchColumns={['name', 'code', 'description']}
                    bulkActions={bulkActions}
                    onBulkDelete={handleBulkDelete}
                    onBulkArchive={handleBulkArchive}
                    pagination={{
                        current_page: loanPackages.current_page,
                        last_page: loanPackages.last_page,
                        per_page: loanPackages.per_page,
                        total: loanPackages.total
                    }}
                    onPageChange={(page) => {
                        router.get(route('loan-packages.index'), { page }, {
                            preserveState: true,
                            preserveScroll: true,
                            replace: true
                        });
                    }}
                    onSortChange={(sort, direction) => {
                        router.get(route('loan-packages.index'), { sort, direction }, {
                            preserveState: true,
                            preserveScroll: true,
                            replace: true
                        });
                    }}
                    onSearchChange={(search) => {
                        const params = search ? { search } : {};
                        router.get(route('loan-packages.index'), params, {
                            preserveState: true,
                            preserveScroll: true,
                            replace: true
                        });
                    }}
                    onPerPageChange={(perPage) => {
                        router.get(route('loan-packages.index'), { per_page: perPage }, {
                            preserveState: true,
                            preserveScroll: true,
                            replace: true
                        });
                    }}
                />
            </div>
        </AppLayout>
    );
}
