import { useForm } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { type Loan } from './table-columns';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

interface EditFormProps {
    entity?: Loan;
    onSubmit: (formData: FormData) => void;
    processing: boolean;
    errors: Record<string, string>;
    fields: {
        name: string;
        type: 'text' | 'number' | 'file' | 'textarea' | 'select' | 'date';
        label: string;
        required?: boolean;
        accept?: string;
        options?: Array<{ value: string; label: string }>;
        optionLabel?: string;
        optionValue?: string;
        min?: number;
        step?: number;
        defaultValue?: string;
    }[];
    entityName: string;
    availableUsers?: Array<{ 
        id: number; 
        first_name: string; 
        last_name: string; 
        email: string; 
    }>;
}

interface LoanFormData {
    [key: string]: string | File | undefined;
    user_id: string;
    package_id: string;
    custom_package_id?: string;
    amount: string;
    currency_id: string;
    interest_rate: string;
    interest_type: string;
    interest_calculation: string;
    interest_payment_frequency: string;
    duration_days: string;
    purpose?: string;
    start_date: string;
    end_date: string;
    status: string;
}

export function EditForm({ entity, onSubmit, processing, errors, fields, entityName, availableUsers }: EditFormProps) {
    const { data, setData, post, put } = useForm<LoanFormData>({
        user_id: entity?.user?.id.toString() ?? '',
        package_id: entity?.package?.id.toString() ?? '',
        custom_package_id: entity?.custom_package?.id.toString() ?? '',
        amount: entity?.amount.toString() ?? '',
        currency_id: entity?.currency?.id.toString() ?? '',
        interest_rate: entity?.interest_rate.toString() ?? '',
        interest_type: entity?.interest_type ?? 'simple',
        interest_calculation: entity?.interest_calculation ?? 'monthly',
        interest_payment_frequency: entity?.interest_payment_frequency ?? 'monthly',
        duration_days: entity?.duration_days.toString() ?? '',
        purpose: entity?.purpose ?? '',
        start_date: entity?.start_date ?? '',
        end_date: entity?.end_date ?? '',
        status: entity?.status ?? 'pending',
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                formData.append(key, value);
            }
        });
        
        if (entity) {
            formData.append('_method', 'PUT');
            put(route('loans.update', entity.id), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`${entityName} updated successfully`);
                },
                onError: (errors) => {
                    Object.values(errors).forEach((error) => {
                        toast.error(error);
                    });
                },
            });
        } else {
            post(route('loans.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`${entityName} created successfully`);
                },
                onError: (errors) => {
                    Object.values(errors).forEach((error) => {
                        toast.error(error);
                    });
                },
            });
        }
    };

    return (
        <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    {fields.map((field) => {
                        const value = data[field.name];
                        const defaultValue = field.type === 'file' ? undefined : (value ?? '');

                        return (
                            <div key={field.name}>
                                <Label htmlFor={field.name}>
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </Label>
                                {field.type === 'textarea' ? (
                                    <Textarea
                                        id={field.name}
                                        name={field.name}
                                        value={value as string}
                                        onChange={(e) => setData(field.name, e.target.value)}
                                        className="mt-1"
                                        required={field.required}
                                    />
                                ) : field.type === 'select' ? (
                                    <Select
                                        value={field.defaultValue || value as string}
                                        onValueChange={(value) => setData(field.name, value)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder={`Select ${field.label}`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {field.name === 'user_id' && availableUsers ? (
                                                availableUsers.map((user) => (
                                                    <SelectItem key={user.id} value={user.id.toString()}>
                                                        {`${user.first_name} ${user.last_name}`}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                field.options?.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                ) : field.type === 'date' ? (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal mt-1",
                                                    !value && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {value ? format(new Date(value as string), "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={value ? new Date(value as string) : undefined}
                                                onSelect={(date) => setData(field.name, date?.toISOString() ?? '')}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                ) : (
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        type={field.type}
                                        min={field.min}
                                        step={field.step}
                                        accept={field.accept}
                                        value={field.type === 'file' ? undefined : (value as string)}
                                        onChange={(e) => setData(field.name, e.target.value)}
                                        className="mt-1"
                                        required={field.required}
                                    />
                                )}
                                {errors[field.name] && (
                                    <p className="mt-1 text-sm text-red-500">{errors[field.name]}</p>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={processing} className="cursor-pointer">
                        {entity ? 'Update' : 'Create'} {entityName.charAt(0).toUpperCase() + entityName.slice(1)}
                    </Button>
                </div>
            </form>
        </Card>
    );
} 