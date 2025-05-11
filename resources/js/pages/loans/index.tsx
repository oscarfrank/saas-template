import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Table } from './components/table';
import { createColumns } from './components/table-columns';
import { type Loan } from './components/table-columns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';
import { formatCurrency } from "@/lib/utils";
import { PageProps } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Loans',
        href: '/loans',
    },
];

interface Props extends PageProps {
    loans: {
        data: Loan[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function Index({ loans }: Props) {
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [key, setKey] = useState(0);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [selectedLoans, setSelectedLoans] = useState<Loan[]>([]);

    const handlePageChange = (page: number) => {
        setIsLoading(true);
        setError(null);
        const params = new URLSearchParams(window.location.search);
        params.set('page', page.toString());
        
        router.get(route('loans.index') + '?' + params.toString(), {}, { 
            preserveState: true,
            preserveScroll: true,
            only: ['loans'],
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
        router.get(route('loans.index'), { sort, direction }, { 
            preserveState: true,
            preserveScroll: true,
            only: ['loans'],
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
            router.get(route('loans.index'), { search }, { 
                preserveState: true,
                preserveScroll: true,
                only: ['loans'],
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
            router.get(route('loans.index'), {}, { 
                preserveState: true,
                preserveScroll: true,
                only: ['loans'],
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
        router.get(route('loans.index'), { per_page: perPage }, { 
            preserveState: true,
            preserveScroll: true,
            only: ['loans'],
            onSuccess: () => {
                setIsLoading(false);
            },
            onError: (errors) => {
                setIsLoading(false);
                setError('Failed to load data. Please try again.');
            }
        });
    };

    const handleBulkDelete = useCallback(async (loans: Loan[]) => {
        setSelectedLoans(loans);
        setIsBulkDeleteDialogOpen(true);
    }, []);

    const handleBulkDeleteConfirm = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            await router.post(route('loans.bulk-delete'), {
                ids: selectedLoans.map(loan => loan.id)
            }, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Selected loans deleted successfully');
                    setIsBulkDeleteDialogOpen(false);
                    setSelectedLoans([]);
                    // Force a complete table reset
                    setKey(prev => prev + 1);
                    // Reload the data
                    router.reload({
                        only: ['loans'],
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
                    toast.error('Failed to delete selected loans');
                    setIsLoading(false);
                }
            });
        } catch (error) {
            toast.error('Failed to delete some loans');
            setIsLoading(false);
        }
    }, [selectedLoans]);

    const handleDelete = useCallback(async () => {
        if (!selectedLoan) return;

        setIsLoading(true);
        router.delete(route('loans.destroy', selectedLoan.id), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Loan deleted successfully');
                setIsDeleteDialogOpen(false);
                setSelectedLoan(null);
                // Force a complete table reset
                setKey(prev => prev + 1);
                // Reload the data
                router.reload({
                    only: ['loans'],
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
                toast.error('Failed to delete loan');
                setIsLoading(false);
            }
        });
    }, [selectedLoan]);

    const handleDeleteClick = useCallback((id: number) => {
        const loan = loans.data.find(l => l.id === id);
        if (loan) {
            setSelectedLoan(loan);
            setIsDeleteDialogOpen(true);
        }
    }, [loans.data]);

    const handleDialogClose = useCallback(() => {
        setIsDeleteDialogOpen(false);
        setSelectedLoan(null);
    }, []);

    const columns = createColumns({
        onDelete: handleDeleteClick
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Loans Management" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                    </div>
                    <Link href={route('loans.create')}>
                        <Button className="cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Loan
                        </Button>
                    </Link>
                </div>
                <Table
                    key={key}
                    columns={columns}
                    data={loans.data}
                    searchPlaceholder="Search loans..."
                    searchColumns={['reference_number', 'user.name', 'status']}
                    pagination={{
                        current_page: loans.current_page,
                        last_page: loans.last_page,
                        per_page: loans.per_page,
                        total: loans.total,
                    }}
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
                    description={`This action cannot be undone. This will permanently delete the loan "${selectedLoan?.reference_number}".`}
                    isLoading={isLoading}
                />

                <CustomAlertDialog
                    isOpen={isBulkDeleteDialogOpen}
                    onClose={() => {
                        setIsBulkDeleteDialogOpen(false);
                        setSelectedLoans([]);
                    }}
                    onConfirm={handleBulkDeleteConfirm}
                    title="Are you sure?"
                    description={`This action cannot be undone. This will permanently delete ${selectedLoans.length} selected loan(s).`}
                    confirmText="Delete Selected"
                    isLoading={isLoading}
                />
            </div>
        </AppLayout>
    );
}
