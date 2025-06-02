import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { type Tenant } from './table-columns';

interface Field {
    name: string;
    type: 'text' | 'textarea' | 'number' | 'file';
    label: string;
    required?: boolean;
    accept?: string;
}

interface EditFormProps {
    fields: Field[];
    entityName: string;
    onSubmit: (formData: Record<string, string>) => void;
    processing: boolean;
    errors: Record<string, string>;
    initialData?: Partial<Tenant>;
}

export function EditForm({ fields, entityName, onSubmit, processing, errors, initialData = {} }: EditFormProps) {
    const { data, setData } = useForm<Record<string, string>>(
        fields.reduce((acc, field) => ({
            ...acc,
            [field.name]: initialData[field.name as keyof Tenant] || ''
        }), {})
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
                <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <Input
                        id={field.name}
                        value={data[field.name]}
                        onChange={(e) => setData(field.name, e.target.value)}
                        required={field.required}
                    />
                    {errors[field.name] && (
                        <p className="text-sm text-red-500">{errors[field.name]}</p>
                    )}
                </div>
            ))}

            <Button type="submit" disabled={processing}>
                {processing ? 'Saving...' : initialData.id ? 'Update' : 'Create'} {entityName}
            </Button>
        </form>
    );
} 