import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Edit, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useState } from 'react';
import { useTenantRouter } from '@/hooks/use-tenant-router';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'KYC',
        href: '/kyc',
    },
];

const ID_TYPE_MAP: Record<string, string> = {
    'passport': 'Passport',
    'national_id': 'National ID Card',
    'drivers_license': "Driver's License"
};

interface ShowProps {
    kycVerification: {
        id: number;
        full_name: string;
        date_of_birth: string;
        phone_number: string;
        email: string;
        address_line_1: string;
        address_line_2: string | null;
        city: string;
        state_province: string;
        postal_code: string;
        country: string;
        id_type: string;
        id_number: string;
        status: 'pending' | 'approved' | 'rejected';
        rejection_reason: string | null;
        submitted_at: string;
        verified_at: string | null;
        id_document_front: string;
        id_document_back: string;
    };
}

export default function Show({ kycVerification }: ShowProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const tenantRouter = useTenantRouter();
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary">Pending</Badge>;
            case 'approved':
                return <Badge variant="default">Approved</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="KYC Status" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between">
                    <Link href={tenantRouter.route('dashboard')}>
                        <Button variant="outline" className="cursor-pointer">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>
                    {kycVerification.status === 'rejected' && (
                        <Link href={tenantRouter.route('kyc.create')}>
                            <Button className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" />
                                Resubmit KYC
                            </Button>
                        </Link>
                    )}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="p-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-semibold">KYC Status</h2>
                                {getStatusBadge(kycVerification.status)}
                            </div>

                            {kycVerification.status === 'rejected' && kycVerification.rejection_reason && (
                                <div className="bg-destructive/10 p-4 rounded-lg">
                                    <h3 className="font-medium text-destructive">Rejection Reason</h3>
                                    <p className="text-destructive">{kycVerification.rejection_reason}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div>
                                    <h3 className="font-medium">Submission Date</h3>
                                    <p className="text-muted-foreground">
                                        {new Date(kycVerification.submitted_at).toLocaleDateString()}
                                    </p>
                                </div>

                                {kycVerification.verified_at && (
                                    <div>
                                        <h3 className="font-medium">Verification Date</h3>
                                        <p className="text-muted-foreground">
                                            {new Date(kycVerification.verified_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-2xl font-semibold">Personal Information</h2>
                                <p className="text-muted-foreground">Your submitted details</p>
                            </div>

                            <div className="space-y-2">
                                <div>
                                    <h3 className="font-medium">Full Name</h3>
                                    <p className="text-muted-foreground">{kycVerification.full_name}</p>
                                </div>

                                <div>
                                    <h3 className="font-medium">Date of Birth</h3>
                                    <p className="text-muted-foreground">
                                        {new Date(kycVerification.date_of_birth).toLocaleDateString()}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-medium">Contact Information</h3>
                                    <p className="text-muted-foreground">{kycVerification.phone_number}</p>
                                    <p className="text-muted-foreground">{kycVerification.email}</p>
                                </div>

                                <div>
                                    <h3 className="font-medium">Address</h3>
                                    <p className="text-muted-foreground">{kycVerification.address_line_1}</p>
                                    {kycVerification.address_line_2 && (
                                        <p className="text-muted-foreground">{kycVerification.address_line_2}</p>
                                    )}
                                    <p className="text-muted-foreground">
                                        {kycVerification.city}, {kycVerification.state_province} {kycVerification.postal_code}
                                    </p>
                                    <p className="text-muted-foreground">{kycVerification.country}</p>
                                </div>

                                <div>
                                    <h3 className="font-medium">ID Information</h3>
                                    <p className="text-muted-foreground">Type: {ID_TYPE_MAP[kycVerification.id_type]}</p>
                                    <p className="text-muted-foreground">Number: {kycVerification.id_number}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold">ID Documents</h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <h3 className="font-medium">Front of {ID_TYPE_MAP[kycVerification.id_type]}</h3>
                                    <div 
                                        className="relative aspect-video w-full overflow-hidden rounded-lg border cursor-pointer"
                                        onClick={() => setSelectedImage(kycVerification.id_document_front)}
                                    >
                                        {kycVerification.id_document_front.endsWith('.pdf') ? (
                                            <iframe
                                                src={`storage/${kycVerification.id_document_front}`}
                                                className="h-full w-full"
                                                title="Front Document"
                                            />
                                        ) : (
                                            <img
                                                src={`storage/${kycVerification.id_document_front}`}
                                                alt="Front of ID Document"
                                                className="h-full w-full object-cover"
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-medium">Back of {ID_TYPE_MAP[kycVerification.id_type]}</h3>
                                    <div 
                                        className="relative aspect-video w-full overflow-hidden rounded-lg border cursor-pointer"
                                        onClick={() => setSelectedImage(kycVerification.id_document_back)}
                                    >
                                        {kycVerification.id_document_back.endsWith('.pdf') ? (
                                            <iframe
                                                src={`storage/${kycVerification.id_document_back}`}
                                                className="h-full w-full"
                                                title="Back Document"
                                            />
                                        ) : (
                                            <img
                                                src={`storage/${kycVerification.id_document_back}`}
                                                alt="Back of ID Document"
                                                className="h-full w-full object-cover"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                    <DialogContent className="max-w-4xl">
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-2"
                                onClick={() => setSelectedImage(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            {selectedImage?.endsWith('.pdf') ? (
                                <iframe
                                    src={`storage/${selectedImage}`}
                                    className="w-full h-[80vh]"
                                    title="Document"
                                />
                            ) : (
                                <img
                                    src={`storage/${selectedImage}`}
                                    alt="Document"
                                    className="w-full h-auto max-h-[80vh] object-contain"
                                />
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
} 