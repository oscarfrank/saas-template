import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { type Role } from '@/types';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface RoleTableProps {
    roles: Role[];
    onEdit: (role: Role) => void;
    onDelete: (role: Role) => void;
}

export function RoleTable({ roles, onEdit, onDelete }: RoleTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {roles.map((role) => (
                    <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>
                            <div className="flex flex-wrap gap-1">
                                {role.permissions.map((permission) => (
                                    <Badge key={permission.id} variant="secondary">
                                        {permission.name}
                                    </Badge>
                                ))}
                            </div>
                        </TableCell>
                        <TableCell>{new Date(role.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => onEdit(role)}>
                                    Edit
                                </Button>
                                {role.name !== 'super-admin' && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                                Delete
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Role</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to delete the role{' '}
                                                    <span className="font-semibold text-destructive">
                                                        {role.name}
                                                    </span>
                                                    ? This action cannot be undone and will remove this role from all users.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDelete(role)}>
                                                    Delete Role
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
} 