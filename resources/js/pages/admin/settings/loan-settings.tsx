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
        title: 'Loan Settings',
        href: route('admin.settings.loan'),
    },
];

interface LoanSetting {
    id: number;
    key: string;
    value: string;
    type: 'boolean' | 'string' | 'integer' | 'json';
    group: 'general' | 'borrower' | 'lender';
    description: string;
    is_public: boolean;
}

interface FormData {
    settings: LoanSetting[];
    [key: string]: any;
}

interface Props {
    settings: {
        [key: string]: LoanSetting[];
    };
}

export default function LoanSettings({ settings }: Props) {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        settings: Object.values(settings).flat(),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.settings.loan.update'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Loan settings updated successfully');
            },
            onError: () => {
                toast.error('Failed to update loan settings');
            },
        });
    };

    const handleSettingChange = (index: number, value: any) => {
        const updatedSettings = [...data.settings];
        const setting = updatedSettings[index];
        
        // Convert boolean values to string 'true'/'false' for the API
        const newValue = setting.type === 'boolean' 
            ? (value ? 'true' : 'false')
            : value;

        updatedSettings[index] = {
            ...setting,
            value: newValue,
        };
        setData('settings', updatedSettings);
    };

    const renderSettingInput = (setting: LoanSetting, index: number) => {
        const errorKey = `settings.${index}.value`;
        const error = errors[errorKey];

        switch (setting.type) {
            case 'boolean':
                return (
                    <div className="flex items-center space-x-2">
                        <Switch
                            id={`setting-${setting.id}`}
                            checked={setting.value === 'true'}
                            onCheckedChange={(checked) => handleSettingChange(index, checked)}
                        />
                        <Label htmlFor={`setting-${setting.id}`}>{setting.description}</Label>
                    </div>
                );
            case 'integer':
                return (
                    <div>
                        <Label htmlFor={`setting-${setting.id}`}>{setting.description}</Label>
                        <Input
                            id={`setting-${setting.id}`}
                            type="number"
                            value={setting.value}
                            onChange={(e) => handleSettingChange(index, e.target.value)}
                            className={error ? 'border-red-500' : ''}
                        />
                        {error && (
                            <p className="text-red-500 text-sm mt-1">{error}</p>
                        )}
                    </div>
                );
            default:
                return (
                    <div>
                        <Label htmlFor={`setting-${setting.id}`}>{setting.description}</Label>
                        <Input
                            id={`setting-${setting.id}`}
                            value={setting.value}
                            onChange={(e) => handleSettingChange(index, e.target.value)}
                            className={error ? 'border-red-500' : ''}
                        />
                        {error && (
                            <p className="text-red-500 text-sm mt-1">{error}</p>
                        )}
                    </div>
                );
        }
    };

    const renderSettingsGroup = (group: string) => {
        const groupSettings = data.settings.filter((setting) => setting.group === group);
        
        return (
            <div className="space-y-6">
                {groupSettings.map((setting, index) => (
                    <div key={setting.id} className="p-4 border rounded-lg">
                        {renderSettingInput(setting, index)}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Loan Settings" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <form onSubmit={handleSubmit}>
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="general">General Settings</TabsTrigger>
                            <TabsTrigger value="borrower">Borrower Settings</TabsTrigger>
                            <TabsTrigger value="lender">Lender Settings</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general">
                            <Card>
                                <CardHeader>
                                    <CardTitle>General Loan Settings</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {renderSettingsGroup('general')}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="borrower">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Borrower Settings</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {renderSettingsGroup('borrower')}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="lender">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Lender Settings</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {renderSettingsGroup('lender')}
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