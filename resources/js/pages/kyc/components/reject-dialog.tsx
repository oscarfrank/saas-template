import { Button } from "@/components/ui/button";
import { useState } from "react";

interface RejectDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    isLoading?: boolean;
}

export function RejectDialog({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
}: RejectDialogProps) {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div 
                className="fixed inset-0 bg-black/50"
                onClick={onClose}
            />
            <div className="relative z-50 w-[90%] max-w-md rounded-lg bg-background p-6 shadow-lg">
                <h2 className="text-lg font-semibold">Reject KYC Verification</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Are you sure you want to reject this KYC verification?
                </p>
                <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="rejectionReason" className="text-sm font-medium">
                            Rejection Reason
                        </label>
                        <textarea
                            id="rejectionReason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full rounded-md border p-2"
                            rows={3}
                            required
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onConfirm(reason);
                        }}
                        disabled={isLoading || !reason}
                    >
                        {isLoading ? 'Processing...' : 'Reject'}
                    </Button>
                </div>
            </div>
        </div>
    );
} 