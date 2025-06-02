import { useForm } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { type Product } from '@/types';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTenantRouter } from '@/hooks/use-tenant-router';


interface EditFormProps {
    entity?: Product;
    onSubmit: (formData: FormData) => void;
    processing: boolean;
    errors: Record<string, string>;
    fields: {
        name: string;
        type: 'text' | 'number' | 'file' | 'textarea';
        label: string;
        required?: boolean;
        accept?: string;
    }[];
    entityName: string;
}

interface ProductFormData {
    [key: string]: string | File | undefined;
    name: string;
    description: string;
    price: string;
    image?: File;
}

export function EditForm({ entity, onSubmit, processing, errors, fields, entityName }: EditFormProps) {
    const tenantRouter = useTenantRouter();
    const { data, setData, post, put } = useForm<ProductFormData>({
        name: entity?.name ?? '',
        description: entity?.description ?? '',
        price: entity?.price.toString() ?? '',
        image: undefined,
    });
    const [imagePreview, setImagePreview] = useState<string | null>(entity?.featured_image ?? null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description);
        formData.append('price', data.price);
        if (data.image) {
            formData.append('image', data.image);
        }
        
        if (entity) {
            formData.append('_method', 'PUT');
            put(tenantRouter.route('products.update', { product: entity.id }), {
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
            post(tenantRouter.route('products.store'), {
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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('image', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setData('image', undefined);
        setImagePreview(null);
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
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
                                ) : (
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        type={field.type}
                                        step={field.type === 'number' ? '0.01' : undefined}
                                        accept={field.accept}
                                        value={field.type === 'file' ? undefined : (value as string)}
                                        onChange={(e) => {
                                            if (field.type === 'file') {
                                                handleImageChange(e as React.ChangeEvent<HTMLInputElement>);
                                            } else {
                                                setData(field.name, e.target.value);
                                            }
                                        }}
                                        className="mt-1"
                                        required={field.required}
                                    />
                                )}
                                {errors[field.name] && (
                                    <p className="mt-1 text-sm text-red-500">{errors[field.name]}</p>
                                )}
                                {field.type === 'file' && imagePreview && (
                                    <div className="mt-2">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="h-32 w-32 object-cover rounded"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleRemoveImage}
                                            className="mt-2"
                                        >
                                            Remove Image
                                        </Button>
                                    </div>
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