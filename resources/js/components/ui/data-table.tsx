import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    SortingState,
    getSortedRowModel,
    ColumnFiltersState,
    getFilteredRowModel,
    VisibilityState,
    Column,
    RowSelectionState,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { 
    ArrowUpDown, 
    ChevronLeft, 
    ChevronRight, 
    ChevronsLeft, 
    ChevronsRight, 
    EyeOff, 
    X, 
    Plus,
    Download,
    Trash2,
    Copy,
    FileSpreadsheet,
    FileJson,
    FileText,
    Printer,
    Share2,
    Archive,
    Filter as FilterIcon,
    AlertCircle,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { PlaceholderPattern } from "@/components/ui/placeholder-pattern";
import { router } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';

interface Product {
    name: string;
    description: string;
    price: number;
    featured_image: string | null;
    created_at: string;
}

interface DataTableProps<TData extends Product, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchPlaceholder?: string;
    searchColumns?: string[];
    bulkActions?: {
        label: string;
        action: (selectedRows: TData[]) => void;
        icon?: React.ReactNode;
    }[];
    onBulkDelete?: (selectedRows: TData[]) => void;
    onBulkArchive?: (selectedRows: TData[]) => void;
    resetSelection?: boolean;
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    onPageChange?: (page: number) => void;
    onSortChange?: (sort: string, direction: 'asc' | 'desc') => void;
    onSearchChange?: (search: string) => void;
    onPerPageChange?: (perPage: number) => void;
    isLoading?: boolean;
    error?: string;
    tableName?: string;
    onPrint?: () => Promise<Array<{
        name: string;
        description: string;
        price: number;
        featured_image: string | null;
        created_at: string;
    }>>;
    onExport?: (format: 'csv' | 'json') => Promise<{
        format: 'csv' | 'json';
        headers?: string[];
        data: any[];
        filename: string;
        error?: string;
    } | null>;
}

interface Filter {
    id: string;
    column: string;
    value: string;
}

interface ExportData {
    format: 'csv' | 'json';
    headers?: string[];
    data: any[];
    filename: string;
    error?: string;
}

