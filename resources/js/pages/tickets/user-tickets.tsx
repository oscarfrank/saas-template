import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Table } from './components/table';
import { createColumns } from './components/user-table-columns';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';
import { useTenantRouter } from '@/hooks/use-tenant-router';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'My Tickets',
        href: '/tickets',
    },
];

interface Props {
    tickets: {
        data: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function UserTickets({ tickets, filters }: Props) {
    const tenantRouter = useTenantRouter();
    const { tenant } = usePage().props;

    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [key, setKey] = useState(0);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

    const handlePageChange = (page: number) => {
        setIsLoading(true);
        setError(null);
        const params = new URLSearchParams(window.location.search);
        params.set('page', page.toString());
        
        tenantRouter.get('tickets.user', {}, { 
            preserveState: true,
            preserveScroll: true,
            only: ['tickets', 'filters'],
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
        tenantRouter.get('tickets.user', { sort, direction }, { 
            preserveState: true,
            preserveScroll: true,
            only: ['tickets', 'filters'],
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
            tenantRouter.get('tickets.user', { search }, { 
                preserveState: true,
                preserveScroll: true,
                only: ['tickets', 'filters'],
                onSuccess: () => {
                    setIsLoading(false);
                },
                onError: (errors) => {
                    setIsLoading(false);
                    setError('Failed to load data. Please try again.');
                }
            });
        } else {
            tenantRouter.get('tickets.user', {}, { 
                preserveState: true,
                preserveScroll: true,
                only: ['tickets', 'filters'],
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
        tenantRouter.get('tickets.user', { per_page: perPage }, { 
            preserveState: true,
            preserveScroll: true,
            only: ['tickets', 'filters'],
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
        if (!selectedTicket) return;

        setIsLoading(true);
        tenantRouter.delete('tickets.destroy', { ticket: selectedTicket.id }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Ticket deleted successfully');
                setIsDeleteDialogOpen(false);
                setSelectedTicket(null);
                setKey(prev => prev + 1);
                tenantRouter.reload({
                    only: ['tickets', 'filters'],
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
                toast.error('Failed to delete ticket');
                setIsLoading(false);
            }
        });
    }, [selectedTicket]);

    const handleDeleteClick = useCallback((ticket: any) => {
        setSelectedTicket(ticket);
        setIsDeleteDialogOpen(true);
    }, []);

    const columns = createColumns({
        onDelete: handleDeleteClick,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Tickets" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                    </div>
                    <Link href={tenantRouter.route('tickets.create')}>
                        <Button className="cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Ticket
                        </Button>
                    </Link>
                </div>
                <Table
                    key={key}
                    columns={columns}
                    data={tickets.data}
                    searchPlaceholder="Search my tickets..."
                    searchColumns={["subject", "description"]}
                    pagination={{
                        current_page: tickets.current_page,
                        last_page: tickets.last_page,
                        per_page: tickets.per_page,
                        total: tickets.total,
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
                    title="Are you sure?"
                    description={`This action cannot be undone. This will permanently delete the ticket "${selectedTicket?.subject}".`}
                    isLoading={isLoading}
                />
            </div>
        </AppLayout>
    );
} 