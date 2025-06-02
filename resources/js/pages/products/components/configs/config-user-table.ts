import { type TableConfig } from '@/components/ui/ultimate-table';
import { type Product } from '@/types';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { formatCurrency } from "@/lib/utils";
import { type Row } from '@tanstack/react-table';
import React from 'react';

export const createProductsTableConfig = (
    products: Product[],
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    }
): TableConfig<Product> => {
    const tenantRouter = useTenantRouter();

    return {
        name: 'Products',
        routeParam: 'product',
        data: products,
        columns: [
            {
                id: "name",
                accessorKey: "name",
                header: "Name",
                enableSorting: true,
                enableHiding: true,
                link: true,
            },
            {
                id: "description",
                accessorKey: "description",
                header: "Description",
                enableSorting: true,
                enableHiding: true,
                cell: ({ row }: { row: Row<Product> }): React.ReactNode => {
                    return React.createElement('div', { className: 'max-w-[300px] truncate' }, row.getValue("description"));
                },
            },
            {
                id: "price",
                accessorKey: "price",
                header: "Price",
                enableSorting: true,
                enableHiding: true,
                cell: ({ row }: { row: Row<Product> }): React.ReactNode => {
                    const price = parseFloat(row.getValue("price"));
                    return React.createElement('div', { className: 'font-medium' }, formatCurrency(price));
                },
            },
            {
                id: "featured_image",
                accessorKey: "featured_image",
                header: "Image",
                enableSorting: false,
                enableHiding: true,
                cell: ({ row }: { row: Row<Product> }): React.ReactNode => {
                    const image = row.getValue("featured_image") as string | null;
                    const originalName = row.original.featured_image_original_name;
                    
                    if (!image) {
                        return React.createElement('div', { className: 'text-muted-foreground' }, 'No image');
                    }
                    
                    return React.createElement(
                        'div',
                        { className: 'relative h-10 w-10' },
                        React.createElement('img', {
                            src: image,
                            alt: originalName || "Product image",
                            className: "h-full w-full rounded-md object-cover"
                        })
                    );
                },
            },
            {
                id: "created_at",
                accessorKey: "created_at",
                header: "Created At",
                enableSorting: true,
                enableHiding: true,
                cell: ({ row }: { row: Row<Product> }): React.ReactNode => {
                    return React.createElement('div', {}, new Date(row.getValue("created_at")).toLocaleDateString());
                },
            },
        ],
        searchColumns: ['name', 'description'],
        searchPlaceholder: 'Search products...',
        
        // Enable all features by default
        features: {
            search: true,
            selection: true,
            bulkActions: true,
            export: false,
            print: false,
            filters: true,
            pagination: true,
        },

        // Action buttons configuration
        actions: {
            showViewIcon: true,      // Show the eye icon by default
            showViewButton: false,   // Hide the View text button by default
            showEditButton: false,   // Hide the Edit text button by default
            showDeleteButton: false, // Hide the Delete text button by default
            showMoreMenu: true,      // Show the three-dot menu by default
            showCopyId: true,        // Show Copy ID in menu by default
            showShare: true,         // Show Share in menu by default
        },
        
        // API configuration
        api: {
            baseUrl: tenantRouter.route('products.index'), // To Get the data
            searchParam: 'search',
            sortParam: 'sort',
            directionParam: 'direction',
            pageParam: 'page',
            perPageParam: 'per_page',
            deleteUrl: (id: number) => tenantRouter.route('products.destroy', { product: id }), // To Delete the data
        },
        
        // Export configuration
        exportConfig: {
            showCsv: true,
            showJson: true,
            showPrint: true,
            filename: 'products',
        },
        
        // Pagination configuration - required for server-side pagination
        pagination,
    };
}; 