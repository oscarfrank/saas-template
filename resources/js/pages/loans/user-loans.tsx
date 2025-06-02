import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Table } from './components/table';
import { createUserColumns } from './components/user-table-columns';
import { type Loan } from './components/table-columns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';
import { formatCurrency } from "@/lib/utils";
import { PageProps } from '@/types';
import { useTenantRouter } from '@/hooks/use-tenant-router';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'My Loans',
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

export default function UserLoans({ loans }: Props) {
    const tenantRouter = useTenantRouter();
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [key, setKey] = useState(0);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

    const handlePageChange = (page: number) => {
        setIsLoading(true);
        setError(null);
        const params = new URLSearchParams(window.location.search);
        params.set('page', page.toString());
        
        tenantRouter.get('user-loans', { page: page.toString() }, { 
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
        tenantRouter.get('user-loans', { sort, direction }, { 
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
        
        if (search.trim()) {
            tenantRouter.get('user-loans', { search }, { 
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
            tenantRouter.get('user-loans', {}, { 
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
        tenantRouter.get('user-loans', { per_page: perPage }, { 
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

    const handleDelete = useCallback(async () => {
        if (!selectedLoan) return;

        setIsLoading(true);
        tenantRouter.delete('loans.destroy', { loan: selectedLoan.id }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Loan application cancelled successfully');
                setIsDeleteDialogOpen(false);
                setSelectedLoan(null);
                setKey(prev => prev + 1);
                tenantRouter.reload({
                    only: ['loans'],
                    onSuccess: () => {
                        setIsLoading(false);
                    },
                    onError: () => {
                        setIsLoading(false);
                        toast.error('Failed to refresh data after cancellation');
                    }
                });
            },
            onError: () => {
                toast.error('Failed to cancel loan application');
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

    const columns = createUserColumns({
        onDelete: handleDeleteClick
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Loans" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                    </div>
                    <Link href={tenantRouter.route('loan-packages.browse')}>
                        <Button className="cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" />
                            Apply for Loan
                        </Button>
                    </Link>
                </div>
                <Table
                    key={key}
                    columns={columns}
                    data={loans.data}
                    searchPlaceholder="Search my loans..."
                    searchColumns={['reference_number', 'status']}
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
                />

                <CustomAlertDialog
                    isOpen={isDeleteDialogOpen}
                    onClose={() => setIsDeleteDialogOpen(false)}
                    onConfirm={handleDelete}
                    title="Cancel Loan Application?"
                    description={`Are you sure you want to cancel your loan application "${selectedLoan?.reference_number}"? This action cannot be undone.`}
                    isLoading={isLoading}
                />
            </div>
        </AppLayout>
    );
} 