export function DataTable<TData extends Product, TValue>({
    columns,
    data,
    searchPlaceholder = "Search...",
    searchColumns = ["name"],
    bulkActions = [],
    onBulkDelete,
    onBulkArchive,
    resetSelection = false,
    pagination,
    onPageChange,
    onSortChange,
    onSearchChange,
    onPerPageChange,
    isLoading = false,
    error,
    tableName = "Items",
    onPrint,
    onExport,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [selectedColumn, setSelectedColumn] = useState<string>("");
    const [filterValue, setFilterValue] = useState<string>("");
    const [filters, setFilters] = useState<Filter[]>([]);

    // Reset row selection when resetSelection prop changes
    useEffect(() => {
        if (resetSelection) {
            setRowSelection({});
        }
    }, [resetSelection]);

    // Handle search changes
    useEffect(() => {
        if (globalFilter === undefined) return;
        
        const timeout = setTimeout(() => {
            if (onSearchChange) {
                onSearchChange(globalFilter);
            }
        }, 500);
        return () => clearTimeout(timeout);
    }, [globalFilter]);

    // Handle sort changes
    useEffect(() => {
        if (sorting.length === 0) return;
        
        if (onSortChange) {
            onSortChange(sorting[0].id, sorting[0].desc ? 'desc' : 'asc');
        }
    }, [sorting]);

    const table = useReactTable({
        data,
        columns: [
            {
                id: "select",
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            ...columns,
        ],
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            columnVisibility,
            rowSelection,
            pagination: {
                pageIndex: (pagination?.current_page ?? 1) - 1,
                pageSize: pagination?.per_page ?? 10,
            },
        },
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: (row, columnId, filterValue) => {
            const searchableColumns = searchColumns;
            const value = String(row.getValue(columnId)).toLowerCase();
            return searchableColumns.includes(columnId) && value.includes(filterValue.toLowerCase());
        },
        filterFns: {
            fuzzy: (row, columnId, value) => {
                const cellValue = String(row.getValue(columnId)).toLowerCase();
                return cellValue.includes(value.toLowerCase());
            },
        },
        columnResizeMode: "onChange",
        filterFromLeafRows: true,
        enableColumnFilters: true,
        enableFilters: true,
        manualPagination: true,
        pageCount: pagination?.last_page ?? 1,
    });

    const addFilter = () => {
        if (selectedColumn && filterValue) {
            const column = columns.find(c => c.id === selectedColumn);
            if (column) {
                const newFilter = {
                    id: Date.now().toString(),
                    column: selectedColumn,
                    value: filterValue
                };
                
                setFilters(prev => [...prev, newFilter]);
                setColumnFilters(prev => [...prev, { id: selectedColumn, value: filterValue }]);
                
                setSelectedColumn("");
                setFilterValue("");
            }
        }
    };

    const removeFilter = (id: string) => {
        const filterToRemove = filters.find(f => f.id === id);
        if (filterToRemove) {
            setFilters(prev => prev.filter(filter => filter.id !== id));
            setColumnFilters(prev => prev.filter(f => f.id !== filterToRemove.column));
        }
    };

    const getColumnValues = (columnId: string) => {
        return Array.from(new Set(data.map(row => row[columnId as keyof TData])));
    };

    const getCellValue = (row: TData, columnId: string): string => {
        const value = row[columnId as keyof TData];
        if (value === undefined || value === null) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    };

    const handleExport = async (format: 'csv' | 'json') => {
        try {
            const exportData = onExport ? await onExport(format) : null;
            if (!exportData) return;

            if (exportData.format === 'csv') {
                const { headers, data: csvData, filename } = exportData;
                const csvContent = [
                    headers?.join(','),
                    ...csvData.map((row: any) => 
                        Object.values(row)
                            .map(value => `"${String(value).replace(/"/g, '""')}"`)
                            .join(',')
                    )
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else if (exportData.format === 'json') {
                const { data: jsonData, filename } = exportData;
                const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const handleCopy = () => {
        const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
        const textToCopy = JSON.stringify(selectedRows, null, 2);
        navigator.clipboard.writeText(textToCopy).then(() => {
            toast.success(`Copied ${selectedRows.length} item(s) to clipboard`);
        }).catch(() => {
            toast.error('Failed to copy to clipboard');
        });
    };

    const handlePrint = async () => {
        try {
            const allItems = onPrint ? await onPrint() : [];
            
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                console.error('Please allow popups to print the table');
                return;
            }

            printWindow.document.write(`
                <html>
                    <head>
                        <title>${tableName} List</title>
                        <style>
                            @media print {
                                @page {
                                    size: landscape;
                                }
                                body {
                                    font-family: Arial, sans-serif;
                                }
                                table {
                                    width: 100%;
                                    border-collapse: collapse;
                                }
                                th, td {
                                    border: 1px solid #ddd;
                                    padding: 8px;
                                    text-align: left;
                                }
                                th {
                                    background-color: #f2f2f2;
                                }
                                img {
                                    max-width: 100px;
                                    max-height: 100px;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <h1>${tableName} List</h1>
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Description</th>
                                    <th>Price</th>
                                    <th>Image</th>
                                    <th>Created At</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${allItems.map((product) => `
                                    <tr>
                                        <td>${product.name}</td>
                                        <td>${product.description}</td>
                                        <td>${product.price}</td>
                                        <td>${product.featured_image ? `<img src="${product.featured_image}" alt="${product.name}">` : 'No image'}</td>
                                        <td>${new Date(product.created_at).toLocaleDateString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </body>
                </html>
            `);

            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        } catch (error) {
            console.error('Print failed:', error);
        }
    };

    const handleDelete = () => {
        const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
        if (onBulkDelete) {
            onBulkDelete(selectedRows);
        }
    };


    const handleBulkExport = async (format: 'csv' | 'json') => {
        try {
            const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
            if (selectedRows.length === 0) {
                console.error('No rows selected');
                return;
            }

            if (format === 'csv') {
                const headers = Object.keys(selectedRows[0]);
                const csvContent = [
                    headers.join(','),
                    ...selectedRows.map(row => 
                        Object.values(row)
                            .map(value => `"${String(value).replace(/"/g, '""')}"`)
                            .join(',')
                    )
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `selected-${tableName.toLowerCase()}-${new Date().toISOString()}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else if (format === 'json') {
                const blob = new Blob([JSON.stringify(selectedRows, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `selected-${tableName.toLowerCase()}-${new Date().toISOString()}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Bulk export failed:', error);
        }
    };

    const handleBulkPrint = async () => {
        try {
            const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
            if (selectedRows.length === 0) {
                console.error('No rows selected');
                return;
            }

            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                console.error('Please allow popups to print the table');
                return;
            }

            printWindow.document.write(`
                <html>
                    <head>
                        <title>Selected Products List</title>
                        <style>
                            @media print {
                                @page {
                                    size: landscape;
                                }
                                body {
                                    font-family: Arial, sans-serif;
                                }
                                table {
                                    width: 100%;
                                    border-collapse: collapse;
                                }
                                th, td {
                                    border: 1px solid #ddd;
                                    padding: 8px;
                                    text-align: left;
                                }
                                th {
                                    background-color: #f2f2f2;
                                }
                                img {
                                    max-width: 100px;
                                    max-height: 100px;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <h1>Selected Products List</h1>
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Description</th>
                                    <th>Price</th>
                                    <th>Image</th>
                                    <th>Created At</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${selectedRows.map((product) => `
                                    <tr>
                                        <td>${product.name}</td>
                                        <td>${product.description}</td>
                                        <td>${product.price}</td>
                                        <td>${product.featured_image ? `<img src="${product.featured_image}" alt="${product.name}">` : 'No image'}</td>
                                        <td>${new Date(product.created_at).toLocaleDateString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </body>
                </html>
            `);

            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        } catch (error) {
            console.error('Bulk print failed:', error);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 py-4">
                <div className="flex-1 flex items-center gap-2">
                    <Input
                        placeholder={searchPlaceholder}
                        value={globalFilter ?? ""}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="w-full"
                        disabled={isLoading}
                    />
                    {table.getSelectedRowModel().rows.length > 0 && (
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Share2 className="mr-2 h-4 w-4" />
                                        Bulk Actions
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-[200px]">
                                    <DropdownMenuItem onClick={() => handleBulkExport('csv')}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Export as CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleBulkExport('json')}>
                                        <FileJson className="mr-2 h-4 w-4" />
                                        Export as JSON
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleCopy}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy Selected
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleBulkPrint}>
                                        <Printer className="mr-2 h-4 w-4" />
                                        Print Selected
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        onClick={handleDelete}
                                        className="text-red-600"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Selected
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {bulkActions.map((action, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => action.action(table.getSelectedRowModel().rows.map(row => row.original))}
                                >
                                    {action.icon && <span className="mr-2">{action.icon}</span>}
                                    {action.label}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <EyeOff className="mr-2 h-4 w-4" />
                                View
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter(
                                    (column) => column.getCanHide()
                                )
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExport('csv')}>
                                <FileText className="mr-2 h-4 w-4" />
                                Export All {tableName} as CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('json')}>
                                <FileJson className="mr-2 h-4 w-4" />
                                Export All {tableName} as JSON
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print All
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="flex items-center gap-2 py-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 border-dashed">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Filter
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Add Filter</h4>
                                <p className="text-sm text-muted-foreground">
                                    Filter the table by specific columns
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <label htmlFor="column">Column</label>
                                    <Select
                                        value={selectedColumn}
                                        onValueChange={(value) => {
                                            setSelectedColumn(value);
                                        }}
                                    >
                                        <SelectTrigger className="col-span-2">
                                            <SelectValue placeholder="Select column">
                                                {selectedColumn ? 
                                                    columns.find(c => c.id === selectedColumn)?.header as string 
                                                    : "Select column"}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {columns
                                                .filter(column => column.id !== "actions")
                                                .map((column) => (
                                                    <SelectItem 
                                                        key={column.id} 
                                                        value={column.id as string}
                                                    >
                                                        {column.header as string}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <label htmlFor="value">Value</label>
                                    <Input
                                        id="value"
                                        value={filterValue}
                                        onChange={(e) => setFilterValue(e.target.value)}
                                        className="col-span-2"
                                    />
                                </div>
                                <Button onClick={addFilter}>Add</Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
                {filters.map((filter) => {
                    const column = columns.find(c => c.id === filter.column);
                    return (
                        <Badge
                            key={filter.id}
                            variant="secondary"
                            className="flex items-center gap-1"
                        >
                            {column?.header as string}: {filter.value}
                            <button
                                onClick={() => removeFilter(filter.id)}
                                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    );
                })}
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className="flex items-center space-x-2 cursor-pointer"
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {header.column.getCanSort() && (
                                                        <ArrowUpDown className="h-4 w-4" />
                                                    )}
                                                </div>
                                            )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} className="h-96">
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <PlaceholderPattern className="w-16 h-16" />
                                        <p className="mt-4 text-sm text-muted-foreground">Loading data...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} className="h-96">
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <AlertCircle className="w-16 h-16 text-destructive" />
                                        <p className="mt-4 text-sm text-destructive">{error}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + 1}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {pagination && (
                <div className="flex items-center justify-between px-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length} of{" "}
                        {pagination.total} row(s) selected.
                    </div>
                    <div className="flex items-center space-x-6 lg:space-x-8">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">Rows per page</p>
                            <Select
                                value={`${pagination.per_page}`}
                                onValueChange={(value) => {
                                    onPerPageChange?.(Number(value));
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={pagination.per_page} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`}>
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                            Page {pagination.current_page} of {pagination.last_page}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => onPageChange?.(1)}
                                disabled={pagination.current_page === 1}
                            >
                                <span className="sr-only">Go to first page</span>
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => onPageChange?.(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                            >
                                <span className="sr-only">Go to previous page</span>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => onPageChange?.(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                            >
                                <span className="sr-only">Go to next page</span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => onPageChange?.(pagination.last_page)}
                                disabled={pagination.current_page === pagination.last_page}
                            >
                                <span className="sr-only">Go to last page</span>
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 