import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { RoleForm } from './role-form';
import { RoleTable } from './role-table';
import { type Permission, type Role } from '@/types';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin',
    },
    {
        title: 'Roles and Permissions',
        href: '/admin/roles',
    },
];

interface Props {
    roles: Role[];
    permissions: Permission[];
}

export default function Roles({ roles, permissions }: Props) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | undefined>();

    const handleCreate = (data: { name: string; permissions: number[] }) => {
        router.post(route('roles.store'), data, {
            onSuccess: () => {
                setIsFormOpen(false);
                toast.success('Role created successfully');
            },
            onError: (errors) => {
                toast.error('Failed to create role');
            },
        });
    };

    const handleUpdate = (data: { name: string; permissions: number[] }) => {
        if (!selectedRole) return;

        router.put(route('roles.update', selectedRole.id), data, {
            onSuccess: () => {
                setIsFormOpen(false);
                setSelectedRole(undefined);
                toast.success('Role updated successfully');
            },
            onError: (errors) => {
                toast.error('Failed to update role');
            },
        });
    };

    const handleDelete = (role: Role) => {
        router.delete(route('roles.destroy', role.id), {
            onSuccess: () => {
                toast.success('Role deleted successfully');
            },
            onError: () => {
                toast.error('Failed to delete role');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Roles</h1>
                    <Button
                        onClick={() => {
                            setSelectedRole(undefined);
                            setIsFormOpen(true);
                        }}
                    >
                        Create Role
                    </Button>
                </div>
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative flex-1 overflow-hidden rounded-xl border">
                    <RoleTable
                        roles={roles}
                        onEdit={(role) => {
                            setSelectedRole(role);
                            setIsFormOpen(true);
                        }}
                        onDelete={handleDelete}
                    />
                </div>
            </div>

            <RoleForm
                role={selectedRole}
                permissions={permissions}
                onSubmit={selectedRole ? handleUpdate : handleCreate}
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
            />
        </AppLayout>
    );
}
