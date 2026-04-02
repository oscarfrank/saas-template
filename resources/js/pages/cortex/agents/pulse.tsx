import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { AgentMarkdown } from '@/components/cortex/agent-markdown';
import { cn } from '@/lib/utils';

import { ChevronDown, Loader2, Send, Sparkles, Rss } from 'lucide-react';

import { CortexAgentSettingsMenu } from '@/components/cortex/cortex-agent-settings-menu';
import { PulseDigestSection } from './pulse/pulse-digest-section';
import { type PulseDigest, type PulseFeedRow } from './pulse/types';

type PulseChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

interface Props {
    openAiConfigured: boolean;
    feeds: PulseFeedRow[];
    max_items_per_feed: number;
    digest: PulseDigest | null;
    digest_date: string | null;
}

const STARTERS = [
    'Given our saved feeds, what are the strongest video angles this week? Rank by potential impact.',
    'Cross-reference feed headlines with our niche—surface 5 contrarian ideas and 3 safe bets.',
    'What patterns repeat across feeds? Name themes, gaps, and one wildcard concept.',
];

export default function PulsePage({
    openAiConfigured,
    feeds: initialFeeds,
    max_items_per_feed: maxItemsPerFeed,
    digest: initialDigest,
    digest_date: initialDigestDate,
}: Props) {
    const tenantRouter = useTenantRouter();
    const csrf = () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [{ title: 'Cortex', href: tenantRouter.route('cortex.index') }, { title: 'Pulse', href: '' }],
        [tenantRouter],
    );

    const [feeds, setFeeds] = useState<PulseFeedRow[]>(initialFeeds);
    useEffect(() => {
        setFeeds(initialFeeds);
    }, [initialFeeds]);

    const [messages, setMessages] = useState<PulseChatMessage[]>([]);
    const [context, setContext] = useState('');
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /** null = all enabled feeds; number[] = subset; [] = no feed content for this turn */
    const [feedSelection, setFeedSelection] = useState<number[] | null>(null);
    const [signalsOpen, setSignalsOpen] = useState(false);
    const [digest, setDigest] = useState<PulseDigest | null>(initialDigest);
    const [digestDate, setDigestDate] = useState<string | null>(initialDigestDate);
    const [includeDailyDigest, setIncludeDailyDigest] = useState(false);

    const enabledFeeds = useMemo(() => feeds.filter((f) => f.enabled), [feeds]);

    useEffect(() => {
        setDigest(initialDigest);
    }, [initialDigest]);
    useEffect(() => {
        setDigestDate(initialDigestDate);
    }, [initialDigestDate]);

    const digestRunning = useMemo(() => {
        if (!digest) return false;
        return digest.feeds_status === 'running' || digest.ideas_status === 'running';
    }, [digest]);

    const pollDigest = useCallback(async () => {
        try {
            const { data } = await axios.get<{ digest: PulseDigest | null; digest_date: string }>(
                tenantRouter.route('cortex.agents.pulse.digest.today'),
                {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                },
            );
            if (data.digest) setDigest(data.digest);
            setDigestDate(data.digest_date);
        } catch {
            /* ignore */
        }
    }, [tenantRouter]);

    useEffect(() => {
        if (!digestRunning) return;
        const id = window.setInterval(() => {
            void pollDigest();
        }, 2500);
        return () => window.clearInterval(id);
    }, [digestRunning, pollDigest]);

    const runDigest = useCallback(
        async (mode: 'full' | 'feeds' | 'ideas') => {
            try {
                const { data } = await axios.post<{ digest: PulseDigest | null }>(
                    tenantRouter.route('cortex.agents.pulse.digest.run'),
                    { mode },
                    {
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': csrf(),
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );
                if (data.digest) setDigest(data.digest);
                toast.success('Digest run queued.');
                void pollDigest();
            } catch (e) {
                if (axios.isAxiosError(e)) {
                    toast.error((e.response?.data as { message?: string })?.message ?? 'Could not start digest run.');
                } else {
                    toast.error('Could not start digest run.');
                }
            }
        },
        [tenantRouter, pollDigest],
    );

    const signalsSummary = useMemo(() => {
        if (feeds.length === 0) {
            return 'No feeds yet — add sources on Feeds.';
        }
        if (enabledFeeds.length === 0) {
            return 'All feeds are off — enable feeds to pull headlines into chat.';
        }
        const n = enabledFeeds.length;
        if (feedSelection === null) {
            return `${n} ${n === 1 ? 'feed' : 'feeds'} · All included for the next message`;
        }
        if (feedSelection.length === 0) {
            return `${n} enabled · Notes only (no feed signal for the next message)`;
        }
        return `${feedSelection.length} of ${n} feeds included for the next message`;
    }, [feeds.length, enabledFeeds.length, feedSelection]);

    const setSelectionForAllEnabled = useCallback(() => {
        setFeedSelection(null);
    }, []);

    const isFeedIncluded = useCallback(
        (id: number) => {
            const row = feeds.find((x) => x.id === id);
            if (!row?.enabled) {
                return false;
            }
            if (feedSelection === null) {
                return true;
            }
            if (feedSelection.length === 0) {
                return false;
            }
            return feedSelection.includes(id);
        },
        [feeds, feedSelection],
    );

    const toggleFeedInSelection = useCallback(
        (id: number, checked: boolean) => {
            const en = feeds.filter((f) => f.enabled).map((f) => f.id);
            if (feedSelection === null) {
                if (!checked) {
                    const next = en.filter((x) => x !== id);
                    setFeedSelection(next.length === 0 ? [] : next);
                }
                return;
            }
            if (checked) {
                const next = [...new Set([...feedSelection, id])];
                const sortedAll = [...en].sort((a, b) => a - b);
                const sortedNext = [...next].sort((a, b) => a - b);
                if (sortedAll.length === sortedNext.length && sortedAll.every((v, i) => v === sortedNext[i])) {
                    setFeedSelection(null);
                } else {
                    setFeedSelection(next);
                }
            } else {
                setFeedSelection(feedSelection.filter((x) => x !== id));
            }
        },
        [feedSelection, feeds],
    );

    const runChat = async (userMessage: string) => {
        setLoading(true);
        setError(null);

        try {
            const url = tenantRouter.route('cortex.agents.pulse.chat');
            const payload: Record<string, unknown> = {
                message: userMessage,
                context: context.trim() || undefined,
                history: messages,
            };
            if (feedSelection !== null) {
                payload.feed_ids = feedSelection;
            }
            if (includeDailyDigest) {
                payload.include_daily_digest = true;
            }

            const { data } = await axios.post<{ reply?: string; message?: string }>(url, payload, {
                timeout: 300_000,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

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

    const canUseAgent = openAiConfigured;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pulse - Cortex" />
            <div className="relative min-h-[calc(100vh-8rem)]">
                <div className="pointer-events-none absolute inset-x-0 -top-px h-40 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent" />
                <div className="relative mx-auto flex max-w-5xl flex-col gap-6 p-4 md:p-6 lg:gap-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/15 text-primary flex size-11 items-center justify-center rounded-2xl shadow-sm ring-1 ring-primary/20">
                                <Sparkles className="size-6" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-semibold tracking-tight">Pulse</h1>
                                <p className="text-muted-foreground mt-1 max-w-xl text-sm leading-relaxed">
                                    Ideation chat grounded in your RSS/Atom feeds—optional notes, Markdown replies. Manage sources on the feeds page.
                                </p>
                            </div>
                        </div>
                        <CortexAgentSettingsMenu agentKey="pulse" />
                    </div>

                    {!canUseAgent && (
                        <Alert variant="destructive">
                            <AlertTitle>AI not configured for Pulse</AlertTitle>
                            <AlertDescription>
                                Open <strong>Settings → Agent settings</strong> and configure your provider and API keys.
                            </AlertDescription>
                        </Alert>
                    )}

                    <PulseDigestSection
                        digest={digest}
                        digestDate={digestDate}
                        openAiConfigured={canUseAgent}
                        digestRunning={digestRunning}
                        onRun={(mode) => void runDigest(mode)}
                    />

                    <Card className="overflow-hidden border-border/80 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                        <Collapsible open={signalsOpen} onOpenChange={setSignalsOpen}>
                            <CollapsibleTrigger asChild>
                                <button
                                    type="button"
                                    className="flex w-full items-start gap-3 border-b bg-muted/20 px-4 py-3 text-left transition-colors hover:bg-muted/35 md:px-6 md:py-4"
                                >
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-semibold leading-none">Signals for this chat</span>
                                            <ChevronDown
                                                className={cn(
                                                    'text-muted-foreground size-4 shrink-0 transition-transform duration-200',
                                                    signalsOpen && 'rotate-180',
                                                )}
                                                aria-hidden
                                            />
                                        </div>
                                        {signalsOpen ? (
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                Cached headlines from your enabled feeds (up to <strong>{maxItemsPerFeed}</strong> items per feed —{' '}
                                                <Link
                                                    href={tenantRouter.route('cortex.agents.pulse.settings')}
                                                    className="text-primary font-medium underline-offset-4 hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    adjust
                                                </Link>
                                                ). Choose which feeds shape the next reply.
                                            </p>
                                        ) : (
                                            <p className="text-muted-foreground text-sm leading-snug">{signalsSummary}</p>
                                        )}
                                    </div>
                                </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="space-y-4 pt-4">
                                    {feeds.length === 0 ? (
                                        <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center">
                                            <p className="text-muted-foreground text-sm">No feeds yet. Add RSS or Atom sources to ground answers in headlines.</p>
                                            <Button type="button" className="mt-4 gap-2" asChild>
                                                <Link href={tenantRouter.route('cortex.agents.pulse.feeds')}>
                                                    <Rss className="size-4" />
                                                    Add feeds
                                                </Link>
                                            </Button>
                                        </div>
                                    ) : enabledFeeds.length === 0 ? (
                                        <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-6 text-sm">
                                            <p className="text-muted-foreground">
                                                All feeds are turned off.{' '}
                                                <Link href={tenantRouter.route('cortex.agents.pulse.feeds')} className="text-primary font-medium underline-offset-4 hover:underline">
                                                    Enable at least one feed
                                                </Link>{' '}
                                                to pull signal into chat.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                                {enabledFeeds.map((f) => (
                                                    <label
                                                        key={f.id}
                                                        className="flex cursor-pointer items-center gap-2 rounded-lg border bg-card/80 px-3 py-2 text-sm shadow-sm"
                                                    >
                                                        <Checkbox
                                                            checked={isFeedIncluded(f.id)}
                                                            disabled={!canUseAgent}
                                                            onCheckedChange={(v) => toggleFeedInSelection(f.id, Boolean(v))}
                                                            aria-label={`Include ${f.name} in AI context`}
                                                        />
                                                        <span className="max-w-[200px] truncate font-medium">{f.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 border-t pt-3 text-xs">
                                                <span className="text-muted-foreground">Next message:</span>
                                                <Button type="button" variant="secondary" size="sm" className="h-7 text-xs" onClick={() => setSelectionForAllEnabled()}>
                                                    All enabled
                                                </Button>
                                                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setFeedSelection([])}>
                                                    None (notes only)
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </CollapsibleContent>
                        </Collapsible>
                    </Card>

                    <Card className="flex min-h-[min(640px,72vh)] flex-1 flex-col overflow-hidden border-border/80 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                        <CardHeader className="border-b bg-muted/20 pb-4">
                            <CardTitle className="text-lg">Ideation chat</CardTitle>
                            <CardDescription>
                                Pulse merges your feed signals (expand <strong className="text-foreground">Signals for this chat</strong> to choose feeds) with
                                optional notes, then responds in Markdown (snapshot, concepts, wildcards).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col gap-4 pt-4">
                            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2">
                                <div className="space-y-0.5">
                                    <Label htmlFor="pulse_include_digest" className="text-sm font-medium">
                                        Include today&apos;s digest in chat
                                    </Label>
                                    <p className="text-muted-foreground text-xs">
                                        When on, the model sees your generated tweets, Shorts, and YouTube ideas for today.
                                    </p>
                                </div>
                                <Switch
                                    id="pulse_include_digest"
                                    checked={includeDailyDigest}
                                    onCheckedChange={setIncludeDailyDigest}
                                    disabled={!canUseAgent || loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pulse_context">Extra notes (optional)</Label>
                                <Textarea
                                    id="pulse_context"
                                    value={context}
                                    onChange={(e) => setContext(e.target.value)}
                                    placeholder="Paste competitor notes, audience constraints, or a one-off API snippet…"
                                    disabled={!canUseAgent || loading}
                                    rows={3}
                                    className="resize-none text-sm"
                                />
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border bg-muted/20 p-3">
                                {messages.length === 0 ? (
                                    <div className="space-y-3">
                                        <p className="text-muted-foreground text-sm">Start from a prompt:</p>
                                        <div className="flex flex-col gap-2">
                                            {STARTERS.map((s) => (
                                                <Button
                                                    key={s}
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-auto justify-start whitespace-normal py-2 text-left text-xs leading-snug"
                                                    disabled={!canUseAgent || loading}
                                                    onClick={() => setInput(s)}
                                                >
                                                    {s}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {messages.map((m, idx) => (
                                            <div key={`${idx}-${m.role}`} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                                                {m.role === 'user' ? (
                                                    <div className="max-w-[92%] whitespace-pre-wrap rounded-2xl bg-primary/10 px-4 py-2.5 text-sm">
                                                        {m.content}
                                                    </div>
                                                ) : (
                                                    <div className="max-w-[92%] rounded-2xl border bg-card px-4 py-3 shadow-sm">
                                                        <AgentMarkdown content={m.content} />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pulse_message">Message</Label>
                                <Textarea
                                    id="pulse_message"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="e.g. What are the top 5 timely topics from our feeds for Shorts this week?"
                                    disabled={!canUseAgent || loading}
                                    rows={3}
                                    className="resize-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (!input.trim() || !canUseAgent || loading) return;
                                            void runChat(input.trim());
                                            setInput('');
                                        }
                                    }}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    type="button"
                                    className="gap-2 rounded-xl"
                                    onClick={() => {
                                        if (!input.trim()) return;
                                        void runChat(input.trim());
                                        setInput('');
                                    }}
                                    disabled={!canUseAgent || loading || !input.trim()}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            Thinking…
                                        </>
                                    ) : (
                                        <>
                                            <Send className="size-4" />
                                            Send
                                        </>
                                    )}
                                </Button>
                                <span className="text-muted-foreground text-xs">Enter to send · Shift+Enter for newline</span>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
