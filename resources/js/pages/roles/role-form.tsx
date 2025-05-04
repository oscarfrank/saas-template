import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { type Permission } from '@/types';
import { useState, useEffect } from 'react';

interface RoleFormProps {
    role?: {
        id: number;
        name: string;
        permissions: Permission[];
    };
    permissions: Permission[];
    onSubmit: (data: { name: string; permissions: number[] }) => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RoleForm({ role, permissions, onSubmit, isOpen, onOpenChange }: RoleFormProps) {
    const [name, setName] = useState(role?.name ?? '');
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>(
        role?.permissions.map((p) => p.id) ?? []
    );

    // Reset form state when role changes
    useEffect(() => {
        setName(role?.name ?? '');
        setSelectedPermissions(role?.permissions.map((p) => p.id) ?? []);
    }, [role]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            permissions: selectedPermissions,
        });
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>{role ? 'Edit Role' : 'Create Role'}</SheetTitle>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Role Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter role name"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Permissions</Label>
                        <div className="grid gap-2">
                            {permissions.map((permission) => (
                                <div key={permission.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`permission-${permission.id}`}
                                        checked={selectedPermissions.includes(permission.id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedPermissions([...selectedPermissions, permission.id]);
                                            } else {
                                                setSelectedPermissions(
                                                    selectedPermissions.filter((id) => id !== permission.id)
                                                );
                                            }
                                        }}
                                    />
                                    <Label htmlFor={`permission-${permission.id}`}>{permission.name}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Button type="submit">{role ? 'Update Role' : 'Create Role'}</Button>
                </form>
            </SheetContent>
        </Sheet>
    );
} 