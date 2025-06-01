import { useForm } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TenantFormData extends Record<string, any> {
    name: string;
    slug: string;
}

interface EditFormProps {
    onSubmit: (formData: FormData) => void;
    processing: boolean;
    errors: Record<string, string>;
    fields: {
        name: 'name' | 'slug';
        type: 'text' | 'number' | 'file' | 'textarea';
        label: string;
        required?: boolean;
        accept?: string;
    }[];
    entityName: string;
}

export function EditForm({ fields, entityName, onSubmit, processing = false, errors = {} }: EditFormProps) {
    const { data, setData, post } = useForm<TenantFormData>({
        name: '',
        slug: '',
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('slug', data.slug);
        
        post(route('tenant.store'), {
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
    };

    return (
        <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                {fields.map((field) => (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        {field.name === 'slug' ? (
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-500">yourdomain.com/</span>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    type={field.type}
                                    value={data[field.name]}
                                    onChange={(e) => setData(field.name, e.target.value)}
                                    required={field.required}
                                    className={errors[field.name] ? 'border-red-500' : ''}
                                />
                            </div>
                        ) : (
                            <Input
                                id={field.name}
                                name={field.name}
                                type={field.type}
                                value={data[field.name]}
                                onChange={(e) => setData(field.name, e.target.value)}
                                required={field.required}
                                className={errors[field.name] ? 'border-red-500' : ''}
                            />
                        )}
                        {errors[field.name] && (
                            <p className="text-sm text-red-500">{errors[field.name]}</p>
                        )}
                    </div>
                ))}
                <div className="flex justify-end">
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Processing...' : `Create ${entityName}`}
                    </Button>
                </div>
            </form>
        </Card>
    );
} 