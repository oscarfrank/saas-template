import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { EditForm } from './components/edit-form';
import { useState } from 'react';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

import { useTenantRouter } from '@/hooks/use-tenant-router';

const ID_TYPE_MAP: Record<string, string> = {
    'passport': 'Passport',
    'national_id': 'National ID Card',
    'drivers_license': "Driver's License"
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'KYC',
        href: '/kyc',
    },
    {
        title: 'Submit KYC',
        href: '/kyc/submit',
    },
];

interface Props {
    existingKyc?: {
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
    };
}

export default function Create({ existingKyc }: Props) {
    const tenantRouter = useTenantRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
        existingKyc?.date_of_birth ? new Date(existingKyc.date_of_birth) : undefined
    );
    const [year, setYear] = useState<number>(
        existingKyc?.date_of_birth ? new Date(existingKyc.date_of_birth).getFullYear() : new Date().getFullYear()
    );
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

    const fields = [
        { 
            name: 'full_name', 
            type: 'text' as const, 
            label: 'Full Name', 
            required: true,
            defaultValue: existingKyc?.full_name 
        },
        { 
            name: 'date_of_birth', 
            type: 'custom' as const, 
            label: 'Date of Birth', 
            required: true,
            defaultValue: existingKyc?.date_of_birth,
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
            defaultValue: existingKyc?.phone_number 
        },
        { 
            name: 'address_line_1', 
            type: 'text' as const, 
            label: 'Address Line 1', 
            required: true,
            defaultValue: existingKyc?.address_line_1 
        },
        { 
            name: 'address_line_2', 
            type: 'text' as const, 
            label: 'Address Line 2', 
            required: false,
            defaultValue: existingKyc?.address_line_2 
        },
        { 
            name: 'city', 
            type: 'text' as const, 
            label: 'City', 
            required: true,
            defaultValue: existingKyc?.city 
        },
        { 
            name: 'state_province', 
            type: 'text' as const, 
            label: 'State/Province', 
            required: true,
            defaultValue: existingKyc?.state_province 
        },
        { 
            name: 'postal_code', 
            type: 'text' as const, 
            label: 'Postal Code', 
            required: true,
            defaultValue: existingKyc?.postal_code 
        },
        { 
            name: 'country', 
            type: 'text' as const, 
            label: 'Country', 
            required: true,
            defaultValue: existingKyc?.country 
        },
        { 
            name: 'id_type', 
            type: 'select' as const, 
            label: 'ID Type', 
            required: true,
            defaultValue: existingKyc?.id_type,
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
            defaultValue: existingKyc?.id_number 
        },
        { name: 'id_document_front', type: 'file' as const, label: 'ID Document Front', required: true, accept: 'image/*,.pdf' },
        { name: 'id_document_back', type: 'file' as const, label: 'ID Document Back', required: true, accept: 'image/*,.pdf' },
    ];

    const handleSubmit = (formData: FormData) => {
        setIsProcessing(true);
        setErrors({});

        // Log the form data before submission
        const formDataObj = new FormData();
        for (const [key, value] of formData.entries()) {
            formDataObj.append(key, value);
            console.log(`Form data - ${key}:`, value);
        }

        router.post(tenantRouter.route('kyc.store'), formDataObj, {
            onSuccess: () => {
                toast.success('KYC verification submitted successfully');
                router.visit(tenantRouter.route('kyc.show'), { preserveScroll: true });
                window.location.reload();
            },
            onError: (errors) => {
                console.log('Form submission errors:', errors);
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Submit KYC" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>KYC Verification Required</AlertTitle>
                    <AlertDescription>
                        <div className="mt-2 space-y-2">
                            <p>
                                To access all features of the platform, you need to complete your KYC verification. 
                                This includes:
                            </p>
                            <ul className="list-inside list-disc">
                                <li>Making investments</li>
                                <li>Withdrawing funds</li>
                                <li>Accessing premium features</li>
                            </ul>
                            <p className="mt-2">
                                Please complete the form below to submit your KYC documents. 
                                Your verification will be reviewed within 24-48 hours.
                            </p>
                        </div>
                    </AlertDescription>
                </Alert>

                <div className="flex justify-end">
                    <Link href={tenantRouter.route('dashboard')}>
                        <Button variant="outline" className="cursor-pointer">
                            Cancel
                        </Button>
                    </Link>
                </div>
                <EditForm
                    fields={fields}
                    entityName="kyc"
                    onSubmit={handleSubmit}
                    processing={isProcessing}
                    errors={errors}
                />
            </div>
        </AppLayout>
    );
}
