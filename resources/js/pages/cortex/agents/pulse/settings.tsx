import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

import { ArrowLeft, Clock, Settings2, Sparkles } from 'lucide-react';

interface Props {
    openAiConfigured: boolean;
    max_items_per_feed: number;
    auto_pull_enabled: boolean;
    auto_pull_time: string;
    digest_timezone: string | null;
}

export default function PulseSettingsPage({
    openAiConfigured,
    max_items_per_feed,
    auto_pull_enabled,
    auto_pull_time,
    digest_timezone,
}: Props) {
    const tenantRouter = useTenantRouter();

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Cortex', href: tenantRouter.route('cortex.index') },
            { title: 'Pulse', href: tenantRouter.route('cortex.agents.pulse') },
            { title: 'Settings', href: '' },
        ],
        [tenantRouter],
    );

    const form = useForm({
        max_items_per_feed: max_items_per_feed,
        auto_pull_enabled: auto_pull_enabled,
        auto_pull_time: auto_pull_time,
        digest_timezone: digest_timezone ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.patch(tenantRouter.route('cortex.agents.pulse.settings.update'), {
            preserveScroll: true,
            onSuccess: () => toast.success('Settings saved.'),
            onError: () => toast.error('Could not save settings. Check the form and try again.'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pulse settings - Cortex" />
            <div className="relative min-h-[calc(100vh-8rem)]">
                <div className="pointer-events-none absolute inset-x-0 -top-px h-32 bg-gradient-to-b from-primary/12 via-primary/5 to-transparent" />
                <div className="relative mx-auto max-w-lg space-y-6 p-4 md:p-6">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="shrink-0" asChild>
                            <Link href={tenantRouter.route('cortex.agents.pulse')} aria-label="Back to Pulse">
                                <ArrowLeft className="size-5" />
                            </Link>
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/15 text-primary flex size-11 items-center justify-center rounded-2xl ring-1 ring-primary/20">
                                <Sparkles className="size-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">Pulse settings</h1>
                                <p className="text-muted-foreground text-sm">Feeds, daily digest schedule, and refresh limits.</p>
                            </div>
                        </div>
                    </div>

                    {!openAiConfigured && (
                        <Alert variant="destructive">
                            <AlertTitle>OpenAI not configured</AlertTitle>
                            <AlertDescription>Set OPENAI_API_KEY in your environment for chat and digest ideas; feed refresh still works.</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        <Card className="border-border/80 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Settings2 className="size-5" />
                                    Feed refresh limit
                                </CardTitle>
                                <CardDescription>
                                    When you refresh a feed (or import), Pulse downloads up to this many latest items per feed. Lower values keep prompts smaller;
                                    higher values capture more headlines (may hit model context sooner).
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="max_items">Items per feed (1–100)</Label>
                                    <Input
                                        id="max_items"
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={form.data.max_items_per_feed}
                                        onChange={(e) => form.setData('max_items_per_feed', Number(e.target.value))}
                                        className="max-w-[200px]"
                                    />
                                    {form.errors.max_items_per_feed && (
                                        <p className="text-destructive text-sm">{form.errors.max_items_per_feed}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/80 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Clock className="size-5" />
                                    Daily digest automation
                                </CardTitle>
                                <CardDescription>
                                    At the chosen local time, Pulse will refresh all feeds and generate tweet, Shorts, and YouTube ideas. Requires a running{' '}
                                    <code className="rounded bg-muted px-1 py-0.5 text-xs">schedule:run</code> and queue worker in production.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3">
                                    <div>
                                        <Label htmlFor="auto_pull" className="text-sm font-medium">
                                            Enable scheduled digest
                                        </Label>
                                        <p className="text-muted-foreground text-xs">Runs once per calendar day in your timezone.</p>
                                    </div>
                                    <Switch
                                        id="auto_pull"
                                        checked={form.data.auto_pull_enabled}
                                        onCheckedChange={(v) => form.setData('auto_pull_enabled', Boolean(v))}
                                    />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="auto_pull_time">Local time</Label>
                                        <Input
                                            id="auto_pull_time"
                                            type="time"
                                            value={form.data.auto_pull_time}
                                            onChange={(e) => form.setData('auto_pull_time', e.target.value)}
                                            disabled={!form.data.auto_pull_enabled}
                                        />
                                        {form.errors.auto_pull_time && (
                                            <p className="text-destructive text-sm">{form.errors.auto_pull_time}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="digest_timezone">Timezone (IANA)</Label>
                                        <Input
                                            id="digest_timezone"
                                            type="text"
                                            placeholder="e.g. America/New_York"
                                            value={form.data.digest_timezone}
                                            onChange={(e) => form.setData('digest_timezone', e.target.value)}
                                            disabled={!form.data.auto_pull_enabled}
                                        />
                                        {form.errors.digest_timezone && (
                                            <p className="text-destructive text-sm">{form.errors.digest_timezone}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving…' : 'Save settings'}
                        </Button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
