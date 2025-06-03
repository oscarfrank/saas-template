import { DataTable } from './data-table';
import { type ColumnDef, Row } from '@tanstack/react-table';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { router, Link } from '@inertiajs/react';
import { toast } from 'sonner';
import { CustomAlertDialog } from '@/components/ui/custom-alert-dialog';
import { Button } from '@/components/ui/button';
import { Eye, MoreHorizontal, Pencil, Trash2, Copy, Share2, FileText, FileJson, Printer } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from "@/lib/utils";
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Checkbox } from '@/components/ui/checkbox';
import { type PrintConfig } from './data-table';

export interface TableColumnConfig {
    id: string;
    accessorKey: string;
    header: string;
    enableSorting?: boolean;
    enableHiding?: boolean;
    link?: boolean;
    cell?: (props: any) => React.ReactNode;
    [key: string]: any; // Allow for additional Tanstack Table properties
}

export interface TableConfig<TData> {
    // Basic configuration
    name: string;
    routeParam?: string;
    data: TData[];
    columns: TableColumnConfig[];
    searchColumns?: string[];
    searchPlaceholder?: string;
    
    // Feature toggles
    features?: {
        search?: boolean;
        selection?: boolean;
        bulkActions?: boolean;
        export?: boolean;
        print?: boolean;
        filters?: boolean;
        pagination?: boolean;
    };
    
    // Action buttons configuration
    actions?: {
        showViewIcon?: boolean;
        showViewButton?: boolean;
        showEditButton?: boolean;
        showDeleteButton?: boolean;
        showMoreMenu?: boolean;
        showCopyId?: boolean;
        showShare?: boolean;
    };
    
    // API configuration
    api?: {
        baseUrl: string;
        searchParam?: string;
        sortParam?: string;
        directionParam?: string;
        pageParam?: string;
        perPageParam?: string;
        deleteUrl?: (id: number) => string;
    };
    
    // Bulk actions configuration
    bulkActions?: {
        label: string;
        action: (selectedRows: TData[]) => void;
        icon?: React.ReactNode;
    }[];
    
    // Export configuration
    exportConfig?: {
        showCsv?: boolean;
        showJson?: boolean;
        showPrint?: boolean;
        filename?: string;
    };
    
    // Print configuration - will be generated from columns if not provided
    printConfig?: {
        title: string;
        columns: {
            header: string;
            accessor: string;
            format?: (value: any) => string;
        }[];
    };
    
    // Pagination configuration - required for server-side pagination
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    
    // Callbacks
    onPageChange?: (page: number) => void;
    onSortChange?: (sort: string, direction: 'asc' | 'desc') => void;
    onSearchChange?: (search: string) => void;
    onPerPageChange?: (perPage: number) => void;
    onBulkDelete?: (selectedRows: TData[]) => void;
    onBulkArchive?: (selectedRows: TData[]) => void;
    onDelete?: (item: TData) => void;
    onDeleteSuccess?: () => void;
    onDeleteError?: (error: any) => void;
}

