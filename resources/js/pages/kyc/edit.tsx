import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EditForm } from './components/edit-form';
import { useState } from 'react';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Check, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RejectDialog } from './components/reject-dialog';

const ID_TYPE_MAP: Record<string, string> = {
    'passport': 'Passport',
    'national_id': 'National ID Card',
    'drivers_license': "Driver's License"
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/dashboard/admin',
    },
    {
        title: 'KYC Management',
        href: '/admin/kyc',
    },
    {
        title: 'Edit KYC',
        href: '#',
    },
];

interface Props {
    kyc: {
        id: number;
        full_name: string;
        date_of_birth: string;
        phone_number: string;
        address_line_1: string;
        address_line_2: string | null;
        city: string;
        state_province: string;
        postal_code: string;
        country: string;
        id_type: string;
        id_number: string;
        id_document_front: string;
        id_document_back: string;
        status: 'pending' | 'approved' | 'rejected';
        rejection_reason: string | null;
        submitted_at: string;
        verified_at: string | null;
    };
}

export default function Edit({ kyc }: Props) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
        kyc.date_of_birth ? new Date(kyc.date_of_birth) : undefined
    );
    const [year, setYear] = useState<number>(
        kyc.date_of_birth ? new Date(kyc.date_of_birth).getFullYear() : new Date().getFullYear()
    );
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

    const fields = [
        { 
            name: 'full_name', 
            type: 'text' as const, 
            label: 'Full Name', 
            required: true,
            defaultValue: kyc.full_name 
        },
        { 
            name: 'date_of_birth', 
            type: 'custom' as const, 
            label: 'Date of Birth', 
            required: true,
            defaultValue: kyc.date_of_birth,
            render: (props: any) => (
                <div className="space-y-2">
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !dateOfBirth && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateOfBirth ? format(dateOfBirth, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-3">
                                <Select
                                    value={year.toString()}
                                    onValueChange={(value) => {
                                        const newYear = parseInt(value);
                                        setYear(newYear);
                                        if (dateOfBirth) {
                                            const newDate = new Date(dateOfBirth);
                                            newDate.setFullYear(newYear);
                                            setDateOfBirth(newDate);
                                            props.onChange(newDate.toISOString().split('T')[0]);
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map((year) => (
                                            <SelectItem key={year} value={year.toString()}>
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Calendar
                                mode="single"
                                selected={dateOfBirth}
                                onSelect={(date) => {
                                    if (date) {
                                        const newDate = new Date(date);
                                        newDate.setFullYear(year);
                                        setDateOfBirth(newDate);
                                        props.onChange(newDate.toISOString().split('T')[0]);
                                        setIsCalendarOpen(false);
                                    }
                                }}
                                initialFocus
                                fromYear={new Date().getFullYear() - 100}
                                toYear={new Date().getFullYear()}
                                defaultMonth={dateOfBirth || new Date(year, 0, 1)}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            )
        },
        { 
            name: 'phone_number', 
            type: 'text' as const, 
            label: 'Phone Number', 
            required: true,
            defaultValue: kyc.phone_number 
        },
        { 
            name: 'address_line_1', 
            type: 'text' as const, 
            label: 'Address Line 1', 
            required: true,
            defaultValue: kyc.address_line_1 
        },
        { 
            name: 'address_line_2', 
            type: 'text' as const, 
            label: 'Address Line 2', 
            required: false,
            defaultValue: kyc.address_line_2 
        },
        { 
            name: 'city', 
            type: 'text' as const, 
            label: 'City', 
            required: true,
            defaultValue: kyc.city 
        },
        { 
            name: 'state_province', 
            type: 'text' as const, 
            label: 'State/Province', 
            required: true,
            defaultValue: kyc.state_province 
        },
        { 
            name: 'postal_code', 
            type: 'text' as const, 
            label: 'Postal Code', 
            required: true,
            defaultValue: kyc.postal_code 
        },
        { 
            name: 'country', 
            type: 'text' as const, 
            label: 'Country', 
            required: true,
            defaultValue: kyc.country 
        },
        { 
            name: 'id_type', 
            type: 'select' as const, 
            label: 'ID Type', 
            required: true,
            defaultValue: kyc.id_type,
            options: [
                { value: 'passport', label: ID_TYPE_MAP['passport'] },
                { value: 'national_id', label: ID_TYPE_MAP['national_id'] },
                { value: 'drivers_license', label: ID_TYPE_MAP['drivers_license'] },
            ]
        },
        { 
            name: 'id_number', 
            type: 'text' as const, 
            label: 'ID Number', 
            required: true,
            defaultValue: kyc.id_number 
        },
        { name: 'id_document_front', type: 'file' as const, label: 'ID Document Front', required: true, accept: 'image/*,.pdf' },
        { name: 'id_document_back', type: 'file' as const, label: 'ID Document Back', required: true, accept: 'image/*,.pdf' },
    ];

    const handleSubmit = (formData: FormData) => {
        setIsProcessing(true);
        setErrors({});

        router.post(route('kyc.update', kyc.id), formData, {
            onSuccess: () => {
                toast.success('KYC verification updated successfully');
                router.visit(route('kyc.show', kyc.id));
            },
            onError: (errors) => {
                setErrors(errors);
                Object.values(errors).forEach((error) => {
                    toast.error(error);
                });
            },
            onFinish: () => {
                setIsProcessing(false);
            },
        });
    };

    const handleApprove = async () => {
        setIsProcessing(true);
        setErrors({});

        try {
            await router.put(route('kyc.update', kyc.id), {
                status: 'approved',
            });

            toast.success('KYC approved successfully');
            router.visit(route('kyc.index'));
        } catch (error) {
            setErrors({ status: 'Failed to approve KYC' });
            toast.error('Failed to approve KYC');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async (reason: string) => {
        setIsProcessing(true);
        setErrors({});

        try {
            await router.put(route('kyc.update', kyc.id), {
                status: 'rejected',
                rejection_reason: reason,
            });

            toast.success('KYC rejected successfully');
            router.visit(route('kyc.index'));
        } catch (error) {
            setErrors({ status: 'Failed to reject KYC' });
            toast.error('Failed to reject KYC');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRevert = async () => {
        setIsProcessing(true);
        setErrors({});

        try {
            await router.put(route('kyc.update', kyc.id), {
                status: 'pending',
                rejection_reason: null,
            });

            toast.success('KYC status reverted to pending');
            router.visit(route('kyc.index'));
        } catch (error) {
            setErrors({ status: 'Failed to revert KYC status' });
            toast.error('Failed to revert KYC status');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit KYC" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <Link href={route('kyc.index')}>
                        <Button variant="outline">Back to KYC Management</Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        {kyc.status === 'pending' && (
                            <>
                                <Button
                                    variant="default"
                                    onClick={handleApprove}
                                    disabled={isProcessing}
                                >
                                    <Check className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setIsRejectDialogOpen(true)}
                                    disabled={isProcessing}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                            </>
                        )}
                        {(kyc.status === 'approved' || kyc.status === 'rejected') && (
                            <Button
                                variant="outline"
                                onClick={handleRevert}
                                disabled={isProcessing}
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Revert to Pending
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <EditForm
                        fields={fields}
                        entityName="KYC"
                        onSubmit={handleSubmit}
                        processing={isProcessing}
                        errors={errors}
                    />

                    <Card className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-semibold">Current Documents</h2>
                                <Badge
                                    variant={kyc.status === 'approved' ? 'default' : kyc.status === 'rejected' ? 'destructive' : 'secondary'}
                                >
                                    {kyc.status}
                                </Badge>
                            </div>
                            {kyc.rejection_reason && (
                                <div className="rounded-lg border p-4 bg-destructive/10">
                                    <h3 className="font-medium text-destructive">Rejection Reason</h3>
                                    <p className="mt-1 text-sm">{kyc.rejection_reason}</p>
                                </div>
                            )}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <h3 className="font-medium">Front of {ID_TYPE_MAP[kyc.id_type]}</h3>
                                    <div 
                                        className="relative aspect-video w-full overflow-hidden rounded-lg border cursor-pointer"
                                        onClick={() => setSelectedImage(kyc.id_document_front)}
                                    >
                                        {kyc.id_document_front.endsWith('.pdf') ? (
                                            <iframe
                                                src={`/storage/${kyc.id_document_front}`}
                                                className="h-full w-full"
                                                title="Front Document"
                                            />
                                        ) : (
                                            <img
                                                src={`/storage/${kyc.id_document_front}`}
                                                alt="Front of ID Document"
                                                className="h-full w-full object-cover"
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-medium">Back of {ID_TYPE_MAP[kyc.id_type]}</h3>
                                    <div 
                                        className="relative aspect-video w-full overflow-hidden rounded-lg border cursor-pointer"
                                        onClick={() => setSelectedImage(kyc.id_document_back)}
                                    >
                                        {kyc.id_document_back.endsWith('.pdf') ? (
                                            <iframe
                                                src={`/storage/${kyc.id_document_back}`}
                                                className="h-full w-full"
                                                title="Back Document"
                                            />
                                        ) : (
                                            <img
                                                src={`/storage/${kyc.id_document_back}`}
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
                                    src={`/storage/${selectedImage}`}
                                    className="w-full h-[80vh]"
                                    title="Document"
                                />
                            ) : (
                                <img
                                    src={`/storage/${selectedImage}`}
                                    alt="Document"
                                    className="w-full h-auto max-h-[80vh] object-contain"
                                />
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                <RejectDialog
                    isOpen={isRejectDialogOpen}
                    onClose={() => setIsRejectDialogOpen(false)}
                    onConfirm={handleReject}
                    isLoading={isProcessing}
                />
            </div>
        </AppLayout>
    );
} 