import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Table } from './components/table';
import { createColumns } from './components/table-columns';
import { type User } from './components/table-columns';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';
import axios from 'axios';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin',
    },
    {
        title: 'Users',
        href: '/admin/users',
    },
];

interface Props {
    users: User[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function Index({ users, pagination }: Props) {
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [key, setKey] = useState(0);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

    const handlePageChange = (page: number) => {
        setIsLoading(true);
        setError(null);
        const params = new URLSearchParams(window.location.search);
        params.set('page', page.toString());
        
        router.get(route('admin.users.index') + '?' + params.toString(), {}, { 
            preserveState: true,
            preserveScroll: true,
            only: ['users', 'pagination'],
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
        router.get(route('admin.users.index'), { sort, direction }, { 
            preserveState: true,
            preserveScroll: true,
            only: ['users', 'pagination'],
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
            router.get(route('admin.users.index'), { search }, { 
                preserveState: true,
                preserveScroll: true,
                only: ['users', 'pagination'],
                onSuccess: () => {
                    setIsLoading(false);
                },
                onError: (errors) => {
                    setIsLoading(false);
                    setError('Failed to load data. Please try again.');
                }
            });
        } else {
            router.get(route('admin.users.index'), {}, { 
                preserveState: true,
                preserveScroll: true,
                only: ['users', 'pagination'],
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
        router.get(route('admin.users.index'), { per_page: perPage }, { 
            preserveState: true,
            preserveScroll: true,
            only: ['users', 'pagination'],
            onSuccess: () => {
                setIsLoading(false);
            },
            onError: (errors) => {
                setIsLoading(false);
                setError('Failed to load data. Please try again.');
            }
        });
    };

    const handleBulkDelete = useCallback(async (users: User[]) => {
        setSelectedUsers(users);
        setIsBulkDeleteDialogOpen(true);
    }, []);

    const handleBulkDeleteConfirm = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            for (const user of selectedUsers) {
                const response = await axios.delete(route('admin.users.destroy', user.id));
                if (!response.data.success) {
                    throw new Error(response.data.error || 'Failed to delete user');
                }
            }
            
            toast.success('Selected users deleted successfully');
            setKey(prev => prev + 1);
            
            router.reload({
                only: ['users', 'pagination'],
                onSuccess: () => {
                    setIsLoading(false);
                    setIsBulkDeleteDialogOpen(false);
                    setSelectedUsers([]);
                },
                onError: (errors) => {
                    setIsLoading(false);
                    setError('Failed to refresh data after deletion');
                }
            });
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete some users');
            setIsLoading(false);
        }
    }, [selectedUsers]);

    const handleDelete = useCallback(async () => {
        if (!selectedUser) return;

        setIsLoading(true);
        try {
            const response = await axios.delete(route('admin.users.destroy', selectedUser.id));
            
            if (response.data.success) {
                toast.success(response.data.message);
                setIsDeleteDialogOpen(false);
                setSelectedUser(null);
                setKey(prev => prev + 1);
                router.reload({
                    only: ['users', 'pagination'],
                    onSuccess: () => {
                        setIsLoading(false);
                    },
                    onError: () => {
                        setIsLoading(false);
                        toast.error('Failed to refresh data after deletion');
                    }
                });
            } else {
                toast.error(response.data.error || 'Failed to delete user');
                setIsLoading(false);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete user');
            setIsLoading(false);
        }
    }, [selectedUser]);

    const handleDeleteClick = useCallback((user: User) => {
        setSelectedUser(user);
        setIsDeleteDialogOpen(true);
    }, []);

    const columns = createColumns({
        onDelete: handleDeleteClick
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between">
                    <h1 className="text-2xl font-semibold">Users</h1>
                    <Link href={route('admin.users.create')}>
                        <Button>Create User</Button>
                    </Link>
                </div>
                <Table
                    key={key}
                    columns={columns}
                    data={users}
                    searchPlaceholder="Search users..."
                    searchColumns={["name", "email"]}
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
                    description={`This action cannot be undone. This will permanently delete the user "${selectedUser?.name}" and all associated data including:

• All transactions (sent, received, created, processed, adjusted, or reviewed)
• All KYC verifications
• All payment methods
• All loans and borrows
• All notifications
• All custom packages created or approved by this user
• All loan and borrow packages created by this user
• All loan and borrow payments recorded or adjusted by this user`}
                    isLoading={isLoading}
                />

                <CustomAlertDialog
                    isOpen={isBulkDeleteDialogOpen}
                    onClose={() => {
                        setIsBulkDeleteDialogOpen(false);
                        setSelectedUsers([]);
                    }}
                    onConfirm={handleBulkDeleteConfirm}
                    title="Are you sure?"
                    description={`This action cannot be undone. This will permanently delete ${selectedUsers.length} selected user(s) and all their associated data including:

• All transactions (sent, received, created, processed, adjusted, or reviewed)
• All KYC verifications
• All payment methods
• All loans and borrows
• All notifications
• All custom packages created or approved by these users
• All loan and borrow packages created by these users
• All loan and borrow payments recorded or adjusted by these users`}
                    confirmText="Delete Selected"
                    isLoading={isLoading}
                />
            </div>
        </AppLayout>
    );
}