export function UltimateTable<TData extends Record<string, any>>({
    config
}: {
    config: TableConfig<TData>;
}) {
    console.log('UltimateTable render', { 
        configName: config.name,
        dataLength: config.data.length,
        pagination: config.pagination
    });

    const tenantRouter = useTenantRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<TData | null>(null);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [selectedItems, setSelectedItems] = useState<TData[]>([]);
    const [lastSearch, setLastSearch] = useState<string>('');
    const [lastSort, setLastSort] = useState<{id: string, direction: 'asc' | 'desc'} | null>(null);
    const [lastPage, setLastPage] = useState<number>(config.pagination?.current_page ?? 1);
    const [lastPerPage, setLastPerPage] = useState<number>(config.pagination?.per_page ?? 10);
    const isInitialMount = useRef(true);
    const prevState = useRef({
        lastSearch,
        lastSort,
        lastPage,
        lastPerPage
    });

    // Memoize the table state
    const tableState = useMemo(() => ({
        isLoading,
        error,
        lastSearch,
        lastSort,
        lastPage,
        lastPerPage
    }), [isLoading, error, lastSearch, lastSort, lastPage, lastPerPage]);

    // Add effect to track state changes
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            prevState.current = tableState;
            return;
        }

        // Only log if state actually changed
        if (
            prevState.current.lastSearch !== lastSearch ||
            prevState.current.lastSort !== lastSort ||
            prevState.current.lastPage !== lastPage ||
            prevState.current.lastPerPage !== lastPerPage
        ) {
            console.log('UltimateTable state changed', tableState);
            prevState.current = tableState;
        }
    }, [tableState, lastSearch, lastSort, lastPage, lastPerPage]);

    const handleDelete = useCallback((item: TData) => {
        setSelectedItem(item);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!selectedItem || !config.api?.deleteUrl) return;

        setIsLoading(true);
        try {
            await router.delete(config.api.deleteUrl(selectedItem.id), {
                preserveState: true,
                preserveScroll: true,
            });
            
            toast.success(`${config.name} deleted successfully`);
            setIsDeleteDialogOpen(false);
            setSelectedItem(null);
            
            router.reload({
                only: [config.name.toLowerCase(), 'pagination'],
                onSuccess: () => {
                    setIsLoading(false);
                    config.onDeleteSuccess?.();
                },
                onError: (errors) => {
                    setIsLoading(false);
                    toast.error('Failed to refresh data after deletion');
                    config.onDeleteError?.(errors);
                }
            });
        } catch (error) {
            toast.error(`Failed to delete ${config.name.toLowerCase()}`);
            setIsLoading(false);
            config.onDeleteError?.(error);
        }
    }, [selectedItem, config]);

    const handleBulkDelete = useCallback((items: TData[]) => {
        setSelectedItems(items);
        setIsBulkDeleteDialogOpen(true);
    }, []);

    const handleBulkDeleteConfirm = useCallback(async () => {
        if (!config.api?.deleteUrl) return;

        setIsLoading(true);
        try {
            // Delete items sequentially
            for (const item of selectedItems) {
                await router.delete(config.api.deleteUrl(item.id), {
                    preserveState: true,
                    preserveScroll: true,
                });
            }
            
            toast.success(`Selected ${config.name.toLowerCase()} deleted successfully`);
            setIsBulkDeleteDialogOpen(false);
            setSelectedItems([]);
            
            // Reload the data
            router.reload({
                only: [config.name.toLowerCase(), 'pagination'],
                onSuccess: () => {
                    setIsLoading(false);
                    config.onDeleteSuccess?.();
                },
                onError: (errors) => {
                    setIsLoading(false);
                    toast.error('Failed to refresh data after deletion');
                    config.onDeleteError?.(errors);
                }
            });
        } catch (error) {
            toast.error(`Failed to delete some ${config.name.toLowerCase()}`);
            setIsLoading(false);
            config.onDeleteError?.(error);
        }
    }, [selectedItems, config]);

    const handlePageChange = useCallback((page: number) => {
        console.log('handlePageChange called', { page, lastPage });
        if (!config.api?.baseUrl || page === lastPage) return;
        
        // Batch state updates
        Promise.resolve().then(() => {
            setIsLoading(true);
            setError(null);
            setLastPage(page);
        });
        
        router.visit(window.location.pathname, {
            only: [config.name.toLowerCase(), 'pagination'],
            preserveState: true,
            preserveScroll: true,
            data: {
                [config.api.pageParam || 'page']: page,
                [config.api.perPageParam || 'per_page']: lastPerPage
            },
            onSuccess: () => {
                setIsLoading(false);
            },
            onError: (errors) => {
                setIsLoading(false);
                setError('Failed to load data. Please try again.');
            }
        });
    }, [config.api, config.name, lastPage, lastPerPage]);

    const handleSortChange = useCallback((sort: string, direction: 'asc' | 'desc') => {
        console.log('handleSortChange called', { sort, direction, lastSort });
        if (!config.api?.baseUrl) return;
        
        if (lastSort && lastSort.id === sort && lastSort.direction === direction) return;
        
        // Batch state updates
        Promise.resolve().then(() => {
            setIsLoading(true);
            setError(null);
            setLastSort({ id: sort, direction });
        });
        
        router.visit(window.location.pathname, {
            only: [config.name.toLowerCase(), 'pagination'],
            preserveState: true,
            preserveScroll: true,
            data: {
                [config.api.sortParam || 'sort']: sort,
                [config.api.directionParam || 'direction']: direction,
                [config.api.perPageParam || 'per_page']: lastPerPage
            },
            onSuccess: () => {
                setIsLoading(false);
            },
            onError: (errors) => {
                setIsLoading(false);
                setError('Failed to load data. Please try again.');
            }
        });
    }, [config.api, config.name, lastSort, lastPerPage]);

    const handleSearchChange = useCallback((search: string) => {
        console.log('handleSearchChange called', { search, lastSearch });
        if (!config.api?.baseUrl) return;
        
        // Batch state updates
        Promise.resolve().then(() => {
            setIsLoading(true);
            setError(null);
            setLastSearch(search);
        });
        
        // Create query params object with all current URL params
        const currentParams = new URLSearchParams(window.location.search);
        const queryParams: Record<string, string> = {};
        const searchParam = config.api.searchParam || 'search';
        
        // Preserve existing params except search
        currentParams.forEach((value, key) => {
            if (key !== searchParam) {
                queryParams[key] = value;
            }
        });
        
        // Add search param if there's a value
        if (search) {
            queryParams[searchParam] = search;
        }
        
        router.visit(window.location.pathname, {
            only: [config.name.toLowerCase(), 'pagination'],
            preserveState: true,
            preserveScroll: true,
            data: queryParams,
            onSuccess: () => {
                setIsLoading(false);
            },
            onError: (errors) => {
                setIsLoading(false);
                setError('Failed to load data. Please try again.');
            }
        });
    }, [config.api, config.name]);

    // Handle search input changes
    const handleGlobalFilterChange = useCallback((value: string) => {
        if (!config.api?.baseUrl) return;
        
        // Only update if the value is different
        if (value !== lastSearch) {
            handleSearchChange(value);
        }
    }, [config.api, lastSearch, handleSearchChange]);

    const handlePerPageChange = useCallback((perPage: number) => {
        console.log('handlePerPageChange called', { perPage, lastPerPage });
        if (!config.api?.baseUrl || perPage === lastPerPage) return;
        
        // Batch state updates
        Promise.resolve().then(() => {
            setIsLoading(true);
            setError(null);
            setLastPerPage(perPage);
            setLastPage(1); // Reset to first page when changing page size
        });
        
        router.visit(window.location.pathname, {
            only: [config.name.toLowerCase(), 'pagination'],
            preserveState: true,
            preserveScroll: true,
            data: {
                [config.api.perPageParam || 'per_page']: perPage,
                [config.api.pageParam || 'page']: 1, // Always go to first page when changing page size
                ...(lastSearch ? { [config.api.searchParam || 'search']: lastSearch } : {})
            },
            onSuccess: () => {
                setIsLoading(false);
            },
            onError: (errors) => {
                setIsLoading(false);
                setError('Failed to load data. Please try again.');
            }
        });
    }, [config.api, config.name, lastPerPage, lastSearch]);

    // Memoize columns to prevent unnecessary re-renders
    const columns = useMemo(() => [
        // Selection column
        ...(config.features?.selection !== false ? [{
            id: "select",
            header: ({ table }: { table: any }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }: { row: Row<TData> }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        }] : []),
        // Transform configured columns
        ...config.columns.map(column => {
            const baseColumn = {
                id: column.id,
                accessorKey: column.accessorKey,
                header: column.header,
                enableSorting: column.enableSorting ?? true,
                enableHiding: column.enableHiding ?? true,
            };

            if (column.cell) {
                return {
                    ...baseColumn,
                    cell: column.cell,
                };
            }

            return {
                ...baseColumn,
                cell: ({ row }: { row: Row<TData> }): React.ReactNode => {
                    const value = row.getValue(column.accessorKey);
                    if (column.link) {
                        const routeParam = config.routeParam || config.name.toLowerCase().slice(0, -1);
                        return (
                            <Link 
                                href={tenantRouter.route(`${config.name.toLowerCase()}.show`, { [routeParam]: row.original.id })}
                                className="font-medium hover:underline cursor-pointer"
                            >
                                {String(value)}
                            </Link>
                        );
                    }
                    return <div>{String(value)}</div>;
                },
            };
        }),
        // Actions column
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }: { row: Row<TData> }) => {
                const item = row.original;
                const routeParam = config.routeParam || config.name.toLowerCase().slice(0, -1);

                const handleCopyId = () => {
                    navigator.clipboard.writeText(String(item.id));
                    toast.success(`${config.name} ID copied to clipboard`);
                };

                const handleShare = () => {
                    const url = tenantRouter.route(`${config.name.toLowerCase()}.show`, { [routeParam]: item.id });
                    navigator.clipboard.writeText(url);
                    toast.success(`${config.name} URL copied to clipboard`);
                };

                return (
                    <div className="flex items-center gap-2">
                        {config.actions?.showViewIcon !== false && (
                            <Link href={tenantRouter.route(`${config.name.toLowerCase()}.show`, { [routeParam]: item.id })}>
                                <Button variant="outline" size="icon" className="cursor-pointer">
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </Link>
                        )}
                        {config.actions?.showViewButton && (
                            <Link href={tenantRouter.route(`${config.name.toLowerCase()}.show`, { [routeParam]: item.id })}>
                                <Button variant="outline" size="sm">
                                    View
                                </Button>
                            </Link>
                        )}
                        {config.actions?.showEditButton && (
                            <Link href={tenantRouter.route(`${config.name.toLowerCase()}.edit`, { [routeParam]: item.id })}>
                                <Button variant="outline" size="sm">
                                    Edit
                                </Button>
                            </Link>
                        )}
                        {config.actions?.showDeleteButton && (
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDelete(item)}
                                className="text-destructive"
                            >
                                Delete
                            </Button>
                        )}
                        {config.actions?.showMoreMenu !== false && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="cursor-pointer">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={tenantRouter.route(`${config.name.toLowerCase()}.edit`, { [routeParam]: item.id })} className="cursor-pointer">
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit {config.name}
                                        </Link>
                                    </DropdownMenuItem>
                                    {config.actions?.showCopyId !== false && (
                                        <DropdownMenuItem onClick={handleCopyId} className="cursor-pointer">
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy ID
                                        </DropdownMenuItem>
                                    )}
                                    {config.actions?.showShare !== false && (
                                        <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                                            <Share2 className="mr-2 h-4 w-4" />
                                            Share {config.name}
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        onClick={() => handleDelete(item)} 
                                        className="text-destructive cursor-pointer"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete {config.name}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                );
            },
        },
    ], [config, tenantRouter, handleDelete]);

    // Memoize print configuration
    const printConfig = useMemo(() => config.printConfig || {
        title: `${config.name} List`,
        columns: columns
            .filter(col => col.id !== 'select' && col.id !== 'actions')
            .map(col => ({
                header: String(col.header),
                accessor: col.id || '',
                format: (value: any) => String(value)
            }))
    }, [config, columns]);

    // Memoize the table configuration
    const tableConfig = useMemo(() => ({
        columns,
        data: config.data,
        searchPlaceholder: config.searchPlaceholder,
        searchColumns: config.searchColumns,
        showSearch: config.features?.search !== false,
        showExport: config.features?.export !== false,
        showFilters: config.features?.filters !== false,
        showPagination: config.features?.pagination !== false,
        showPrint: config.features?.print !== false,
        showBulkActions: config.features?.bulkActions !== false,
        bulkActions: config.bulkActions,
        onBulkDelete: handleBulkDelete,
        onBulkArchive: config.onBulkArchive,
        resetSelection: true,
        pagination: config.pagination,
        onPageChange: handlePageChange,
        onSortChange: handleSortChange,
        onSearchChange: handleGlobalFilterChange,
        onPerPageChange: handlePerPageChange,
        isLoading,
        error: error ?? undefined,
        tableName: config.name,
        printConfig
    }), [
        columns,
        config.data,
        config.searchPlaceholder,
        config.searchColumns,
        config.features,
        config.bulkActions,
        config.onBulkArchive,
        config.pagination,
        config.name,
        handleBulkDelete,
        handlePageChange,
        handleSortChange,
        handleGlobalFilterChange,
        handlePerPageChange,
        isLoading,
        error,
        printConfig
    ]);

    return (
        <>
            <DataTable {...tableConfig} />

            <CustomAlertDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Are you sure?"
                description={`This action cannot be undone. This will permanently delete the ${config.name.toLowerCase()} "${selectedItem?.name}".`}
                isLoading={isLoading}
            />

            <CustomAlertDialog
                isOpen={isBulkDeleteDialogOpen}
                onClose={() => {
                    setIsBulkDeleteDialogOpen(false);
                    setSelectedItems([]);
                }}
                onConfirm={handleBulkDeleteConfirm}
                title="Are you sure?"
                description={`This action cannot be undone. This will permanently delete ${selectedItems.length} selected ${config.name.toLowerCase()}(s).`}
                confirmText="Delete Selected"
                isLoading={isLoading}
            />
        </>
    );
} 