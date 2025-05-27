import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { router } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge";

// Utility function to format price with currency
const formatPrice = (price: number, currency: any) => {
    if (!currency) return price.toString();

    const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: currency.decimal_places || 2,
        maximumFractionDigits: currency.decimal_places || 2,
    }).format(price);

    return currency.symbol_position === 'before'
        ? `${currency.symbol}${formatted}`
        : `${formatted}${currency.symbol}`;
};

export const createColumns = (): ColumnDef<any>[] => [
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
    {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => {
            const plan = row.original;
            return formatPrice(plan.price, plan.currency);
        },
    },
    {
        accessorKey: "billing_period",
        header: "Billing Period",
        cell: ({ row }) => {
            const period = row.getValue("billing_period") as string;
            return (
                <Badge variant="outline">
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                </Badge>
            );
        },
    },
    {
        accessorKey: "is_featured",
        header: "Featured",
        cell: ({ row }) => {
            const isFeatured = row.getValue("is_featured") as boolean;
            return isFeatured ? (
                <Badge variant="default">Featured</Badge>
            ) : null;
        },
    },
    {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => {
            const isActive = row.getValue("is_active") as boolean;
            return (
                <Badge variant={isActive ? "default" : "destructive"}>
                    {isActive ? "Active" : "Inactive"}
                </Badge>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const plan = row.original;

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
                        <DropdownMenuItem
                            onClick={() => router.visit(route('subscription-plans.edit', plan.id))}
                        >
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => router.post(route('subscription-plans.toggle-active', plan.id))}
                        >
                            {plan.is_active ? 'Disable' : 'Enable'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                                if (confirm('Are you sure you want to delete this subscription plan?')) {
                                    router.delete(route('subscription-plans.destroy', plan.id));
                                }
                            }}
                        >
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
]; 