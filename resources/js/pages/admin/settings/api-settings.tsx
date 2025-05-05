import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: route('admin.dashboard'),
    },
    {
        title: 'Settings',
        href: route('admin.settings.system'),
    },
    {
        title: 'API Settings',
        href: route('admin.settings.api'),
    },
];

interface ApiSettings {
    id: number;
    name: string;
    type: 'payment' | 'ai' | 'email' | 'other';
    api_key: string;
    api_secret: string | null;
    webhook_url: string | null;
    is_active: boolean;
    is_default: boolean;
    additional_data: Record<string, any> | null;
}

interface FormData {
    [key: string]: any;
    apiSettings: ApiSettings[];
}

interface Props {
    apiSettings: ApiSettings[];
}

export default function ApiSettings({ apiSettings }: Props) {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        apiSettings: apiSettings || [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.settings.api.update'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('API settings updated successfully');
            },
            onError: () => {
                toast.error('Failed to update API settings');
            },
        });
    };

    const handleApiSettingChange = (index: number, field: keyof ApiSettings, value: any) => {
        const updatedSettings = [...(data.apiSettings || [])];
        const currentSetting = updatedSettings[index];
        
        // Create a new setting object with the updated field
        const newSetting = {
            ...currentSetting,
            [field]: value,
            // Ensure all required fields are preserved
            id: currentSetting.id,
            type: currentSetting.type,
            is_default: currentSetting.is_default,
            is_active: currentSetting.is_active,
            additional_data: currentSetting.additional_data
        };
        
        // Update the settings array
        updatedSettings[index] = newSetting;
        
        // Update the form data
        setData('apiSettings', updatedSettings);
    };

    const addNewApiSetting = (type: ApiSettings['type']) => {
        const newSetting: ApiSettings = {
            id: Date.now(), // Temporary ID for new entries
            name: '',
            type,
            api_key: '',
            api_secret: type === 'payment' ? '' : null,
            webhook_url: type === 'payment' ? '' : null,
            is_active: true,
            is_default: false,
            additional_data: null,
        };
        setData('apiSettings', [...(data.apiSettings || []), newSetting]);
    };

    const deleteApiSetting = (index: number) => {
        const setting = data.apiSettings[index];
        if (setting.is_default) {
            toast.error('Default APIs cannot be deleted');
            return;
        }
        const updatedSettings = [...(data.apiSettings || [])];
        updatedSettings.splice(index, 1);
        setData('apiSettings', updatedSettings);
    };

    const renderApiSettings = (type: ApiSettings['type']) => {
        const settings = (data.apiSettings || []).filter((setting: ApiSettings) => setting.type === type);
        
        return settings.map((setting: ApiSettings, index: number) => (
            <div key={setting.id} className="space-y-4 mb-6 p-4 border rounded-lg relative">
                {!setting.is_default && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => deleteApiSetting(index)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor={`name-${setting.id}`}>Name</Label>
                        <Input
                            id={`name-${setting.id}`}
                            value={setting.name}
                            onChange={(e) => handleApiSettingChange(index, 'name', e.target.value)}
                            className={errors[`apiSettings.${index}.name`] ? 'border-red-500' : ''}
                            disabled={setting.is_default}
                        />
                        {errors[`apiSettings.${index}.name`] && (
                            <p className="text-red-500 text-sm mt-1">{errors[`apiSettings.${index}.name`]}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor={`api_key-${setting.id}`}>API Key</Label>
                        <Input
                            id={`api_key-${setting.id}`}
                            type="password"
                            value={setting.api_key}
                            onChange={(e) => handleApiSettingChange(index, 'api_key', e.target.value)}
                            className={errors[`apiSettings.${index}.api_key`] ? 'border-red-500' : ''}
                        />
                        {errors[`apiSettings.${index}.api_key`] && (
                            <p className="text-red-500 text-sm mt-1">{errors[`apiSettings.${index}.api_key`]}</p>
                        )}
                    </div>
                </div>
                {type === 'payment' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor={`api_secret-${setting.id}`}>API Secret</Label>
                            <Input
                                id={`api_secret-${setting.id}`}
                                type="password"
                                value={setting.api_secret || ''}
                                onChange={(e) => handleApiSettingChange(index, 'api_secret', e.target.value)}
                                className={errors[`apiSettings.${index}.api_secret`] ? 'border-red-500' : ''}
                            />
                            {errors[`apiSettings.${index}.api_secret`] && (
                                <p className="text-red-500 text-sm mt-1">{errors[`apiSettings.${index}.api_secret`]}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor={`webhook_url-${setting.id}`}>Webhook URL</Label>
                            <Input
                                id={`webhook_url-${setting.id}`}
                                value={setting.webhook_url || ''}
                                onChange={(e) => handleApiSettingChange(index, 'webhook_url', e.target.value)}
                                className={errors[`apiSettings.${index}.webhook_url`] ? 'border-red-500' : ''}
                            />
                            {errors[`apiSettings.${index}.webhook_url`] && (
                                <p className="text-red-500 text-sm mt-1">{errors[`apiSettings.${index}.webhook_url`]}</p>
                            )}
                        </div>
                    </div>
                )}
                <div className="flex items-center space-x-2">
                    <Switch
                        id={`is_active-${setting.id}`}
                        checked={setting.is_active}
                        onCheckedChange={(checked) => handleApiSettingChange(index, 'is_active', checked)}
                    />
                    <Label htmlFor={`is_active-${setting.id}`}>Active</Label>
                </div>
            </div>
        ));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="API Settings" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <form onSubmit={handleSubmit}>
                    <Tabs defaultValue="payment" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="payment">Payment APIs</TabsTrigger>
                            <TabsTrigger value="ai">AI APIs</TabsTrigger>
                            <TabsTrigger value="email">Email APIs</TabsTrigger>
                            <TabsTrigger value="other">Other APIs</TabsTrigger>
                        </TabsList>

                        <TabsContent value="payment">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Payment APIs</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {renderApiSettings('payment')}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => addNewApiSetting('payment')}
                                    >
                                        Add Payment API
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="ai">
                            <Card>
                                <CardHeader>
                                    <CardTitle>AI APIs</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {renderApiSettings('ai')}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => addNewApiSetting('ai')}
                                    >
                                        Add AI API
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="email">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Email APIs</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {renderApiSettings('email')}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => addNewApiSetting('email')}
                                    >
                                        Add Email API
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="other">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Other APIs</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {renderApiSettings('other')}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => addNewApiSetting('other')}
                                    >
                                        Add Other API
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <div className="mt-6">
                        <Button type="submit" disabled={processing}>
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
} 