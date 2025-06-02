import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@inertiajs/react";
import { formatDate } from "@/lib/utils";

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
}

interface TableColumnProps {
    onDelete: (tenant: Tenant) => void;
}

export const createColumns = ({ onDelete }: TableColumnProps): ColumnDef<Tenant>[] => [
    {
        id: "name",
        accessorKey: "name",
        header: "Name",
    },
    {
        id: "slug",
        accessorKey: "slug",
        header: "Slug",
    },
    {
        id: "created_at",
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const tenant = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href={route('tenants.edit', tenant.id)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => onDelete(tenant)}
                        >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
]; 