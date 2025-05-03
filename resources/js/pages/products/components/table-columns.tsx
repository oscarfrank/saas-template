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

export const columns: ColumnDef<Product>[] = [
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
                if (confirm('Are you sure you want to delete this product?')) {
                    router.delete(route('products.destroy', product.id), {
                        onSuccess: () => {
                            toast.success('Product deleted successfully');
                        },
                        onError: () => {
                            toast.error('Failed to delete product');
                        },
                    });
                }
            };

            return (
                <div className="flex items-center gap-2">
                    <Link href={route('products.show', product.id)}>
                        <Button variant="outline" size="icon">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={route('products.edit', product.id)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Product
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleCopyId}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleShare}>
                                <Share2 className="mr-2 h-4 w-4" />
                                Share Product
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Product
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    },
];
