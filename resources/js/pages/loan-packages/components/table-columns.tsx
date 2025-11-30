import { type ColumnDef } from '@tanstack/react-table';
import { Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Eye, MoreHorizontal, Pencil, Trash2, Copy, Share2, Download, Power } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { formatCurrency } from "@/lib/utils";
import { useState } from 'react';
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';

export type LoanPackage = {
    id: number;
    name: string;
    code: string;
    description: string | null;
    user_type: 'borrower' | 'lender';
    min_amount: number;
    max_amount: number;
    currency_id: number;
    min_duration_days: number;
    max_duration_days: number;
    has_fixed_duration: boolean;
    fixed_duration_days: number | null;
    interest_rate: number;
    interest_type: 'simple' | 'compound';
    interest_calculation: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interest_payment_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'end_of_term';
    origination_fee_fixed: number;
    origination_fee_percentage: number;
    late_payment_fee_fixed: number;
    late_payment_fee_percentage: number;
    grace_period_days: number;
    allows_early_repayment: boolean;
    early_repayment_fee_percentage: number;
    requires_collateral: boolean;
    collateral_percentage: number | null;
    collateral_requirements: string | null;
    min_credit_score: number | null;
    min_income: number | null;
    min_kyc_level: number;
    eligible_countries: string[] | null;
    risk_level: 'low' | 'medium' | 'high';
    is_active: boolean;
    available_from: string | null;
    available_until: string | null;
    available_quantity: number | null;
    remaining_quantity: number | null;
    icon: string | null;
    color_code: string | null;
    display_order: number;
    is_featured: boolean;
    terms_document: string | null;
    contract_template: string | null;
    created_at: string;
    updated_at: string;
};

interface TableColumnsProps {
    onDelete: (loanPackage: LoanPackage) => void;
}

export const createColumns = ({ onDelete }: TableColumnsProps): ColumnDef<LoanPackage>[] => [
    {
        id: "name",
        accessorKey: "name",
        header: "Name",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const loanPackage = row.original;
            return (
                <Link 
                    href={route('admin.loan-packages.show', { loanPackage: loanPackage.id })}
                    className="font-medium hover:underline cursor-pointer"
                >
                    {row.getValue("name")}
                </Link>
            );
        },
    },
    {
        id: "code",
        accessorKey: "code",
        header: "Code",
        enableSorting: true,
        enableHiding: true,
    },
    {
        id: "amount_range",
        header: "Amount Range",
        enableSorting: false,
        enableHiding: true,
        cell: ({ row }) => {
            const minAmount = row.original.min_amount;
            const maxAmount = row.original.max_amount;
            return (
                <div>
                    {formatCurrency(minAmount)} - {formatCurrency(maxAmount)}
                </div>
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
            return <div>{rate}%</div>;
        },
    },
    {
        id: "risk_level",
        accessorKey: "risk_level",
        header: "Risk Level",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const riskLevel = row.getValue("risk_level") as string;
            return <div className="capitalize">{riskLevel}</div>;
        },
    },
    {
        id: "is_active",
        accessorKey: "is_active",
        header: "Status",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const isActive = row.getValue("is_active");
            return (
                <div className={`capitalize ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {isActive ? 'Active' : 'Inactive'}
                </div>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const loanPackage = row.original;
            const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
            const [isDeleting, setIsDeleting] = useState(false);
            const [isToggling, setIsToggling] = useState(false);

            const handleCopyId = () => {
                navigator.clipboard.writeText(String(loanPackage.id));
                toast.success('Loan Package ID copied to clipboard');
            };

            const handleShare = () => {
                const url = route('admin.loan-packages.show', loanPackage.id);
                navigator.clipboard.writeText(url);
                toast.success('Loan Package URL copied to clipboard');
            };

            const handleToggleStatus = () => {
                setIsToggling(true);
                router.put(route('loan-packages.update-status', loanPackage.id), {
                    is_active: !loanPackage.is_active
                }, {
                    preserveState: true,
                    preserveScroll: true,
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    onSuccess: (response) => {
                        toast.success(`Loan Package ${loanPackage.is_active ? 'deactivated' : 'activated'} successfully`);
                        loanPackage.is_active = !loanPackage.is_active;
                        setIsToggling(false);
                    },
                    onError: () => {
                        toast.error('Failed to update loan package status');
                        setIsToggling(false);
                    }
                });
            };

            const handleDelete = () => {
                setIsDeleting(true);
                router.delete(route('admin.loan-packages.destroy', loanPackage.id), {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Loan Package deleted successfully');
                        setIsDeleteDialogOpen(false);
                        router.reload({
                            only: ['loanPackages', 'pagination'],
                            onSuccess: () => {
                                setIsDeleting(false);
                            },
                            onError: () => {
                                setIsDeleting(false);
                                toast.error('Failed to refresh data after deletion');
                            }
                        });
                    },
                    onError: () => {
                        toast.error('Failed to delete loan package');
                        setIsDeleting(false);
                    }
                });
            };

            return (
                <div className="flex items-center gap-2">
                    <Link href={route('admin.loan-packages.show', loanPackage.id)}>
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
                            <DropdownMenuItem asChild>
                                <Link href={route('admin.loan-packages.edit', loanPackage.id)} className="cursor-pointer">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Package
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleToggleStatus} className="cursor-pointer" disabled={isToggling}>
                                <Power className="mr-2 h-4 w-4" />
                                {loanPackage.is_active ? 'Deactivate Package' : 'Activate Package'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleCopyId} className="cursor-pointer">
                                <Copy className="mr-2 h-4 w-4" />
                                Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                                <Share2 className="mr-2 h-4 w-4" />
                                Share Package
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Package
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <CustomAlertDialog
                        isOpen={isDeleteDialogOpen}
                        onClose={() => setIsDeleteDialogOpen(false)}
                        onConfirm={handleDelete}
                        title="Are you sure?"
                        description={`This action cannot be undone. This will permanently delete the loan package "${loanPackage.name}".`}
                        isLoading={isDeleting}
                    />
                </div>
            );
        },
    },
];
