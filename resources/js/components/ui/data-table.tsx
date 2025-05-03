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
import { useState } from "react";
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
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchPlaceholder?: string;
    searchColumns?: string[];
    bulkActions?: {
        label: string;
        action: (selectedRows: TData[]) => void;
        icon?: React.ReactNode;
    }[];
}

interface Filter {
    id: string;
    column: string;
    value: string;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchPlaceholder = "Search...",
    searchColumns = ["name"],
    bulkActions = [],
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [selectedColumn, setSelectedColumn] = useState<string>("");
    const [filterValue, setFilterValue] = useState<string>("");
    const [filters, setFilters] = useState<Filter[]>([]);

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

    const handleExport = (format: 'csv' | 'json' | 'excel') => {
        const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
        const visibleColumns = columns.filter(col => 
            col.id !== 'select' && 
            col.id !== 'actions' && 
            col.id && 
            typeof col.header === 'string'
        );
        
        switch (format) {
            case 'csv':
                const csvContent = [
                    // Headers
                    visibleColumns.map(col => `"${col.header}"`).join(','),
                    // Data
                    ...selectedRows.map(row => 
                        visibleColumns
                            .map(col => {
                                const value = getCellValue(row, col.id as string);
                                return `"${value.replace(/"/g, '""')}"`;
                            })
                            .join(',')
                    )
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `export-${new Date().toISOString()}.csv`;
                link.click();
                break;

            case 'json':
                const jsonData = selectedRows.map(row => {
                    const rowData: Record<string, any> = {};
                    visibleColumns.forEach(col => {
                        rowData[col.header as string] = getCellValue(row, col.id as string);
                    });
                    return rowData;
                });
                
                const jsonContent = JSON.stringify(jsonData, null, 2);
                const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
                const jsonLink = document.createElement('a');
                jsonLink.href = URL.createObjectURL(jsonBlob);
                jsonLink.download = `export-${new Date().toISOString()}.json`;
                jsonLink.click();
                break;

            case 'excel':
                const excelContent = [
                    visibleColumns.map(col => col.header).join('\t'),
                    ...selectedRows.map(row => 
                        visibleColumns
                            .map(col => {
                                const value = getCellValue(row, col.id as string);
                                return value.replace(/\t/g, ' ').replace(/\n/g, ' ');
                            })
                            .join('\t')
                    )
                ].join('\n');

                const excelBlob = new Blob([excelContent], { type: 'text/tab-separated-values;charset=utf-8;' });
                const excelLink = document.createElement('a');
                excelLink.href = URL.createObjectURL(excelBlob);
                excelLink.download = `export-${new Date().toISOString()}.tsv`;
                excelLink.click();
                break;
        }
    };

    const handleCopy = () => {
        const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
        const textToCopy = JSON.stringify(selectedRows, null, 2);
        navigator.clipboard.writeText(textToCopy);
    };

    const handlePrint = () => {
        const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
        const visibleColumns = columns.filter(col => 
            col.id !== 'select' && 
            col.id !== 'actions' && 
            col.id && 
            typeof col.header === 'string'
        );

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print Selected Rows</title>
                        <style>
                            body { font-family: Arial, sans-serif; }
                            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                            tr:nth-child(even) { background-color: #f9f9f9; }
                            @media print {
                                body { padding: 20px; }
                                table { page-break-inside: auto; }
                                tr { page-break-inside: avoid; page-break-after: auto; }
                            }
                        </style>
                    </head>
                    <body>
                        <h2>Selected Rows</h2>
                        <table>
                            <thead>
                                <tr>
                                    ${visibleColumns.map(col => `<th>${col.header}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${selectedRows.map(row => `
                                    <tr>
                                        ${visibleColumns.map(col => {
                                            const value = getCellValue(row, col.id as string);
                                            return `<td>${value}</td>`;
                                        }).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const handleArchive = () => {
        const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
        // Implement archive logic here
        console.log('Archiving rows:', selectedRows);
    };

    const handleDelete = () => {
        const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
        // Implement delete logic here
        console.log('Deleting rows:', selectedRows);
    };

    return (
        <div>
            <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder={searchPlaceholder}
                        value={globalFilter ?? ""}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="max-w-sm"
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
                                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Export as CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport('excel')}>
                                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                                        Export as Excel
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport('json')}>
                                        <FileJson className="mr-2 h-4 w-4" />
                                        Export as JSON
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleCopy}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy Selected
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handlePrint}>
                                        <Printer className="mr-2 h-4 w-4" />
                                        Print Selected
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleArchive}>
                                        <Archive className="mr-2 h-4 w-4" />
                                        Archive Selected
                                    </DropdownMenuItem>
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
                                <FilterIcon className="mr-2 h-4 w-4" />
                                Filter
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
                            {columns
                                .filter(column => column.id !== "select" && column.id !== "actions")
                                .map((column) => (
                                    <DropdownMenuItem
                                        key={column.id}
                                        onClick={() => {
                                            setSelectedColumn(column.id as string);
                                        }}
                                    >
                                        {column.header as string}
                                    </DropdownMenuItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                        {table.getRowModel().rows?.length ? (
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
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between px-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Rows per page</p>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => {
                                table.setPageSize(Number(value));
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={table.getState().pagination.pageSize} />
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
                        Page {table.getState().pagination.pageIndex + 1} of{" "}
                        {table.getPageCount()}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to first page</span>
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to previous page</span>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to next page</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to last page</span>
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
} 