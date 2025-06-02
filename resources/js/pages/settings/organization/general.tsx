import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Organization',
        href: '/settings/organization',
    },
    {
        title: 'General',
        href: '/settings/organization/general',
    },
];

type OrganizationForm = {
    name: string;
    slug: string;
    description: string;
    website: string;
    industry: string;
    size: string;
}

interface Props {
    tenant: {
        id: string;
        name: string;
        slug: string;
        description: string;
        website: string;
        industry: string;
        size: string;
        created_at: string;
        updated_at: string;
    };
    industries: string[];
    organizationSizes: string[];
}

export default function OrganizationGeneral({ tenant, industries, organizationSizes }: Props) {
    const { auth } = usePage<SharedData>().props;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm<OrganizationForm>({
        name: tenant.name,
        slug: tenant.slug,
        description: tenant.description || '',
        website: tenant.website || '',
        industry: tenant.industry,
        size: tenant.size,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('settings.organization.update'), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Organization Settings" />

            <SettingsLayout>
                <div className="space-y-8">
                    <HeadingSmall 
                        title="Organization Settings" 
                        description="Manage your organization's basic information" 
                    />

                    <form onSubmit={submit} className="space-y-8">
                        <div className="space-y-6">
                            <div className="grid gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Organization Name</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Enter organization name"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slug">Organization Slug</Label>
                                    <Input
                                        id="slug"
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value)}
                                        placeholder="your-organization"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        This will be used in URLs and API endpoints
                                    </p>
                                    <InputError message={errors.slug} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Tell us about your organization"
                                        rows={4}
                                    />
                                    <InputError message={errors.description} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="website">Website</Label>
                                    <Input
                                        id="website"
                                        type="url"
                                        value={data.website}
                                        onChange={(e) => setData('website', e.target.value)}
                                        placeholder="https://example.com"
                                    />
                                    <InputError message={errors.website} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="industry">Industry</Label>
                                        <select
                                            id="industry"
                                            value={data.industry}
                                            onChange={(e) => setData('industry', e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                                        >
                                            {industries.map((industry) => (
                                                <option key={industry} value={industry}>
                                                    {industry}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.industry} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="size">Organization Size</Label>
                                        <select
                                            id="size"
                                            value={data.size}
                                            onChange={(e) => setData('size', e.target.value)}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                                        >
                                            {organizationSizes.map((size) => (
                                                <option key={size} value={size}>
                                                    {size} employees
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.size} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>Save Changes</Button>

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