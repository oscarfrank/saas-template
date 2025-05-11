import { DataTable as BaseDataTable } from '@/components/ui/data-table';
import { type LoanPackage } from './table-columns';
import axios from 'axios';

interface TableProps<TData extends LoanPackage, TValue> {
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

export function Table<TData extends LoanPackage, TValue>({
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
            const response = await axios.post(route('loan-packages.all'), {}, {
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
            const response = await axios.post(route('loan-packages.export'), { format });
            return response.data;
        } catch (error) {
            console.error('Export failed:', error);
            return null;
        }
    };

    const printConfig = {
        title: "Loan Packages List",
        columns: [
            { header: "Name", accessor: "name" },
            { header: "Code", accessor: "code" },
            { header: "Description", accessor: "description" },
            { header: "User Type", accessor: "user_type" },
            { 
                header: "Amount Range", 
                accessor: "min_amount",
                format: (value: any) => {
                    const row = value as unknown as LoanPackage;
                    return `${row.min_amount} - ${row.max_amount}`;
                }
            },
            { 
                header: "Interest Rate", 
                accessor: "interest_rate",
                format: (value: any) => `${value}%`
            },
            { header: "Risk Level", accessor: "risk_level" },
            { 
                header: "Status", 
                accessor: "is_active",
                format: (value: any) => value ? 'Active' : 'Inactive'
            },
            { 
                header: "Created At", 
                accessor: "created_at",
                format: (value: any) => new Date(value).toLocaleDateString()
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
            tableName="Loan Packages"
            printConfig={printConfig}
            onPrint={handlePrint}
            onExport={handleExport}
        />
    );
} 