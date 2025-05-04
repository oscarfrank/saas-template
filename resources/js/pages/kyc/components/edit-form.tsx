import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { toast } from 'sonner';

interface EditFormProps {
    fields: {
        name: string;
        type: 'text' | 'number' | 'file' | 'textarea' | 'select' | 'custom';
        label: string;
        required?: boolean;
        accept?: string;
        options?: { value: string; label: string }[];
        defaultValue?: any;
        render?: (props: { onChange: (value: any) => void }) => React.ReactNode;
    }[];
    entityName: string;
    onSubmit: (formData: FormData) => void;
    processing?: boolean;
    errors?: Record<string, string>;
}

export function EditForm({ fields, entityName, onSubmit, processing = false, errors = {} }: EditFormProps) {
    const [formData, setFormData] = useState<Record<string, any>>(() => {
        const initialData: Record<string, any> = {};
        fields.forEach(field => {
            if (field.defaultValue !== undefined) {
                initialData[field.name] = field.defaultValue;
            }
        });
        return initialData;
    });
    const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formDataObj = new FormData();
        
        // Include all form data, including default values
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formDataObj.append(key, value);
            }
        });
        
        onSubmit(formDataObj);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            setFormData((prev) => ({ ...prev, [name]: files[0] }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreviews((prev) => ({ ...prev, [name]: reader.result as string }));
            };
            reader.readAsDataURL(files[0]);
        }
    };

    const handleRemoveFile = (name: string) => {
        setFormData((prev) => {
            const newData = { ...prev };
            delete newData[name];
            return newData;
        });
        setFilePreviews((prev) => {
            const newPreviews = { ...prev };
            delete newPreviews[name];
            return newPreviews;
        });
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCustomChange = (name: string, value: any) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
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
                        {field.type === 'textarea' ? (
                            <Textarea
                                id={field.name}
                                name={field.name}
                                value={formData[field.name] || ''}
                                onChange={handleChange}
                                required={field.required}
                                className={errors[field.name] ? 'border-red-500' : ''}
                            />
                        ) : field.type === 'select' ? (
                            <Select
                                value={formData[field.name] || ''}
                                onValueChange={(value) => handleSelectChange(field.name, value)}
                            >
                                <SelectTrigger className={errors[field.name] ? 'border-red-500' : ''}>
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
                        ) : field.type === 'file' ? (
                            <div className="space-y-2">
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    type="file"
                                    onChange={handleFileChange}
                                    accept={field.accept}
                                    required={field.required}
                                    className={errors[field.name] ? 'border-red-500' : ''}
                                />
                                {filePreviews[field.name] && (
                                    <div className="flex items-center space-x-2">
                                        <img
                                            src={filePreviews[field.name]}
                                            alt="Preview"
                                            className="h-20 w-20 object-cover"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleRemoveFile(field.name)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : field.type === 'custom' && field.render ? (
                            field.render({ onChange: (value) => handleCustomChange(field.name, value) })
                        ) : (
                            <Input
                                id={field.name}
                                name={field.name}
                                type={field.type}
                                value={formData[field.name] || ''}
                                onChange={handleChange}
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
                        {processing ? 'Processing...' : `Submit ${entityName}`}
                    </Button>
                </div>
            </form>
        </Card>
    );
} 