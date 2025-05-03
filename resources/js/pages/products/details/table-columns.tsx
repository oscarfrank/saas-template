import { ColumnDef } from "@tanstack/react-table";
import { formatCurrency } from "@/lib/utils";
import { DropdownMenu, 
        DropdownMenuContent, 
        DropdownMenuLabel, 
        DropdownMenuSeparator, 
        DropdownMenuTrigger,
        DropdownMenuItem
        } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

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
          const product = row.original
     
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
                  onClick={() => navigator.clipboard.writeText(String(product.id))}
                >
                  Copy product ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>View customer</DropdownMenuItem>
                <DropdownMenuItem>View product details</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
];
