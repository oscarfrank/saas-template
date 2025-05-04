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
import { Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tickets',
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
        priority?: string;
        category?: string;
    };
}

export default function Index({ tickets, filters }: Props) {
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [key, setKey] = useState(0);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [selectedTickets, setSelectedTickets] = useState<any[]>([]);

    const handlePageChange = (page: number) => {
        setIsLoading(true);
        setError(null);
        const params = new URLSearchParams(window.location.search);
        params.set('page', page.toString());
        
        router.get(route('admin.tickets.index') + '?' + params.toString(), {}, { 
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
        router.get(route('admin.tickets.index'), { sort, direction }, { 
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
            router.get(route('admin.tickets.index'), { search }, { 
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
            router.get(route('admin.tickets.index'), {}, { 
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
        router.get(route('admin.tickets.index'), { per_page: perPage }, { 
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

    const handleBulkDelete = useCallback(async (tickets: any[]) => {
        setSelectedTickets(tickets);
        setIsBulkDeleteDialogOpen(true);
    }, []);

    const handleBulkDeleteConfirm = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            for (const ticket of selectedTickets) {
                await router.delete(route('tickets.destroy', ticket.id), {
                    preserveState: true,
                    preserveScroll: true,
                });
            }
            
            toast.success('Selected tickets deleted successfully');
            
            setKey(prev => prev + 1);
            
            router.reload({
                only: ['tickets', 'filters'],
                onSuccess: () => {
                    setIsLoading(false);
                    setIsBulkDeleteDialogOpen(false);
                    setSelectedTickets([]);
                },
                onError: (errors) => {
                    setIsLoading(false);
                    setError('Failed to refresh data after deletion');
                }
            });
        } catch (error) {
            toast.error('Failed to delete some tickets');
            setIsLoading(false);
        }
    }, [selectedTickets]);

    const handleDelete = useCallback(async () => {
        if (!selectedTicket) return;

        setIsLoading(true);
        router.delete(route('tickets.destroy', selectedTicket.id), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Ticket deleted successfully');
                setIsDeleteDialogOpen(false);
                setSelectedTicket(null);
                setKey(prev => prev + 1);
                router.reload({
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

    const handleDialogClose = useCallback(() => {
        setIsDeleteDialogOpen(false);
        setSelectedTicket(null);
    }, []);

    const columns = createColumns({
        onDelete: handleDeleteClick
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tickets Management" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                    </div>
                </div>
                <Table
                    key={key}
                    columns={columns}
                    data={tickets.data}
                    searchPlaceholder="Search tickets..."
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
                    onBulkDelete={handleBulkDelete}
                    resetSelection={true}
                />

                <CustomAlertDialog
                    isOpen={isDeleteDialogOpen}
                    onClose={() => setIsDeleteDialogOpen(false)}
                    onConfirm={handleDelete}
                    title="Are you sure?"
                    description={`This action cannot be undone. This will permanently delete the ticket "${selectedTicket?.subject}".`}
                    isLoading={isLoading}
                />

                <CustomAlertDialog
                    isOpen={isBulkDeleteDialogOpen}
                    onClose={() => {
                        setIsBulkDeleteDialogOpen(false);
                        setSelectedTickets([]);
                    }}
                    onConfirm={handleBulkDeleteConfirm}
                    title="Are you sure?"
                    description={`This action cannot be undone. This will permanently delete ${selectedTickets.length} selected ticket(s).`}
                    confirmText="Delete Selected"
                    isLoading={isLoading}
                />
            </div>
        </AppLayout>
    );
}
