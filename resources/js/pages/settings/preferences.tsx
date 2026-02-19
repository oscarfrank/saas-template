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
import { useAppearance } from '@/hooks/use-appearance';
import { Monitor, Moon, Sun } from 'lucide-react';

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
    landing_behavior: 'organization_default' | 'last_visited';
}

interface PreferencesProps {
    preferences?: Record<string, unknown> & { landing_behavior?: string };
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

export default function Preferences({ preferences = {} }: PreferencesProps) {
    const { auth } = usePage<SharedData>().props;
    const { appearance, updateAppearance } = useAppearance();

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm<PreferencesForm>({
        language: (preferences.language as string) ?? 'en',
        timezone: (preferences.timezone as string) ?? 'UTC',
        date_format: (preferences.date_format as string) ?? 'MM/DD/YYYY',
        time_format: (preferences.time_format as string) ?? '12h',
        email_notifications: (preferences.email_notifications as boolean) ?? true,
        marketing_emails: (preferences.marketing_emails as boolean) ?? false,
        activity_visibility: (preferences.activity_visibility as PreferencesForm['activity_visibility']) ?? 'connections',
        landing_behavior: (preferences.landing_behavior === 'last_visited' ? 'last_visited' : 'organization_default') as PreferencesForm['landing_behavior'],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('preferences.update'), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Preferences & Appearance" />

            <SettingsLayout>
                <div className="space-y-8">
                    <HeadingSmall title="Preferences & Appearance" description="Manage your account preferences, appearance and settings" />

                    <form onSubmit={submit} className="space-y-8">
                        {/* Appearance Section */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium">Appearance</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Theme</Label>
                                    <div className="inline-flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
                                        <button
                                            type="button"
                                            onClick={() => updateAppearance('light')}
                                            className={`flex items-center rounded-md px-3.5 py-1.5 transition-colors ${
                                                appearance === 'light'
                                                    ? 'bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                                                    : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60'
                                            }`}
                                        >
                                            <Sun className="-ml-1 h-4 w-4" />
                                            <span className="ml-1.5 text-sm">Light</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateAppearance('dark')}
                                            className={`flex items-center rounded-md px-3.5 py-1.5 transition-colors ${
                                                appearance === 'dark'
                                                    ? 'bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                                                    : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60'
                                            }`}
                                        >
                                            <Moon className="-ml-1 h-4 w-4" />
                                            <span className="ml-1.5 text-sm">Dark</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateAppearance('system')}
                                            className={`flex items-center rounded-md px-3.5 py-1.5 transition-colors ${
                                                appearance === 'system'
                                                    ? 'bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                                                    : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60'
                                            }`}
                                        >
                                            <Monitor className="-ml-1 h-4 w-4" />
                                            <span className="ml-1.5 text-sm">System</span>
                                        </button>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Choose your preferred theme for the application
                                    </p>
                                </div>
                            </div>
                        </div>

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

                        {/* After login */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium">After login</h3>
                            <div className="space-y-2">
                                <Label>Where to go when you log in</Label>
                                <Select
                                    value={data.landing_behavior}
                                    onValueChange={(value) => setData('landing_behavior', value as PreferencesForm['landing_behavior'])}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="organization_default">
                                            Use my organization&apos;s default
                                        </SelectItem>
                                        <SelectItem value="last_visited">
                                            Return to last page I visited
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-muted-foreground">
                                    Organization default is set by your org admin in Settings → Organization → General.
                                </p>
                                <InputError message={errors.landing_behavior} />
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