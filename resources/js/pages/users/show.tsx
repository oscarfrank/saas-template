import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin',
    },
    {
        title: 'Users',
        href: '/admin/users',
    },
    {
        title: 'User Details',
        href: '/admin/users/show',
    },
];

type User = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    created_at: string;
    updated_at: string;
    roles: Array<{
        name: string;
    }>;
};

export default function Show({ user }: { user: User }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Details" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between">
                    <h1 className="text-2xl font-semibold">User Details</h1>
                    <div className="flex gap-2">
                        <Link href={route('admin.users.edit', user.id)}>
                            <Button>Edit User</Button>
                        </Link>
                        <Link href={route('admin.users.index')}>
                            <Button variant="outline">Back to Users</Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-4 rounded-lg border p-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">First Name</h3>
                            <p className="mt-1">{user.first_name}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Last Name</h3>
                            <p className="mt-1">{user.last_name}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Email</h3>
                            <p className="mt-1">{user.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                            <p className="mt-1">{format(new Date(user.created_at), 'PPP')}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                            <p className="mt-1">{format(new Date(user.updated_at), 'PPP')}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Roles</h3>
                        <div className="mt-1 flex gap-1">
                            {user.roles.map((role) => (
                                <Badge key={role.name} variant="secondary">
                                    {role.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
} 