import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
];

interface SiteSettings {
    id: number;
    site_name: string;
    site_title: string;
    site_description: string | null;
    site_keywords: string | null;
    site_logo: string | null;
    site_favicon: string | null;
    company_name: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    company_website: string | null;
    facebook_url: string | null;
    twitter_url: string | null;
    instagram_url: string | null;
    linkedin_url: string | null;
    youtube_url: string | null;
    google_analytics_code: string | null;
    meta_tags: string | null;
    footer_text: string | null;
    maintenance_mode: boolean;
}

interface Props {
    settings: SiteSettings;
}

export default function Settings({ settings }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        ...settings,
        site_logo: null as File | null,
        site_favicon: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.settings.update'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Settings updated successfully');
            },
            onError: () => {
                toast.error('Failed to update settings');
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Site Settings" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <form onSubmit={handleSubmit}>
                    <Tabs defaultValue="general">
                        <TabsList className="mb-4">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="seo">SEO</TabsTrigger>
                            <TabsTrigger value="company">Company Info</TabsTrigger>
                            <TabsTrigger value="social">Social Media</TabsTrigger>
                            <TabsTrigger value="advanced">Advanced</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general">
                            <Card>
                                <CardHeader>
                                    <CardTitle>General Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="site_name">Site Name</Label>
                                            <Input
                                                id="site_name"
                                                value={data.site_name}
                                                onChange={(e) => setData('site_name', e.target.value)}
                                                className={errors.site_name ? 'border-red-500' : ''}
                                            />
                                            {errors.site_name && (
                                                <p className="text-red-500 text-sm mt-1">{errors.site_name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor="site_title">Site Title</Label>
                                            <Input
                                                id="site_title"
                                                value={data.site_title}
                                                onChange={(e) => setData('site_title', e.target.value)}
                                                className={errors.site_title ? 'border-red-500' : ''}
                                            />
                                            {errors.site_title && (
                                                <p className="text-red-500 text-sm mt-1">{errors.site_title}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="site_logo">Site Logo</Label>
                                        <Input
                                            id="site_logo"
                                            type="file"
                                            onChange={(e) => setData('site_logo', e.target.files?.[0] || null)}
                                            className={errors.site_logo ? 'border-red-500' : ''}
                                        />
                                        {errors.site_logo && (
                                            <p className="text-red-500 text-sm mt-1">{errors.site_logo}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="site_favicon">Site Favicon</Label>
                                        <Input
                                            id="site_favicon"
                                            type="file"
                                            onChange={(e) => setData('site_favicon', e.target.files?.[0] || null)}
                                            className={errors.site_favicon ? 'border-red-500' : ''}
                                        />
                                        {errors.site_favicon && (
                                            <p className="text-red-500 text-sm mt-1">{errors.site_favicon}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="seo">
                            <Card>
                                <CardHeader>
                                    <CardTitle>SEO Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="site_description">Site Description</Label>
                                        <Textarea
                                            id="site_description"
                                            value={data.site_description || ''}
                                            onChange={(e) => setData('site_description', e.target.value)}
                                            className={errors.site_description ? 'border-red-500' : ''}
                                        />
                                        {errors.site_description && (
                                            <p className="text-red-500 text-sm mt-1">{errors.site_description}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="site_keywords">Site Keywords</Label>
                                        <Input
                                            id="site_keywords"
                                            value={data.site_keywords || ''}
                                            onChange={(e) => setData('site_keywords', e.target.value)}
                                            className={errors.site_keywords ? 'border-red-500' : ''}
                                        />
                                        {errors.site_keywords && (
                                            <p className="text-red-500 text-sm mt-1">{errors.site_keywords}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="meta_tags">Meta Tags</Label>
                                        <Textarea
                                            id="meta_tags"
                                            value={data.meta_tags || ''}
                                            onChange={(e) => setData('meta_tags', e.target.value)}
                                            className={errors.meta_tags ? 'border-red-500' : ''}
                                        />
                                        {errors.meta_tags && (
                                            <p className="text-red-500 text-sm mt-1">{errors.meta_tags}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="company">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Company Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="company_name">Company Name</Label>
                                        <Input
                                            id="company_name"
                                            value={data.company_name}
                                            onChange={(e) => setData('company_name', e.target.value)}
                                            className={errors.company_name ? 'border-red-500' : ''}
                                        />
                                        {errors.company_name && (
                                            <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="company_address">Company Address</Label>
                                        <Input
                                            id="company_address"
                                            value={data.company_address}
                                            onChange={(e) => setData('company_address', e.target.value)}
                                            className={errors.company_address ? 'border-red-500' : ''}
                                        />
                                        {errors.company_address && (
                                            <p className="text-red-500 text-sm mt-1">{errors.company_address}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="company_phone">Company Phone</Label>
                                        <Input
                                            id="company_phone"
                                            value={data.company_phone}
                                            onChange={(e) => setData('company_phone', e.target.value)}
                                            className={errors.company_phone ? 'border-red-500' : ''}
                                        />
                                        {errors.company_phone && (
                                            <p className="text-red-500 text-sm mt-1">{errors.company_phone}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="company_email">Company Email</Label>
                                        <Input
                                            id="company_email"
                                            type="email"
                                            value={data.company_email}
                                            onChange={(e) => setData('company_email', e.target.value)}
                                            className={errors.company_email ? 'border-red-500' : ''}
                                        />
                                        {errors.company_email && (
                                            <p className="text-red-500 text-sm mt-1">{errors.company_email}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="company_website">Company Website</Label>
                                        <Input
                                            id="company_website"
                                            type="url"
                                            value={data.company_website || ''}
                                            onChange={(e) => setData('company_website', e.target.value)}
                                            className={errors.company_website ? 'border-red-500' : ''}
                                        />
                                        {errors.company_website && (
                                            <p className="text-red-500 text-sm mt-1">{errors.company_website}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="social">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Social Media Links</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="facebook_url">Facebook URL</Label>
                                        <Input
                                            id="facebook_url"
                                            type="url"
                                            value={data.facebook_url || ''}
                                            onChange={(e) => setData('facebook_url', e.target.value)}
                                            className={errors.facebook_url ? 'border-red-500' : ''}
                                        />
                                        {errors.facebook_url && (
                                            <p className="text-red-500 text-sm mt-1">{errors.facebook_url}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="twitter_url">Twitter URL</Label>
                                        <Input
                                            id="twitter_url"
                                            type="url"
                                            value={data.twitter_url || ''}
                                            onChange={(e) => setData('twitter_url', e.target.value)}
                                            className={errors.twitter_url ? 'border-red-500' : ''}
                                        />
                                        {errors.twitter_url && (
                                            <p className="text-red-500 text-sm mt-1">{errors.twitter_url}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="instagram_url">Instagram URL</Label>
                                        <Input
                                            id="instagram_url"
                                            type="url"
                                            value={data.instagram_url || ''}
                                            onChange={(e) => setData('instagram_url', e.target.value)}
                                            className={errors.instagram_url ? 'border-red-500' : ''}
                                        />
                                        {errors.instagram_url && (
                                            <p className="text-red-500 text-sm mt-1">{errors.instagram_url}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                                        <Input
                                            id="linkedin_url"
                                            type="url"
                                            value={data.linkedin_url || ''}
                                            onChange={(e) => setData('linkedin_url', e.target.value)}
                                            className={errors.linkedin_url ? 'border-red-500' : ''}
                                        />
                                        {errors.linkedin_url && (
                                            <p className="text-red-500 text-sm mt-1">{errors.linkedin_url}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="youtube_url">YouTube URL</Label>
                                        <Input
                                            id="youtube_url"
                                            type="url"
                                            value={data.youtube_url || ''}
                                            onChange={(e) => setData('youtube_url', e.target.value)}
                                            className={errors.youtube_url ? 'border-red-500' : ''}
                                        />
                                        {errors.youtube_url && (
                                            <p className="text-red-500 text-sm mt-1">{errors.youtube_url}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="advanced">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Advanced Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="google_analytics_code">Google Analytics Code</Label>
                                        <Textarea
                                            id="google_analytics_code"
                                            value={data.google_analytics_code || ''}
                                            onChange={(e) => setData('google_analytics_code', e.target.value)}
                                            className={errors.google_analytics_code ? 'border-red-500' : ''}
                                        />
                                        {errors.google_analytics_code && (
                                            <p className="text-red-500 text-sm mt-1">{errors.google_analytics_code}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="footer_text">Footer Text</Label>
                                        <Textarea
                                            id="footer_text"
                                            value={data.footer_text || ''}
                                            onChange={(e) => setData('footer_text', e.target.value)}
                                            className={errors.footer_text ? 'border-red-500' : ''}
                                        />
                                        {errors.footer_text && (
                                            <p className="text-red-500 text-sm mt-1">{errors.footer_text}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="maintenance_mode"
                                            checked={data.maintenance_mode}
                                            onCheckedChange={(checked: boolean) => setData('maintenance_mode', checked)}
                                        />
                                        <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <div className="mt-6">
                        <Button type="submit" disabled={processing}>
                            Save Settings
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
} 