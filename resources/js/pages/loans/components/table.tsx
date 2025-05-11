import { DataTable as BaseDataTable } from '@/components/ui/data-table';
import { type Loan } from './table-columns';
import axios from 'axios';

interface TableProps<TData extends Loan, TValue> {
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

export function Table<TData extends Loan, TValue>({
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
            const response = await axios.post(route('loans.all'), {}, {
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
            const response = await axios.post(route('loans.export'), { format });
            return response.data;
        } catch (error) {
            console.error('Export failed:', error);
            return null;
        }
    };

    const printConfig = {
        title: "Loans List",
        columns: [
            { header: "Reference", accessor: "reference_number" },
            { header: "Borrower", accessor: "user.name" },
            { 
                header: "Amount", 
                accessor: "amount",
                format: (value: any) => `${value.currency.code} ${value.amount.toFixed(2)}`
            },
            { 
                header: "Status", 
                accessor: "status",
                format: (value: string) => value.toUpperCase().replace('_', ' ')
            },
            { 
                header: "Interest Rate", 
                accessor: "interest_rate",
                format: (value: number) => `${value.toFixed(2)}%`
            },
            { 
                header: "Duration", 
                accessor: "duration_days",
                format: (value: number) => `${value} days`
            },
            { 
                header: "Start Date", 
                accessor: "start_date",
                format: (value: string | null) => value ? new Date(value).toLocaleDateString() : 'N/A'
            },
            { 
                header: "End Date", 
                accessor: "end_date",
                format: (value: string | null) => value ? new Date(value).toLocaleDateString() : 'N/A'
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
            onBulkArchive={onBulkArchive}
            resetSelection={resetSelection}
            pagination={pagination}
            onPageChange={onPageChange}
            onSortChange={onSortChange}
            onSearchChange={onSearchChange}
            onPerPageChange={onPerPageChange}
            isLoading={isLoading}
            error={error}
            tableName="Loans"
            printConfig={printConfig}
            onPrint={handlePrint}
            onExport={handleExport}
        />
    );
} 