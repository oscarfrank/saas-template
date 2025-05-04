import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Table } from './components/table';
import { createColumns, type Transaction } from './components/table-columns';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Archive } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';
import { formatCurrency } from "@/lib/utils";
import { PageProps } from '@inertiajs/core';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transactions',
        href: '/transactions',
    },
];

interface Props extends PageProps {
    transactions: {
        data: Transaction[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        sort?: string;
        direction?: 'asc' | 'desc';
    };
}

export default function Index({ transactions, filters }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = (selectedRows: Transaction[]) => {
        setIsDeleting(true);
        router.delete(route('transactions.bulk-delete'), {
            data: { ids: selectedRows.map(row => row.id) },
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Transactions deleted successfully');
                setIsDeleting(false);
            },
            onError: () => {
                toast.error('Failed to delete transactions');
                setIsDeleting(false);
            }
        });
    };

    const handleArchive = (selectedRows: Transaction[]) => {
        router.post(route('transactions.bulk-archive'), {
            ids: selectedRows.map(row => row.id)
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Transactions archived successfully');
            },
            onError: () => {
                toast.error('Failed to archive transactions');
            }
        });
    };

    const columns = createColumns({
        onDelete: (transaction) => handleDelete([transaction])
    });

    const bulkActions = [
        {
            label: 'Delete Selected',
            action: handleDelete,
            icon: <Trash2 className="h-4 w-4" />
        },
        {
            label: 'Archive Selected',
            action: handleArchive,
            icon: <Archive className="h-4 w-4" />
        }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transactions" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                    </div>
                    <Link href={route('transactions.create')}>
                        <Button className="cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" />
                            New Transaction
                        </Button>
                    </Link>
                </div>
                <Table
                    columns={columns}
                    data={transactions.data}
                    searchPlaceholder="Search transactions..."
                    searchColumns={['reference_number', 'transaction_type', 'status']}
                    bulkActions={bulkActions}
                    onBulkDelete={handleDelete}
                    onBulkArchive={handleArchive}
                    pagination={{
                        current_page: transactions.current_page,
                        last_page: transactions.last_page,
                        per_page: transactions.per_page,
                        total: transactions.total
                    }}
                    onPageChange={(page) => {
                        router.get(route('transactions.index'), {
                            ...filters,
                            page
                        }, {
                            preserveState: true,
                            preserveScroll: true
                        });
                    }}
                    onSortChange={(sort, direction) => {
                        router.get(route('transactions.index'), {
                            ...filters,
                            sort,
                            direction
                        }, {
                            preserveState: true,
                            preserveScroll: true
                        });
                    }}
                    onSearchChange={(search) => {
                        router.get(route('transactions.index'), {
                            ...filters,
                            search,
                            page: 1
                        }, {
                            preserveState: true,
                            preserveScroll: true
                        });
                    }}
                    onPerPageChange={(perPage) => {
                        router.get(route('transactions.index'), {
                            ...filters,
                            per_page: perPage,
                            page: 1
                        }, {
                            preserveState: true,
                            preserveScroll: true
                        });
                    }}
                    isLoading={isDeleting}
                />
            </div>
        </AppLayout>
    );
}
