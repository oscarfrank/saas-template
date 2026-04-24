import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import axios from 'axios';
import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Copy, Loader2, RefreshCw, Sparkles, Wand2, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import type { PulseDigest, PulseDigestHistoryDay, PulseDigestIdea } from './types';

type Props = {
    digest: PulseDigest | null;
    digestDate: string | null;
    historyDays: PulseDigestHistoryDay[];
    historyLoading: boolean;
    openAiConfigured: boolean;
    digestRunning: boolean;
    onRun: (mode: 'full' | 'feeds' | 'ideas') => void;
    onSelectDate: (date: string) => void;
};

function statusBadge(status: string): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
    switch (status) {
        case 'completed':
            return { label: 'Done', variant: 'default' };
        case 'running':
            return { label: 'Running', variant: 'secondary' };
        case 'failed':
            return { label: 'Failed', variant: 'destructive' };
        case 'pending':
            return { label: 'Pending', variant: 'outline' };
        default:
            return { label: status, variant: 'outline' };
    }
}

function IdeaCard({
    idea,
    tone,
    onGenerateScript,
    scriptBusy,
}: {
    idea: PulseDigestIdea;
    tone: 'tw' | 'sh' | 'yt';
    onGenerateScript?: () => void;
    scriptBusy?: boolean;
}) {
    const text = `${idea.title}\n${idea.hook}${idea.angle ? `\n${idea.angle}` : ''}`;
    return (
        <div
            className={cn(
                'rounded-xl border p-4 shadow-sm transition-colors',
                tone === 'tw' && 'border-sky-500/15 bg-sky-500/[0.03]',
                tone === 'sh' && 'border-violet-500/15 bg-violet-500/[0.03]',
                tone === 'yt' && 'border-amber-500/15 bg-amber-500/[0.03]',
            )}
        >
            <p className="font-semibold leading-snug">{idea.title}</p>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{idea.hook}</p>
            {idea.angle && <p className="text-muted-foreground mt-2 text-xs italic">{idea.angle}</p>}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3 h-8 gap-1.5 text-xs"
                onClick={() => {
                    void navigator.clipboard.writeText(text);
                    toast.success('Copied to clipboard');
                }}
            >
                <Copy className="size-3.5" />
                Copy
            </Button>
            {onGenerateScript ? (
                <Button type="button" variant="secondary" size="sm" className="mt-2 h-8 gap-1.5 text-xs" onClick={onGenerateScript} disabled={Boolean(scriptBusy)}>
                    {scriptBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                    Script
                </Button>
            ) : null}
        </div>
    );
}

export function PulseDigestSection({
    digest,
    digestDate,
    historyDays,
    historyLoading,
    openAiConfigured,
    digestRunning,
    onRun,
    onSelectDate,
}: Props) {
    const tenantRouter = useTenantRouter();
    const [scriptIdea, setScriptIdea] = useState<PulseDigestIdea | null>(null);
    const [scriptText, setScriptText] = useState<string>('');
    const [scriptTitle, setScriptTitle] = useState<string>('');
    const [scriptOpen, setScriptOpen] = useState(false);
    const [scriptBusy, setScriptBusy] = useState(false);
    const [scriptDeepResearchEnabled, setScriptDeepResearchEnabled] = useState<boolean>(false);

    const generateShortScript = async (idea: PulseDigestIdea, shortIndex: number) => {
        if (!digest) return;
        setScriptBusy(true);
        try {
            const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
            const { data } = await axios.post<{ script?: { title?: string; text?: string }; message?: string; deep_research_enabled?: boolean }>(
                tenantRouter.route('cortex.agents.pulse.shorts.script'),
                {
                    title: idea.title,
                    hook: idea.hook,
                    angle: idea.angle ?? null,
                    intro_summary: digest.intro_summary ?? null,
                    digest_date: digest.digest_date,
                    short_index: shortIndex,
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
            const nextTitle = data.script?.title?.trim() ?? '';
            const nextText = data.script?.text?.trim() ?? '';
            if (nextTitle === '' || nextText === '') {
                throw new Error(data.message ?? 'Script response is empty.');
            }
            setScriptIdea(idea);
            setScriptTitle(nextTitle);
            setScriptText(nextText);
            setScriptDeepResearchEnabled(Boolean(data.deep_research_enabled));
            setScriptOpen(true);
        } catch (e) {
            if (axios.isAxiosError(e)) {
                toast.error((e.response?.data as { message?: string } | undefined)?.message ?? e.message ?? 'Could not generate script.');
            } else if (e instanceof Error) {
                toast.error(e.message);
            } else {
                toast.error('Could not generate script.');
            }
        } finally {
            setScriptBusy(false);
        }
    };

    const feedsBadge = digest ? statusBadge(digest.feeds_status) : null;
    const ideasBadge = digest ? statusBadge(digest.ideas_status) : null;

    const hasIdeas =
        digest &&
        digest.ideas_status === 'completed' &&
        (digest.tweets.length > 0 || digest.shorts.length > 0 || digest.youtube.length > 0);

    return (
        <Card className="overflow-hidden border-border/80 bg-gradient-to-br from-primary/[0.06] via-card to-card shadow-lg ring-1 ring-primary/10 dark:from-primary/10 dark:ring-primary/20">
            <CardHeader className="border-b border-border/60 bg-muted/30 pb-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/15 text-primary flex size-9 items-center justify-center rounded-xl ring-1 ring-primary/20">
                                <Sparkles className="size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl tracking-tight">Today&apos;s ideas</CardTitle>
                                <CardDescription className="mt-0.5">
                                    {digestDate
                                        ? `Digest for ${new Date(digestDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`
                                        : 'Pre-generated angles from your feeds'}
                                </CardDescription>
                            </div>
                        </div>
                        {digest && (
                            <div className="flex flex-wrap items-center gap-2 pt-2">
                                {feedsBadge && (
                                    <Badge variant={feedsBadge.variant}>
                                        Feeds: {feedsBadge.label}
                                    </Badge>
                                )}
                                {ideasBadge && (
                                    <Badge variant={ideasBadge.variant}>
                                        Ideas: {ideasBadge.label}
                                    </Badge>
                                )}
                                {digest.feeds_refreshed_at && (
                                    <span className="text-muted-foreground text-xs">
                                        Feeds refreshed {new Date(digest.feeds_refreshed_at).toLocaleTimeString()}
                                    </span>
                                )}
                                {digest.ideas_generated_at && (
                                    <span className="text-muted-foreground text-xs">
                                        · Ideas {new Date(digest.ideas_generated_at).toLocaleTimeString()}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                disabled={digestRunning}
                                onClick={() => onRun('feeds')}
                            >
                                {digestRunning ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                                Refresh feeds
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="gap-1.5"
                                disabled={digestRunning || !openAiConfigured}
                                onClick={() => onRun('ideas')}
                            >
                                <Wand2 className="size-3.5" />
                                Generate ideas
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                className="gap-1.5"
                                disabled={digestRunning || !openAiConfigured}
                                onClick={() => onRun('full')}
                            >
                                <Zap className="size-3.5" />
                                Full run
                            </Button>
                        </div>
                        <p className="text-muted-foreground max-w-xs text-right text-[11px] leading-snug">
                            Full run pulls feeds then generates tweets, Shorts, and long-form YouTube concepts. Schedule this in{' '}
                            <Link href={tenantRouter.route('cortex.agents.pulse.settings')} className="text-primary font-medium underline-offset-4 hover:underline">
                                Settings
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
                {digestRunning && (
                    <div className="flex items-center gap-3 rounded-xl border border-dashed bg-muted/40 px-4 py-6">
                        <Loader2 className="text-primary size-8 animate-spin" />
                        <div>
                            <p className="font-medium">Working on your digest…</p>
                            <p className="text-muted-foreground text-sm">This runs in the background. You can leave this page and come back.</p>
                        </div>
                    </div>
                )}

                {digest?.feeds_error && (
                    <AlertError title="Feed refresh failed" message={digest.feeds_error} />
                )}
                {digest?.ideas_error && (
                    <AlertError title="Idea generation failed" message={digest.ideas_error} />
                )}

                {!digestRunning && digest && digest.ideas_status === 'completed' && !hasIdeas && (
                    <p className="text-muted-foreground text-sm">Ideas completed but empty — try Generate ideas again after refreshing feeds.</p>
                )}

                {digest?.intro_summary && hasIdeas && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-relaxed">
                        <span className="text-primary font-medium">Snapshot — </span>
                        {digest.intro_summary}
                    </div>
                )}

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Past 7 days</p>
                        {historyLoading && <span className="text-muted-foreground text-xs">Loading…</span>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {historyDays.map((day) => {
                            const selected = digestDate === day.digest_date;
                            return (
                                <Button
                                    key={day.digest_date}
                                    type="button"
                                    variant={selected ? 'default' : 'outline'}
                                    size="sm"
                                    className="h-8 gap-1.5"
                                    onClick={() => onSelectDate(day.digest_date)}
                                >
                                    {day.label}
                                    {day.has_digest ? <CheckCircle2 className="size-3.5" /> : null}
                                </Button>
                            );
                        })}
                    </div>
                </div>

                {hasIdeas && digest && (
                    <Tabs defaultValue="tweets" className="w-full gap-4">
                        <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
                            <TabsTrigger value="tweets" className="gap-1.5">
                                Tweets
                                <span className="text-muted-foreground text-xs">({digest.tweets.length})</span>
                            </TabsTrigger>
                            <TabsTrigger value="shorts" className="gap-1.5">
                                Shorts
                                <span className="text-muted-foreground text-xs">({digest.shorts.length})</span>
                            </TabsTrigger>
                            <TabsTrigger value="youtube" className="gap-1.5">
                                YouTube
                                <span className="text-muted-foreground text-xs">({digest.youtube.length})</span>
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="tweets" className="mt-0">
                            <div className="h-[min(420px,50vh)] space-y-3 overflow-y-auto pr-1">
                                {digest.tweets.map((idea, i) => (
                                    <IdeaCard key={`tw-${i}`} idea={idea} tone="tw" />
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="shorts" className="mt-0">
                            <div className="h-[min(420px,50vh)] space-y-3 overflow-y-auto pr-1">
                                {digest.shorts.map((idea, i) => (
                                    <IdeaCard
                                        key={`sh-${i}`}
                                        idea={idea}
                                        tone="sh"
                                        onGenerateScript={() => void generateShortScript(idea, i)}
                                        scriptBusy={scriptBusy}
                                    />
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="youtube" className="mt-0">
                            <div className="h-[min(420px,50vh)] space-y-3 overflow-y-auto pr-1">
                                {digest.youtube.map((idea, i) => (
                                    <IdeaCard key={`yt-${i}`} idea={idea} tone="yt" />
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                )}

                {!digestRunning && !digest && (
                    <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-10 text-center">
                        <p className="text-muted-foreground text-sm">
                            No digest for today yet. Add feeds, then run <strong>Full run</strong> (or refresh feeds, then generate ideas).
                        </p>
                        <Button type="button" className="mt-4 gap-2" variant="secondary" asChild>
                            <Link href={tenantRouter.route('cortex.agents.pulse.feeds')}>Manage feeds</Link>
                        </Button>
                    </div>
                )}

                {!digestRunning && digest && digest.ideas_status !== 'completed' && !digest.feeds_error && !digest.ideas_error && (
                    <p className="text-muted-foreground text-center text-sm">
                        Use <strong>Refresh feeds</strong>, <strong>Generate ideas</strong>, or <strong>Full run</strong> to fill this space.
                    </p>
                )}
            </CardContent>
            <Dialog open={scriptOpen} onOpenChange={setScriptOpen}>
                <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Short script</DialogTitle>
                        <DialogDescription>
                            {scriptIdea ? `Generated from: ${scriptIdea.title}` : 'Generated script'}
                            {' · '}
                            {scriptDeepResearchEnabled ? 'Deep research enabled' : 'Deep research disabled'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg border bg-muted/20 p-4">
                        <h3 className="text-base font-semibold">{scriptTitle}</h3>
                        <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{scriptText}</p>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

function AlertError({ title, message }: { title: string; message: string }) {
    return (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
            <p className="font-medium text-destructive">{title}</p>
            <p className="text-muted-foreground mt-1 truncate text-xs" title={message}>
                {message}
            </p>
        </div>
    );
}
