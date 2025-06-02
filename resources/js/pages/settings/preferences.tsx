import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Preferences',
        href: '/settings/preferences',
    },
];

type PreferencesForm = {
    language: string;
    timezone: string;
    date_format: string;
    time_format: string;
    email_notifications: boolean;
    marketing_emails: boolean;
    activity_visibility: 'public' | 'private' | 'connections';
}

const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
];

const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
];

const dateFormats = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const timeFormats = [
    { value: '12h', label: '12-hour' },
    { value: '24h', label: '24-hour' },
];

export default function Preferences() {
    const { auth } = usePage<SharedData>().props;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm<PreferencesForm>({
        language: 'en',
        timezone: 'UTC',
        date_format: 'MM/DD/YYYY',
        time_format: '12h',
        email_notifications: true,
        marketing_emails: false,
        activity_visibility: 'connections',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('preferences.update'), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Preferences" />

            <SettingsLayout>
                <div className="space-y-8">
                    <HeadingSmall title="Preferences" description="Manage your account preferences and settings" />

                    <form onSubmit={submit} className="space-y-8">
                        {/* Language and Timezone Section */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium">Language & Region</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Language</Label>
                                    <Select
                                        value={data.language}
                                        onValueChange={(value) => setData('language', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {languages.map((lang) => (
                                                <SelectItem key={lang.code} value={lang.code}>
                                                    {lang.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.language} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Timezone</Label>
                                    <Select
                                        value={data.timezone}
                                        onValueChange={(value) => setData('timezone', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select timezone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {timezones.map((tz) => (
                                                <SelectItem key={tz.value} value={tz.value}>
                                                    {tz.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.timezone} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Date Format</Label>
                                    <Select
                                        value={data.date_format}
                                        onValueChange={(value) => setData('date_format', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select date format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {dateFormats.map((format) => (
                                                <SelectItem key={format.value} value={format.value}>
                                                    {format.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.date_format} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Time Format</Label>
                                    <Select
                                        value={data.time_format}
                                        onValueChange={(value) => setData('time_format', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select time format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {timeFormats.map((format) => (
                                                <SelectItem key={format.value} value={format.value}>
                                                    {format.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.time_format} />
                                </div>
                            </div>
                        </div>

                        {/* Notifications Section */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium">Notifications</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Email Notifications</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receive email notifications about your account activity
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.email_notifications}
                                        onCheckedChange={(checked) => setData('email_notifications', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Marketing Emails</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receive emails about new features and updates
                                        </p>
                                    </div>
                                    <Switch
                                        checked={data.marketing_emails}
                                        onCheckedChange={(checked) => setData('marketing_emails', checked)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Privacy Section */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium">Privacy</h3>
                            <div className="space-y-2">
                                <Label>Activity Visibility</Label>
                                <Select
                                    value={data.activity_visibility}
                                    onValueChange={(value) => setData('activity_visibility', value as PreferencesForm['activity_visibility'])}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select visibility" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="public">Public</SelectItem>
                                        <SelectItem value="private">Private</SelectItem>
                                        <SelectItem value="connections">Connections Only</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-muted-foreground">
                                    Control who can see your activity and profile information
                                </p>
                                <InputError message={errors.activity_visibility} />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Save Preferences</Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">Saved</p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
} 