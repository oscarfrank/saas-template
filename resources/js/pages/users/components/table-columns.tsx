import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';

export type User = {
    id: number;
    name: string;
    email: string;
    created_at: string;
    roles: Array<{
        name: string;
    }>;
};

export const createColumns = (options?: {
    onDelete?: (user: User) => void;
}): ColumnDef<User>[] => [
    {
        accessorKey: 'name',
        header: 'Name',
    },
    {
        accessorKey: 'email',
        header: 'Email',
    },
    {
        accessorKey: 'roles',
        header: 'Role',
        cell: ({ row }) => {
            const roles = row.original.roles;
            return (
                <div className="flex gap-1">
                    {roles.map((role) => (
                        <Badge key={role.name} variant="secondary">
                            {role.name}
                        </Badge>
                    ))}
                </div>
            );
        },
    },
    {
        accessorKey: 'created_at',
        header: 'Created At',
        cell: ({ row }) => {
            return format(new Date(row.original.created_at), 'PPP');
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            return (
                <div className="flex gap-2">
                    <Link href={route('admin.users.show', row.original.id)}>
                        <Button variant="outline" size="sm">
                            View
                        </Button>
                    </Link>
                    <Link href={route('admin.users.edit', row.original.id)}>
                        <Button variant="outline" size="sm">
                            Edit
                        </Button>
                    </Link>
                    {options?.onDelete && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => options.onDelete?.(row.original)}
                        >
                            Delete
                        </Button>
                    )}
                </div>
            );
        },
    },
];
