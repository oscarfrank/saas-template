import { type ColumnDef } from '@tanstack/react-table';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Eye, MoreHorizontal, FileText, MessageSquare } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from "@/lib/utils";
import { type Loan } from './table-columns';
import { useTenantRouter } from '@/hooks/use-tenant-router';

interface TableColumnsProps {
    onDelete: (id: number) => void;
}

const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
        pending: 'bg-yellow-500',
        approved: 'bg-blue-500',
        rejected: 'bg-red-500',
        active: 'bg-green-500',
        in_arrears: 'bg-orange-500',
        defaulted: 'bg-red-600',
        paid: 'bg-green-600',
        cancelled: 'bg-red-400'
    };
    return colors[status] || 'bg-gray-500';
};

export const createUserColumns = ({ onDelete }: TableColumnsProps): ColumnDef<Loan>[] => [
    {
        id: "reference_number",
        accessorKey: "reference_number",
        header: "Reference",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const loan = row.original;
            const tenantRouter = useTenantRouter();
            return (
                <Link 
                    href={tenantRouter.route('user-loans.show', { loan: loan.id })}
                    className="font-medium hover:underline cursor-pointer"
                >
                    {row.getValue("reference_number")}
                </Link>
            );
        },
    },
    {
        id: "amount",
        accessorKey: "amount",
        header: "Amount",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"));
            const currency = row.original.currency.code;
            return <div className="font-medium">{formatCurrency(amount, currency)}</div>;
        },
    },
    {
        id: "status",
        accessorKey: "status",
        header: "Status",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
                <Badge className={`${getStatusColor(status)} text-white`}>
                    {status.replace('_', ' ').toUpperCase()}
                </Badge>
            );
        },
    },
    {
        id: "interest_rate",
        accessorKey: "interest_rate",
        header: "Interest Rate",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const rate = parseFloat(row.getValue("interest_rate"));
            return <div>{rate.toFixed(2)}%</div>;
        },
    },
    {
        id: "duration_days",
        accessorKey: "duration_days",
        header: "Duration",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const days = row.getValue("duration_days") as number;
            return <div>{days} days</div>;
        },
    },
    {
        id: "start_date",
        accessorKey: "start_date",
        header: "Start Date",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const date = row.getValue("start_date");
            return <div>{date ? new Date(date as string).toLocaleDateString() : 'N/A'}</div>;
        },
    },
    {
        id: "end_date",
        accessorKey: "end_date",
        header: "End Date",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const date = row.getValue("end_date");
            return <div>{date ? new Date(date as string).toLocaleDateString() : 'N/A'}</div>;
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const loan = row.original;
            const tenantRouter = useTenantRouter();

            return (
                <div className="flex items-center gap-2">
                    <Link href={tenantRouter.route('user-loans.show', { loan: loan.id })}>
                        <Button variant="outline" size="icon" className="cursor-pointer">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="cursor-pointer">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href={tenantRouter.route('user-loans.show', { loan: loan.id })}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Link>
                            </DropdownMenuItem>
                            {loan.status === 'pending' && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => onDelete(loan.id)}
                                    >
                                        Cancel Application
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    },
]; 