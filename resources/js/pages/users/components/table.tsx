import { DataTable as BaseDataTable } from '@/components/ui/data-table';
import { type User } from './table-columns';
import axios from 'axios';

interface TableProps {
    columns: any[];
    data: User[];
    searchPlaceholder?: string;
    searchColumns?: string[];
    bulkActions?: {
        label: string;
        action: (selectedRows: User[]) => void;
        icon?: React.ReactNode;
    }[];
    onBulkDelete?: (selectedRows: User[]) => void;
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

export function Table({
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
}: TableProps) {
    const handlePrint = async () => {
        try {
            const response = await axios.get(route('admin.users.index'), {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            return response.data.users as User[];
        } catch (error) {
            console.error('Print failed:', error);
            return [];
        }
    };

    const handleExport = async (format: 'csv' | 'json') => {
        try {
            const response = await axios.post(route('admin.users.export'), { format });
            return response.data;
        } catch (error) {
            console.error('Export failed:', error);
            return null;
        }
    };

    const printConfig = {
        title: "Users List",
        columns: [
            { header: "Name", accessor: "name" },
            { header: "Email", accessor: "email" },
            { 
                header: "Roles", 
                accessor: "roles",
                format: (value: Array<{ name: string }>) => value.map(role => role.name).join(', ')
            },
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
            tableName="Users"
            printConfig={printConfig}
            onPrint={handlePrint}
            onExport={handleExport}
        />
    );
} 