import { DataTable as BaseDataTable } from '@/components/ui/data-table';
import { type Ticket } from './table-columns';
import axios from 'axios';

interface TableProps<TData extends Ticket, TValue> {
    columns: any[];
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
}

export function Table<TData extends Ticket, TValue>({
    columns,
    data,
    searchPlaceholder,
    searchColumns,
    bulkActions,
    onBulkDelete,
    onBulkArchive,
    resetSelection,
    pagination,
    onPageChange,
    onSortChange,
    onSearchChange,
    onPerPageChange,
    isLoading,
    error,
}: TableProps<TData, TValue>) {
    const handlePrint = async () => {
        try {
            const response = await axios.get(route('admin.tickets.index'), {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            return response.data.data as TData[];
        } catch (error) {
            console.error('Print failed:', error);
            return [];
        }
    };

    const handleExport = async (format: 'csv' | 'json') => {
        try {
            const response = await axios.get(route('tickets.export'));
            return response.data;
        } catch (error) {
            console.error('Export failed:', error);
            return null;
        }
    };

    const printConfig = {
        title: "Tickets List",
        columns: [
            { header: "Subject", accessor: "subject" },
            { header: "Status", accessor: "status" },
            { header: "Priority", accessor: "priority" },
            { header: "Category", accessor: "category" },
            { header: "Created By", accessor: "user.name" },
            { header: "Assigned To", accessor: "assignedTo.name" },
            { header: "Last Reply", accessor: "last_reply_at" },
            { header: "Created At", accessor: "created_at" }
        ]
    };

    return (
        <BaseDataTable
            columns={columns}
            data={data}
            searchPlaceholder={searchPlaceholder}
            searchColumns={searchColumns}
            bulkActions={bulkActions}
            onBulkDelete={onBulkDelete}
            onBulkArchive={onBulkArchive}
            resetSelection={resetSelection}
            pagination={pagination}
            onPageChange={onPageChange}
            onSortChange={onSortChange}
            onSearchChange={onSearchChange}
            onPerPageChange={onPerPageChange}
            isLoading={isLoading}
            error={error}
            tableName="Tickets"
            printConfig={printConfig}
            onPrint={handlePrint}
            onExport={handleExport}
        />
    );
} 