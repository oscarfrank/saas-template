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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ArrowLeft, Clock, Settings2, Sparkles } from 'lucide-react';
import { CortexAgentSettingsMenu } from '@/components/cortex/cortex-agent-settings-menu';

interface Props {
    openAiConfigured: boolean;
    max_items_per_feed: number;
    auto_pull_enabled: boolean;
    auto_pull_time: string;
    digest_timezone: string | null;
    tweet_style_prompt: string | null;
    deep_research_enabled: boolean;
    chat_model: string | null;
    digest_model: string | null;
    digest_ideas_model: string | null;
    digest_tweets_model: string | null;
    script_model: string | null;
}

export default function PulseSettingsPage({
    openAiConfigured,
    max_items_per_feed,
    auto_pull_enabled,
    auto_pull_time,
    digest_timezone,
    tweet_style_prompt,
    deep_research_enabled,
    chat_model,
    digest_model,
    digest_ideas_model,
    digest_tweets_model,
    script_model,
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
        tweet_style_prompt: tweet_style_prompt ?? '',
        deep_research_enabled: deep_research_enabled,
        chat_model: chat_model ?? '',
        digest_model: digest_model ?? '',
        digest_ideas_model: digest_ideas_model ?? '',
        digest_tweets_model: digest_tweets_model ?? '',
        script_model: script_model ?? '',
    });

    const MODEL_OPTIONS = [
        { value: '__default__', label: 'Default (inherit Pulse agent model)' },
        { value: 'gpt-5.4', label: 'gpt-5.4' },
        { value: 'gpt-5.4-mini', label: 'gpt-5.4-mini' },
        { value: 'gpt-5.4-nano', label: 'gpt-5.4-nano' },
        { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
        { value: 'gpt-4.1-mini', label: 'gpt-4.1-mini' },
        { value: 'gpt-4.1-nano', label: 'gpt-4.1-nano' },
        { value: 'gpt-5-mini', label: 'gpt-5-mini' },
        { value: 'gpt-5-nano', label: 'gpt-5-nano' },
    ] as const;

    const selectValue = (value: string): string => (value === '' ? '__default__' : value);
    const fromSelectValue = (value: string): string => (value === '__default__' ? '' : value);

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
                    <div className="flex items-center justify-between gap-3">
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
                        <CortexAgentSettingsMenu agentKey="pulse" />
                    </div>

                    <Alert>
                        <AlertTitle>How this page relates to Agent settings</AlertTitle>
                        <AlertDescription>
                            Use this page for Pulse workflow controls (digest, script research, model overrides). Use{' '}
                            <Link
                                href={tenantRouter.route('cortex.agents.agent_settings.show', { agent: 'pulse' })}
                                className="text-primary font-medium underline-offset-4 hover:underline"
                            >
                                Agent settings
                            </Link>{' '}
                            for provider-level defaults.
                        </AlertDescription>
                    </Alert>

                    {!openAiConfigured && (
                        <Alert variant="destructive">
                            <AlertTitle>AI not configured for Pulse</AlertTitle>
                            <AlertDescription>
                                Chat and digest ideas need an API key. Configure the model under <strong>Settings → Agent settings</strong>. Feed refresh
                                still works without it.
                            </AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        <Tabs defaultValue="models" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="models">Models</TabsTrigger>
                                <TabsTrigger value="digest">Digest</TabsTrigger>
                                <TabsTrigger value="scripts">Scripts</TabsTrigger>
                                <TabsTrigger value="feeds">Feeds</TabsTrigger>
                            </TabsList>

                            <TabsContent value="models" className="mt-4 space-y-4">
                                <Card className="border-border/80 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Model overrides (cost control)</CardTitle>
                                        <CardDescription>
                                            Optional. Leave as Default to inherit from Pulse agent settings, or choose specific models per step.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="chat_model">Chat model override</Label>
                                            <Select
                                                value={selectValue(form.data.chat_model)}
                                                onValueChange={(v) => form.setData('chat_model', fromSelectValue(v))}
                                                disabled={form.processing}
                                            >
                                                <SelectTrigger id="chat_model">
                                                    <SelectValue placeholder="Select chat model" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {MODEL_OPTIONS.map((opt) => (
                                                        <SelectItem key={`chat-${opt.value}`} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {form.errors.chat_model && <p className="text-destructive text-sm">{form.errors.chat_model}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="digest_ideas_model">Digest ideas model (shorts + youtube + intro)</Label>
                                            <Select
                                                value={selectValue(form.data.digest_ideas_model)}
                                                onValueChange={(v) => form.setData('digest_ideas_model', fromSelectValue(v))}
                                                disabled={form.processing}
                                            >
                                                <SelectTrigger id="digest_ideas_model">
                                                    <SelectValue placeholder="Select ideas model" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {MODEL_OPTIONS.map((opt) => (
                                                        <SelectItem key={`digest-ideas-${opt.value}`} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {form.errors.digest_ideas_model && (
                                                <p className="text-destructive text-sm">{form.errors.digest_ideas_model}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="digest_tweets_model">Digest tweets model</Label>
                                            <Select
                                                value={selectValue(form.data.digest_tweets_model)}
                                                onValueChange={(v) => form.setData('digest_tweets_model', fromSelectValue(v))}
                                                disabled={form.processing}
                                            >
                                                <SelectTrigger id="digest_tweets_model">
                                                    <SelectValue placeholder="Select tweets model" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {MODEL_OPTIONS.map((opt) => (
                                                        <SelectItem key={`digest-tweets-${opt.value}`} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {form.errors.digest_tweets_model && (
                                                <p className="text-destructive text-sm">{form.errors.digest_tweets_model}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="digest_model">Digest fallback model (legacy)</Label>
                                            <Select
                                                value={selectValue(form.data.digest_model)}
                                                onValueChange={(v) => form.setData('digest_model', fromSelectValue(v))}
                                                disabled={form.processing}
                                            >
                                                <SelectTrigger id="digest_model">
                                                    <SelectValue placeholder="Optional fallback model" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {MODEL_OPTIONS.map((opt) => (
                                                        <SelectItem key={`digest-legacy-${opt.value}`} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {form.errors.digest_model && <p className="text-destructive text-sm">{form.errors.digest_model}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="script_model">Short script model override</Label>
                                            <Select
                                                value={selectValue(form.data.script_model)}
                                                onValueChange={(v) => form.setData('script_model', fromSelectValue(v))}
                                                disabled={form.processing}
                                            >
                                                <SelectTrigger id="script_model">
                                                    <SelectValue placeholder="Select script model" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {MODEL_OPTIONS.map((opt) => (
                                                        <SelectItem key={`script-${opt.value}`} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {form.errors.script_model && <p className="text-destructive text-sm">{form.errors.script_model}</p>}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="digest" className="mt-4 space-y-4">
                                <Card className="border-border/80 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Settings2 className="size-5" />
                                            Feed refresh limit
                                        </CardTitle>
                                        <CardDescription>
                                            When you refresh a feed (or import), Pulse downloads up to this many latest items per feed.
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
                                        <CardTitle className="text-lg">Tweet style prompt</CardTitle>
                                        <CardDescription>
                                            Optional. This guides how Pulse writes the <strong>tweets</strong> list in your daily digest.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <Label htmlFor="tweet_style_prompt">X/Twitter writing profile</Label>
                                        <Textarea
                                            id="tweet_style_prompt"
                                            value={form.data.tweet_style_prompt}
                                            onChange={(e) => form.setData('tweet_style_prompt', e.target.value)}
                                            rows={14}
                                            placeholder="Paste your preferred tweet voice, tone, and constraints…"
                                            className="text-sm"
                                        />
                                        {form.errors.tweet_style_prompt && (
                                            <p className="text-destructive text-sm">{form.errors.tweet_style_prompt}</p>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="border-border/80 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Clock className="size-5" />
                                            Daily digest automation
                                        </CardTitle>
                                        <CardDescription>
                                            At the chosen local time, Pulse refreshes feeds and generates digest ideas.
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
                            </TabsContent>

                            <TabsContent value="scripts" className="mt-4 space-y-4">
                                <Card className="border-border/80 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Shorts script research</CardTitle>
                                        <CardDescription>
                                            Toggle deep web-backed research during short script generation.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3">
                                            <div>
                                                <Label htmlFor="deep_research" className="text-sm font-medium">
                                                    Enable deep research for Shorts scripts
                                                </Label>
                                                <p className="text-muted-foreground text-xs">
                                                    Slower, but more accurate and source-backed when possible.
                                                </p>
                                            </div>
                                            <Switch
                                                id="deep_research"
                                                checked={form.data.deep_research_enabled}
                                                onCheckedChange={(v) => form.setData('deep_research_enabled', Boolean(v))}
                                            />
                                        </div>
                                        {form.errors.deep_research_enabled && (
                                            <p className="text-destructive mt-2 text-sm">{form.errors.deep_research_enabled}</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="feeds" className="mt-4 space-y-4">
                                <Card className="border-border/80 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Feed management</CardTitle>
                                        <CardDescription>
                                            Feed setup stays on the dedicated page so this settings screen remains clean.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex items-center justify-between gap-3">
                                        <p className="text-muted-foreground text-sm">Open the feed manager to add, edit, refresh, import, or export feeds.</p>
                                        <Button type="button" variant="outline" asChild>
                                            <Link href={tenantRouter.route('cortex.agents.pulse.feeds')}>Manage feeds</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving…' : 'Save settings'}
                        </Button>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
