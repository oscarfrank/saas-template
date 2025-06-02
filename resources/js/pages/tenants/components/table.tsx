import { DataTable as BaseDataTable } from '@/components/ui/data-table';
import { type Tenant } from './table-columns';
import axios from 'axios';

interface TableProps<TData extends Tenant, TValue> {
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

export function Table<TData extends Tenant, TValue>({
    columns,
    data,
    searchPlaceholder,
    searchColumns,
    bulkActions,
    onBulkDelete,
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
            const response = await axios.post(route('tenants.all'), {}, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            return response.data as TData[];
        } catch (error) {
            console.error('Print failed:', error);
            return [];
        }
    };

    const handleExport = async (format: 'csv' | 'json') => {
        try {
            const response = await axios.post(route('tenants.export'), { format });
            return response.data;
        } catch (error) {
            console.error('Export failed:', error);
            return null;
        }
    };

    const printConfig = {
        title: "Organizations List",
        columns: [
            { header: "Name", accessor: "name" },
            { header: "Slug", accessor: "slug" },
            { 
                header: "Created At", 
                accessor: "created_at",
                format: (value: string) => new Date(value).toLocaleDateString()
            }
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
            resetSelection={resetSelection}
            pagination={pagination}
            onPageChange={onPageChange}
            onSortChange={onSortChange}
            onSearchChange={onSearchChange}
            onPerPageChange={onPerPageChange}
            isLoading={isLoading}
            error={error}
            tableName="Organizations"
            printConfig={printConfig}
            onPrint={handlePrint}
            onExport={handleExport}
        />
    );
} 