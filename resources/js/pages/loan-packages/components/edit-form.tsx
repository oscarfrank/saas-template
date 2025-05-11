import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EditFormProps {
    onSubmit: (e: React.FormEvent) => void;
    processing: boolean;
    errors: Record<string, string>;
    fields: {
        name: string;
        type: 'text' | 'number' | 'file' | 'textarea' | 'select' | 'checkbox' | 'datetime';
        label: string;
        required?: boolean;
        accept?: string;
        options?: Array<{ value: string; label: string }>;
        defaultValue?: any;
        colSpan?: number;
    }[];
    entityName: string;
    data: Record<string, any>;
    setData: (key: string, value: any) => void;
}

export function EditForm({ fields, entityName, onSubmit, processing, errors, data, setData }: EditFormProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setData(name, type === 'number' ? Number(value) : value);
    };

    const handleSelectChange = (name: string, value: string) => {
        setData(name, value);
    };

    const handleCheckboxChange = (name: string, checked: boolean) => {
        setData(name, checked);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            setData(name, files[0]);
        }
    };

    const handleDateChange = (name: string, date: Date | undefined) => {
        setData(name, date ? format(date, 'yyyy-MM-dd') : '');
    };

    const renderField = (field: EditFormProps['fields'][0]) => {
        const commonProps = {
            id: field.name,
            name: field.name,
            required: field.required,
            className: cn(errors[field.name] ? 'border-red-500' : ''),
        };

        if (field.type === 'textarea') {
            return (
                <Textarea
                    {...commonProps}
                    value={data[field.name] || ''}
                    onChange={handleChange}
                />
            );
        }

        if (field.type === 'select') {
            return (
                <Select
                    value={data[field.name] || ''}
                    onValueChange={(value) => handleSelectChange(field.name, value)}
                >
                    <SelectTrigger className={commonProps.className}>
                        <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                        {field.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }

        if (field.type === 'checkbox') {
            return (
                <Checkbox
                    {...commonProps}
                    checked={data[field.name] || false}
                    onCheckedChange={(checked) => handleCheckboxChange(field.name, checked as boolean)}
                />
            );
        }

        if (field.type === 'file') {
            return (
                <Input
                    {...commonProps}
                    type="file"
                    onChange={handleFileChange}
                    accept={field.accept}
                />
            );
        }

        if (field.type === 'datetime') {
            return (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !data[field.name] && "text-muted-foreground",
                                commonProps.className
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {data[field.name] ? format(new Date(data[field.name]), 'PPP') : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={data[field.name] ? new Date(data[field.name]) : undefined}
                            onSelect={(date) => handleDateChange(field.name, date)}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            );
        }

        return (
            <Input
                {...commonProps}
                type={field.type}
                value={data[field.name] || ''}
                onChange={handleChange}
            />
        );
    };

    return (
        <Card className="p-6">
            <form onSubmit={onSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {fields.map((field) => (
                        <div 
                            key={field.name} 
                            className={cn(
                                "space-y-2",
                                field.colSpan === 2 && "md:col-span-2",
                                field.colSpan === 3 && "md:col-span-2 lg:col-span-3"
                            )}
                        >
                            <Label htmlFor={field.name}>
                                {field.label}
                                {field.required && <span className="text-red-500">*</span>}
                            </Label>
                            {renderField(field)}
                            {errors[field.name] && (
                                <p className="text-sm text-red-500">{errors[field.name]}</p>
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-end">
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Processing...' : `Submit ${entityName}`}
                    </Button>
                </div>
            </form>
        </Card>
    );
} 