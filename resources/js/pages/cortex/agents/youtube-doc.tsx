import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AgentMarkdown } from '@/components/cortex/agent-markdown';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { ChevronDown, Loader2, Send, Settings2, Sparkles, Youtube } from 'lucide-react';

type ManagedChannel = { id: string; title: string };

type YoutubeDocChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

interface Props {
    openAiConfigured: boolean;
    connected: boolean;
    youtubeChannelTitle?: string | null;
    youtubeChannelId?: string | null;
}

const STARTERS = [
    'What’s driving my recent views growth?',
    'Which traffic sources are underperforming, and what should I test next?',
    'Look at my top videos. What patterns do they share, and how do I replicate them?',
];

type TenantPage = { tenant: { slug: string } };

function truncate(str: string, max: number): string {
    if (str.length <= max) return str;
    return `${str.slice(0, max - 1)}…`;
}

export default function YoutubeDocPage({ openAiConfigured, connected, youtubeChannelTitle, youtubeChannelId }: Props) {
    const tenantSlug = usePage<TenantPage>().props.tenant.slug;

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: 'Cortex', href: route('cortex.index', { tenant: tenantSlug }) },
            { title: 'Youtube Doc', href: '' },
        ],
        [tenantSlug],
    );

    const connectUrl = useMemo(() => route('cortex.agents.youtube_doc.connect', { tenant: tenantSlug }), [tenantSlug]);

    const [messages, setMessages] = useState<YoutubeDocChatMessage[]>([]);
    const [context, setContext] = useState('');
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [managedChannels, setManagedChannels] = useState<ManagedChannel[] | null>(null);
    const [channelsLoading, setChannelsLoading] = useState(false);
    const [channelSwitching, setChannelSwitching] = useState(false);
    const [channelMenuOpen, setChannelMenuOpen] = useState(false);
    const [contextOpen, setContextOpen] = useState(false);

    useEffect(() => {
        if (!connected || tenantSlug === '') {
            setManagedChannels(null);
            setChannelsLoading(false);
            return;
        }

        let cancelled = false;
        setChannelsLoading(true);

        const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        const url = route('cortex.agents.youtube_doc.channels', { tenant: tenantSlug });

        void axios
            .get<{ channels: ManagedChannel[] }>(url, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrf,
                },
            })
            .then(({ data }) => {
                if (!cancelled) {
                    setManagedChannels(data.channels ?? []);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setManagedChannels([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setChannelsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [connected, tenantSlug]);

    const onChannelChange = (nextId: string) => {
        if (!youtubeChannelId || nextId === youtubeChannelId) {
            return;
        }

        const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        const url = route('cortex.agents.youtube_doc.channel', { tenant: tenantSlug });

        setChannelSwitching(true);
        void axios
            .post(
                url,
                { youtube_channel_id: nextId },
                {
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrf,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            )
            .then(() => {
                router.reload();
            })
            .catch((e) => {
                if (axios.isAxiosError(e)) {
                    const msg = (e.response?.data as { message?: string } | undefined)?.message ?? e.message ?? 'Could not switch channel.';
                    toast.error(msg);
                } else {
                    toast.error('Could not switch channel.');
                }
            })
            .finally(() => {
                setChannelSwitching(false);
            });
    };

    const runChat = async (userMessage: string) => {
        setLoading(true);
        setError(null);

        try {
            const url = route('cortex.agents.youtube_doc.chat', { tenant: tenantSlug });
            const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

            const { data } = await axios.post<{ reply?: string; message?: string }>(
                url,
                {
                    message: userMessage,
                    context: context.trim() || undefined,
                    history: messages,
                },
                {
                    timeout: 300_000,
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrf,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );

            const assistant = data.reply ?? data.message ?? '';
            if (!assistant) {
                throw new Error('Empty response');
            }

            setMessages((prev) => [...prev, { role: 'user', content: userMessage }, { role: 'assistant', content: assistant }]);
        } catch (e) {
            if (axios.isAxiosError(e)) {
                const msg = (e.response?.data as { message?: string } | undefined)?.message ?? e.message ?? 'Request failed.';
                setError(msg);
                toast.error(msg);
            } else {
                setError('Something went wrong.');
                toast.error('Something went wrong.');
            }
        } finally {
            setLoading(false);
        }
    };

    const canUseAgent = openAiConfigured && connected;
    const displayTitle = youtubeChannelTitle?.trim() || 'Your channel';
    const channelTooltip = [displayTitle, youtubeChannelId ? `ID: ${youtubeChannelId}` : null].filter(Boolean).join('\n');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Youtube Doc — Cortex" />

            <div className="flex min-h-[calc(100dvh-7rem)] flex-col gap-4 px-4 pb-6 pt-2 md:gap-5 md:px-6 lg:mx-auto lg:max-w-5xl">
                {!openAiConfigured && (
                    <Alert variant="destructive" className="shrink-0 py-2">
                        <AlertTitle className="text-sm">OpenAI not configured</AlertTitle>
                        <AlertDescription className="text-xs">Set OPENAI_API_KEY in your environment, then reload.</AlertDescription>
                    </Alert>
                )}

                {/* Top bar: brand + compact channel */}
                <header className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="relative shrink-0">
                            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-red-500/80 via-rose-500/50 to-amber-500/60 opacity-90 blur-[1px]" />
                            <div className="relative flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-lg">
                                <Youtube className="size-6" strokeWidth={1.75} />
                            </div>
                        </div>
                        <div className="min-w-0 pt-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Youtube Doc</h1>
                                <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                                    <Sparkles className="size-3" />
                                    Analytics
                                </span>
                            </div>
                            <p className="text-muted-foreground mt-1 max-w-xl text-sm leading-snug">
                                Understand growth, traffic, and content performance — grounded in your YouTube Analytics snapshot.
                            </p>
                        </div>
                    </div>

                    {connected && (
                        <div className="flex shrink-0 items-center gap-2 sm:pt-1">
                            <Popover open={channelMenuOpen} onOpenChange={setChannelMenuOpen}>
                                <Tooltip delayDuration={300}>
                                    <TooltipTrigger asChild>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-10 max-w-[min(100%,280px)] gap-2 rounded-full border-border/80 bg-background/80 pl-2 pr-3 shadow-sm backdrop-blur"
                                                disabled={channelsLoading}
                                            >
                                                <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full">
                                                    {channelsLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Youtube className="size-3.5" />}
                                                </span>
                                                <span className="truncate text-left text-sm font-medium">{truncate(displayTitle, 28)}</span>
                                                <ChevronDown className="text-muted-foreground size-4 shrink-0 opacity-70" />
                                            </Button>
                                        </PopoverTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" align="end" className="max-w-sm whitespace-pre-line">
                                        {channelTooltip}
                                    </TooltipContent>
                                </Tooltip>
                                <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
                                    <div className="border-border/60 space-y-3 border-b p-4">
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <Settings2 className="text-muted-foreground size-4" />
                                            Linked channel
                                        </div>
                                        <p className="text-muted-foreground text-xs leading-relaxed">
                                            Analytics use this channel. Switch below if your Google account has multiple channels.
                                        </p>
                                    </div>
                                    <div className="space-y-3 p-4">
                                        {!channelsLoading && managedChannels !== null && managedChannels.length > 1 && youtubeChannelId && (
                                            <div className="space-y-1.5">
                                                <Label htmlFor="youtube_doc_channel" className="text-xs">
                                                    Active channel
                                                </Label>
                                                <Select value={youtubeChannelId} onValueChange={onChannelChange} disabled={channelSwitching}>
                                                    <SelectTrigger id="youtube_doc_channel" className="w-full">
                                                        <SelectValue placeholder="Select a channel" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {managedChannels.map((c) => (
                                                            <SelectItem key={c.id} value={c.id}>
                                                                {c.title || c.id}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <div className="text-sm font-medium leading-tight">{youtubeChannelTitle ?? 'Untitled channel'}</div>
                                            <div className="text-muted-foreground font-mono text-[11px] leading-relaxed break-all">{youtubeChannelId ?? '—'}</div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => {
                                                setChannelMenuOpen(false);
                                                window.location.href = connectUrl;
                                            }}
                                        >
                                            Re-connect Google account
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}
                </header>

                {!connected && (
                    <div className="from-muted/50 shrink-0 rounded-2xl border border-dashed bg-gradient-to-br to-transparent p-4 md:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-sm font-medium">Connect YouTube to unlock insights</p>
                                <p className="text-muted-foreground mt-0.5 text-xs">
                                    OAuth with <span className="font-mono">youtube.readonly</span> +{' '}
                                    <span className="font-mono">yt-analytics.readonly</span> — one channel per workspace; change anytime.
                                </p>
                            </div>
                            <Button type="button" className="shrink-0 rounded-full" onClick={() => void (window.location.href = connectUrl)}>
                                Connect channel
                            </Button>
                        </div>
                    </div>
                )}

                <Separator className="shrink-0" />

                {/* Chat-first panel */}
                <div className="flex min-h-0 flex-1 flex-col">
                    <div
                        className={cn(
                            'relative flex min-h-[min(560px,calc(100dvh-13rem))] flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/40 shadow-sm backdrop-blur-sm dark:bg-card/30',
                            'before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:p-px before:content-[""]',
                            'before:bg-gradient-to-br before:from-red-500/15 before:via-transparent before:to-amber-500/10',
                        )}
                    >
                        <div className="relative flex min-h-0 flex-1 flex-col">
                            <div className="border-border/50 shrink-0 border-b bg-gradient-to-r from-background/90 to-background/60 px-4 py-3 md:px-5">
                                <div className="flex flex-wrap items-end justify-between gap-2">
                                    <div>
                                        <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-widest">Conversation</p>
                                        <h2 className="text-lg font-semibold tracking-tight md:text-xl">Ask your channel analyst</h2>
                                    </div>
                                    {!connected && (
                                        <Button type="button" size="sm" variant="outline" className="rounded-full text-xs" asChild>
                                            <Link href={connectUrl}>Connect YouTube first</Link>
                                        </Button>
                                    )}
                                </div>
                                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    {STARTERS.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            disabled={!canUseAgent || loading}
                                            onClick={() => setInput(s)}
                                            className={cn(
                                                'shrink-0 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-left text-xs leading-snug transition-colors',
                                                'hover:bg-primary/10 hover:border-primary/25',
                                                'disabled:pointer-events-none disabled:opacity-40',
                                            )}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 md:p-5">
                                <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
                                    <CollapsibleTrigger asChild>
                                        <button
                                            type="button"
                                            className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-2 text-left text-xs font-medium transition-colors"
                                        >
                                            <span>Extra context (optional)</span>
                                            <ChevronDown className={cn('size-4 transition-transform', contextOpen && 'rotate-180')} />
                                        </button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="pt-2">
                                        <Textarea
                                            value={context}
                                            onChange={(e) => setContext(e.target.value)}
                                            placeholder="e.g. UK/US audience, testing Shorts, inconsistent upload cadence…"
                                            disabled={!canUseAgent || loading}
                                            rows={3}
                                            className="font-mono text-xs"
                                        />
                                        <p className="text-muted-foreground mt-1.5 text-[11px]">Sent with every message until you clear it.</p>
                                    </CollapsibleContent>
                                </Collapsible>

                                <div className="bg-muted/30 flex min-h-[min(220px,32vh)] flex-1 flex-col overflow-hidden rounded-xl border border-border/40">
                                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 md:p-4">
                                        {messages.length === 0 ? (
                                            <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-3 px-2 text-center">
                                                <div className="bg-primary/8 text-primary flex size-12 items-center justify-center rounded-2xl">
                                                    <Sparkles className="size-6" />
                                                </div>
                                                <div className="max-w-md space-y-1">
                                                    <p className="text-foreground text-sm font-medium">What do you want to understand?</p>
                                                    <p className="text-muted-foreground text-xs leading-relaxed">
                                                        Pick a starter above or type your own question. Answers use your last ~28 days of analytics when
                                                        connected.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            messages.map((m, idx) => (
                                                <div
                                                    key={`${idx}-${m.role}`}
                                                    className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                                                >
                                                    {m.role === 'user' ? (
                                                        <div className="max-w-[min(92%,520px)] whitespace-pre-wrap rounded-2xl bg-primary px-3.5 py-2.5 text-sm text-primary-foreground shadow-sm">
                                                            {m.content}
                                                        </div>
                                                    ) : (
                                                        <div className="border-border/60 max-w-[min(92%,640px)] rounded-2xl border bg-background/80 px-3.5 py-3 shadow-sm">
                                                            <AgentMarkdown content={m.content} />
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="shrink-0 space-y-2">
                                    <Label htmlFor="youtube_doc_message" className="text-xs font-medium">
                                        Message
                                    </Label>
                                    <Textarea
                                        id="youtube_doc_message"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="e.g. What’s driving my recent views growth?"
                                        disabled={!canUseAgent || loading}
                                        rows={3}
                                        className="min-h-[88px] resize-y rounded-xl"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                if (!input.trim() || !canUseAgent || loading) return;
                                                void runChat(input.trim());
                                                setInput('');
                                            }
                                        }}
                                    />
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            type="button"
                                            className="rounded-full px-5"
                                            onClick={() => {
                                                if (!input.trim()) return;
                                                void runChat(input.trim());
                                                setInput('');
                                            }}
                                            disabled={!canUseAgent || loading || !input.trim()}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                                    Working…
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="mr-2 size-4" />
                                                    Send
                                                </>
                                            )}
                                        </Button>
                                        <span className="text-muted-foreground text-[11px]">Enter to send · Shift+Enter for newline</span>
                                    </div>
                                </div>

                                {error && (
                                    <Alert variant="destructive" className="py-2">
                                        <AlertTitle className="text-sm">Error</AlertTitle>
                                        <AlertDescription className="text-xs">{error}</AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
