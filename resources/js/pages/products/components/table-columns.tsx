import { type ColumnDef } from '@tanstack/react-table';
import { Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Eye, MoreHorizontal, Pencil, Trash2, Copy, Share2, Download } from 'lucide-react';
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

export type Product = {
    id: number;
    name: string;
    description: string;
    price: number;
    featured_image: string | null;
    featured_image_original_name: string | null;
    created_at: string;
    updated_at: string;
};

interface TableColumnsProps {
    onDelete: (product: Product) => void;
}

export const createColumns = ({ onDelete }: TableColumnsProps): ColumnDef<Product>[] => [
    {
        id: "name",
        accessorKey: "name",
        header: "Name",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            return <div className="font-medium">{row.getValue("name")}</div>;
        },
    },
    {
        id: "description",
        accessorKey: "description",
        header: "Description",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            return <div className="max-w-[300px] truncate">{row.getValue("description")}</div>;
        },
    },
    {
        id: "price",
        accessorKey: "price",
        header: "Price",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            const price = parseFloat(row.getValue("price"));
            return <div className="font-medium">{formatCurrency(price)}</div>;
        },
    },
    {
        id: "featured_image",
        accessorKey: "featured_image",
        header: "Image",
        enableSorting: false,
        enableHiding: true,
        cell: ({ row }) => {
            const image = row.getValue("featured_image") as string | null;
            const originalName = row.original.featured_image_original_name;
            
            if (!image) return <div className="text-muted-foreground">No image</div>;
            
            return (
                <div className="relative h-10 w-10">
                    <img
                        src={image}
                        alt={originalName || "Product image"}
                        className="h-full w-full rounded-md object-cover"
                    />
                </div>
            );
        },
    },
    {
        id: "created_at",
        accessorKey: "created_at",
        header: "Created At",
        enableSorting: true,
        enableHiding: true,
        cell: ({ row }) => {
            return <div>{new Date(row.getValue("created_at")).toLocaleDateString()}</div>;
        },
    },


// Adding Actions Columns

    {
        id: "actions",
        cell: ({ row }) => {
            const product = row.original;
            const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
            const [isDeleting, setIsDeleting] = useState(false);

            const handleCopyId = () => {
                navigator.clipboard.writeText(String(product.id));
                toast.success('Product ID copied to clipboard');
            };

            const handleShare = () => {
                const url = route('products.show', product.id);
                navigator.clipboard.writeText(url);
                toast.success('Product URL copied to clipboard');
            };

            const handleDelete = () => {
                setIsDeleting(true);
                router.delete(route('products.destroy', product.id), {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        toast.success('Product deleted successfully');
                        setIsDeleteDialogOpen(false);
                        // Force a complete table reset
                        router.reload({
                            only: ['products', 'pagination'],
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
                        toast.error('Failed to delete product');
                        setIsDeleting(false);
                    }
                });
            };

            return (
                <div className="flex items-center gap-2">
                    <Link href={route('products.show', product.id)}>
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
                                <Link href={route('products.edit', product.id)} className="cursor-pointer">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Product
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleCopyId} className="cursor-pointer">
                                <Copy className="mr-2 h-4 w-4" />
                                Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                                <Share2 className="mr-2 h-4 w-4" />
                                Share Product
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Product
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <CustomAlertDialog
                        isOpen={isDeleteDialogOpen}
                        onClose={() => setIsDeleteDialogOpen(false)}
                        onConfirm={handleDelete}
                        title="Are you sure?"
                        description={`This action cannot be undone. This will permanently delete the product "${product.name}".`}
                        isLoading={isDeleting}
                    />
                </div>
            );
        },
    },
];
