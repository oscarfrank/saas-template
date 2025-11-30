import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type KycVerification } from '@/types';
import { Head, router } from '@inertiajs/react';
import { createKycColumns } from '../components/table-columns';
import { KycTable } from '../components/kyc-table';
import { useState } from 'react';
import { toast } from 'sonner';
import { CustomAlertDialog } from '@/components/ui/custom-alert-min-dialog';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/dashboard/admin',
    },
    {
        title: 'KYC Management',
        href: '/admin/kyc',
    },
];

interface Props {
    kycVerifications: {
        data: KycVerification[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function Index({ kycVerifications }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [selectedKyc, setSelectedKyc] = useState<KycVerification | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const handleApprove = async (kyc: KycVerification) => {
        setIsLoading(true);
        setError(null);

        try {
            await router.put(route('kyc.update', kyc.id), {
                status: 'approved',
            });

            toast.success('KYC approved successfully');
            router.reload();
        } catch (error) {
            setError('Failed to approve KYC');
            toast.error('Failed to approve KYC');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedKyc) return;

        if (!rejectionReason) {
            toast.error('Please provide a rejection reason');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await router.put(route('kyc.update', selectedKyc.id), {
                status: 'rejected',
                rejection_reason: rejectionReason,
            });

            toast.success('KYC rejected successfully');
            setIsRejectDialogOpen(false);
            setSelectedKyc(null);
            setRejectionReason('');
            router.reload();
        } catch (error) {
            setError('Failed to reject KYC');
            toast.error('Failed to reject KYC');
        } finally {
            setIsLoading(false);
        }
    };

    const handleView = (kyc: KycVerification) => {
        router.visit(route('admin.kyc.show', kyc.id));
    };

    const handleRevert = async (kyc: KycVerification) => {
        setIsLoading(true);
        setError(null);

        try {
            await router.put(route('kyc.update', kyc.id), {
                status: 'pending',
                rejection_reason: null,
            });

            toast.success('KYC status reverted to pending');
            router.reload();
        } catch (error) {
            setError('Failed to revert KYC status');
            toast.error('Failed to revert KYC status');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (kyc: KycVerification) => {
        router.visit(route('kyc.edit', kyc.id));
    };

    const columns = createKycColumns({
        onApprove: handleApprove,
        onReject: (kyc) => {
            setSelectedKyc(kyc);
            setRejectionReason('');
            setIsRejectDialogOpen(true);
        },
        onView: handleView,
        onRevert: handleRevert,
        onEdit: handleEdit,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="KYC Management" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <KycTable
                    columns={columns}
                    data={kycVerifications.data}
                    pagination={{
                        current_page: kycVerifications.current_page,
                        last_page: kycVerifications.last_page,
                        per_page: kycVerifications.per_page,
                        total: kycVerifications.total,
                    }}
                    onPageChange={(page) => {
                        router.get(route('kyc.index'), { page });
                    }}
                    onPerPageChange={(perPage) => {
                        router.get(route('kyc.index'), { per_page: perPage });
                    }}
                    isLoading={isLoading}
                    error={error ?? undefined}
                />

                {isRejectDialogOpen && (
                    <CustomAlertDialog
                        isOpen={isRejectDialogOpen}
                        onClose={() => {
                            setIsRejectDialogOpen(false);
                            setSelectedKyc(null);
                            setRejectionReason('');
                        }}
                        onConfirm={handleReject}
                        title="Reject KYC Verification"
                        description="Are you sure you want to reject this KYC verification?"
                        confirmText="Reject"
                        isLoading={isLoading}
                    >
                        <div className="mt-4 space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="rejectionReason" className="text-sm font-medium">
                                    Rejection Reason
                                </label>
                                <textarea
                                    id="rejectionReason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full rounded-md border p-2"
                                    rows={3}
                                    required
                                />
                            </div>
                        </div>
                    </CustomAlertDialog>
                )}
            </div>
        </AppLayout>
    );
}
