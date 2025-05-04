import { DataTable as BaseDataTable } from '@/components/ui/data-table';
import { type KycVerification } from '@/types';
import axios from 'axios';
import { useDebounce } from '@/hooks/use-debounce';
import { useState } from 'react';

interface KycTableProps {
    columns: any[];
    data: KycVerification[];
    searchPlaceholder?: string;
    searchColumns?: string[];
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

export function KycTable({
    columns,
    data,
    searchPlaceholder = 'Search KYC verifications...',
    searchColumns = ['full_name', 'email', 'user.name', 'user.email'],
    pagination,
    onPageChange,
    onSortChange,
    onSearchChange,
    onPerPageChange,
    isLoading,
    error,
}: KycTableProps) {
    const handlePrint = async () => {
        try {
            const response = await axios.post(route('kyc.all'), {}, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            return response.data as KycVerification[];
        } catch (error) {
            console.error('Print failed:', error);
            return [];
        }
    };

    const handleExport = async (format: 'csv' | 'json') => {
        try {
            const response = await axios.post(route('kyc.export'), { format });
            return response.data;
        } catch (error) {
            console.error('Export failed:', error);
            return null;
        }
    };

    const printConfig = {
        title: "KYC Verifications List",
        columns: [
            { header: "Full Name", accessor: "full_name" },
            { header: "Email", accessor: "email" },
            { header: "Status", accessor: "status" },
            { header: "ID Type", accessor: "id_type" },
            { header: "Submitted At", accessor: "submitted_at" },
            { header: "Verified At", accessor: "verified_at" },
            { header: "Rejection Reason", accessor: "rejection_reason" }
        ]
    };

    return (
        <div className="space-y-4">
            <BaseDataTable
                columns={columns}
                data={data}
                searchPlaceholder={searchPlaceholder}
                searchColumns={searchColumns}
                pagination={pagination}
                onPageChange={onPageChange}
                onSortChange={onSortChange}
                onSearchChange={onSearchChange}
                onPerPageChange={onPerPageChange}
                isLoading={isLoading}
                error={error}
                tableName="KYC Verifications"
                printConfig={printConfig}
                onPrint={handlePrint}
                onExport={handleExport}
            />
        </div>
    );
} 