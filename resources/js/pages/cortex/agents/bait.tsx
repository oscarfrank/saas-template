import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import axios from 'axios';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { AgentMarkdown } from '@/components/cortex/agent-markdown';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { Check, ChevronDown, Copy, Loader2, Sparkles, Type } from 'lucide-react';
import { CortexAgentSettingsMenu } from '@/components/cortex/cortex-agent-settings-menu';

type FramingToggle = 'None' | 'Polarizing Take' | 'Strong Opinion' | 'Contrarian Framing';
type Phase = 'analysis' | 'generation' | null;

interface Props {
    openAiConfigured: boolean;
    promptKey: string;
    promptLabel: string;
    promptDescription: string;
}

const FRAMING_OPTIONS: FramingToggle[] = ['None', 'Polarizing Take', 'Strong Opinion', 'Contrarian Framing'];

function extractBlock(raw: string, header: string): string {
    const pattern = new RegExp(`${header}\\s*[\\r\\n]+([\\s\\S]*?)(?:\\n\\s*[A-Z][A-Z\\s0-9-]{3,}\\n|$)`, 'i');
    const match = raw.match(pattern);

    return match?.[1]?.trim() ?? '';
}

function extractLine(block: string, prefix: string): string {
    const pattern = new RegExp(`^\\s*${prefix}\\s*:\\s*(.+)$`, 'im');
    const match = block.match(pattern);

    return match?.[1]?.trim() ?? '';
}

export default function BaitPage({ openAiConfigured, promptKey, promptLabel, promptDescription }: Props) {
    const tenantRouter = useTenantRouter();

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [{ title: 'Cortex', href: tenantRouter.route('cortex.index') }, { title: 'Bait', href: '' }],
        [tenantRouter],
    );

    const [script, setScript] = useState('');
    const [framingToggle, setFramingToggle] = useState<FramingToggle>('None');
    const [reviewBeforeCallTwo, setReviewBeforeCallTwo] = useState(true);
    const [phase, setPhase] = useState<Phase>(null);
    const [error, setError] = useState<string | null>(null);

    const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
    const [analysisEditor, setAnalysisEditor] = useState('');
    const [analysisPanelOpen, setAnalysisPanelOpen] = useState(true);
    const [result, setResult] = useState<string>('');
    const [eliminatedOpen, setEliminatedOpen] = useState(false);
    const [copiedWinner, setCopiedWinner] = useState(false);

    const busy = phase !== null;
    const canUseAgent = openAiConfigured;

    const winnerBlock = extractBlock(result, 'WINNER');
    const runnerOneBlock = extractBlock(result, 'RUNNER UP 1');
    const runnerTwoBlock = extractBlock(result, 'RUNNER UP 2');
    const eliminatedBlock = extractBlock(result, 'ELIMINATED TITLES');

    const winnerTitle = extractLine(winnerBlock, 'Title');
    const winnerWhy = extractLine(winnerBlock, 'Why it wins');

    const runnerOneTitle = extractLine(runnerOneBlock, 'Title');
    const runnerOneUse = extractLine(runnerOneBlock, 'Best used when');
    const runnerTwoTitle = extractLine(runnerTwoBlock, 'Title');
    const runnerTwoUse = extractLine(runnerTwoBlock, 'Best used when');

    const parseAnalysisEditor = (): Record<string, unknown> | null => {
        const trimmed = analysisEditor.trim();
        if (trimmed === '') {
            toast.error('Analysis JSON is empty.');

            return null;
        }

        try {
            const parsed = JSON.parse(trimmed) as unknown;
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                toast.error('Analysis must be a JSON object.');

                return null;
            }

            return parsed as Record<string, unknown>;
        } catch {
            toast.error('Analysis JSON is invalid. Fix it before generating.');

            return null;
        }
    };

    const callGenerate = async (analysisPayload: Record<string, unknown>) => {
        setPhase('generation');
        setError(null);

        try {
            const url = tenantRouter.route('cortex.agents.bait.generate');
            const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
            const { data } = await axios.post<{ result?: string; message?: string }>(
                url,
                {
                    script: script.trim(),
                    analysis: analysisPayload,
                    framing_toggle: framingToggle,
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

            const text = (data.result ?? '').trim();
            if (text === '') {
                throw new Error(data.message ?? 'No title output returned.');
            }

            setResult(text);
            setEliminatedOpen(false);
            toast.success('Titles generated and scored.');
        } catch (e) {
            if (axios.isAxiosError(e)) {
                const msg = (e.response?.data as { message?: string } | undefined)?.message ?? e.message ?? 'Generation failed.';
                setError(msg);
                toast.error(msg);
            } else {
                setError('Generation failed.');
                toast.error('Generation failed.');
            }
        } finally {
            setPhase(null);
        }
    };

    const runAnalyze = async () => {
        if (!script.trim()) {
            toast.error('Paste your full script first.');

            return;
        }

        setPhase('analysis');
        setError(null);
        setResult('');

        try {
            const url = tenantRouter.route('cortex.agents.bait.analyze');
            const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
            const { data } = await axios.post<{ analysis?: Record<string, unknown>; message?: string }>(
                url,
                { script: script.trim() },
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

            if (!data.analysis) {
                throw new Error(data.message ?? 'No analysis was returned.');
            }

            setAnalysis(data.analysis);
            setAnalysisEditor(JSON.stringify(data.analysis, null, 2));
            setAnalysisPanelOpen(true);

            if (reviewBeforeCallTwo) {
                setPhase(null);
                toast.success('Analysis complete. Review and continue to generation.');

                return;
            }

            await callGenerate(data.analysis);
        } catch (e) {
            if (axios.isAxiosError(e)) {
                const msg = (e.response?.data as { message?: string } | undefined)?.message ?? e.message ?? 'Analysis failed.';
                setError(msg);
                toast.error(msg);
            } else {
                setError('Analysis failed.');
                toast.error('Analysis failed.');
            }
            setPhase(null);
        }
    };

    const copyWinnerTitle = async () => {
        if (!winnerTitle) return;
        try {
            await navigator.clipboard.writeText(winnerTitle);
            setCopiedWinner(true);
            toast.success('Winner title copied.');
            setTimeout(() => setCopiedWinner(false), 1600);
        } catch {
            toast.error('Could not copy title. Please copy manually.');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bait - Cortex" />
            <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 pb-16 md:p-6">
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                                <Type className="size-5" />
                            </div>
                            <h1 className="text-2xl font-semibold tracking-tight">Bait</h1>
                        </div>
                        <CortexAgentSettingsMenu agentKey="bait" />
                    </div>
                    <p className="text-muted-foreground max-w-3xl text-sm">
                        {promptDescription ||
                            'Two-step title optimizer for full YouTube scripts: deep analysis first, then pattern generation, scoring, stress-test, and winner selection.'}
                    </p>
                </div>

                {!canUseAgent && (
                    <Alert variant="destructive">
                        <AlertTitle>AI not configured for this agent</AlertTitle>
                        <AlertDescription>
                            Open <strong>Settings → Agent settings</strong> and add the API key for your chosen provider, or set keys in{' '}
                            <code className="text-xs">.env</code>.
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Title generation input</CardTitle>
                        <CardDescription>Paste your full script, choose framing, then run Bait.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="bait_script">1. Full YouTube script</Label>
                            <Textarea
                                id="bait_script"
                                value={script}
                                onChange={(e) => setScript(e.target.value)}
                                placeholder="Paste full script text..."
                                rows={12}
                                disabled={!canUseAgent || busy}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>2. Framing toggle</Label>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {FRAMING_OPTIONS.map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setFramingToggle(opt)}
                                        disabled={!canUseAgent || busy}
                                        className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                                            framingToggle === opt ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/40'
                                        } ${(!canUseAgent || busy) ? 'pointer-events-none opacity-50' : ''}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium">Review analysis before Call 2</p>
                                <p className="text-muted-foreground text-xs">Lets you inspect/edit Call 1 JSON before title generation.</p>
                            </div>
                            <Switch checked={reviewBeforeCallTwo} onCheckedChange={setReviewBeforeCallTwo} disabled={!canUseAgent || busy} />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button type="button" onClick={() => void runAnalyze()} disabled={!canUseAgent || busy || !script.trim()}>
                                {busy ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        {phase === 'analysis' ? 'Analyzing your script...' : 'Generating and scoring titles...'}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 size-4" />
                                        {reviewBeforeCallTwo ? 'Run Call 1 (Analyze)' : 'Run full Bait flow'}
                                    </>
                                )}
                            </Button>

                            {analysis && reviewBeforeCallTwo && !busy && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        const parsed = parseAnalysisEditor();
                                        if (!parsed) return;
                                        void callGenerate(parsed);
                                    }}
                                >
                                    Generate and score titles
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {analysis && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Call 1 analysis JSON</CardTitle>
                            <CardDescription>Optional: review and correct this object before Call 2 runs.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Collapsible open={analysisPanelOpen} onOpenChange={setAnalysisPanelOpen}>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="mb-3 w-full justify-between">
                                        {analysisPanelOpen ? 'Hide analysis JSON' : 'Show analysis JSON'}
                                        <ChevronDown className={`size-4 transition-transform ${analysisPanelOpen ? 'rotate-180' : ''}`} />
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <Textarea
                                        value={analysisEditor}
                                        onChange={(e) => setAnalysisEditor(e.target.value)}
                                        rows={16}
                                        className="font-mono text-xs"
                                        disabled={busy}
                                    />
                                </CollapsibleContent>
                            </Collapsible>
                        </CardContent>
                    </Card>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {result && (
                    <section className="space-y-4">
                        <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Title strategy output</h2>

                        {winnerTitle && (
                            <Card className="border-primary/50 bg-primary/5">
                                <CardHeader>
                                    <div className="flex items-center justify-between gap-3">
                                        <CardTitle className="text-primary text-xs uppercase tracking-wide">Winner</CardTitle>
                                        <Button type="button" variant="outline" size="sm" onClick={() => void copyWinnerTitle()}>
                                            {copiedWinner ? (
                                                <>
                                                    <Check className="mr-1.5 size-4" />
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="mr-1.5 size-4" />
                                                    Copy title
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <CardDescription className="text-foreground text-xl font-semibold leading-snug">{winnerTitle}</CardDescription>
                                </CardHeader>
                                {winnerWhy && (
                                    <CardContent>
                                        <p className="text-sm leading-relaxed">{winnerWhy}</p>
                                    </CardContent>
                                )}
                            </Card>
                        )}

                        {(runnerOneTitle || runnerTwoTitle) && (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {runnerOneTitle && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-xs uppercase tracking-wide">Runner up 1</CardTitle>
                                            <CardDescription className="text-foreground font-medium">{runnerOneTitle}</CardDescription>
                                        </CardHeader>
                                        {runnerOneUse && (
                                            <CardContent>
                                                <p className="text-muted-foreground text-sm">{runnerOneUse}</p>
                                            </CardContent>
                                        )}
                                    </Card>
                                )}
                                {runnerTwoTitle && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-xs uppercase tracking-wide">Runner up 2</CardTitle>
                                            <CardDescription className="text-foreground font-medium">{runnerTwoTitle}</CardDescription>
                                        </CardHeader>
                                        {runnerTwoUse && (
                                            <CardContent>
                                                <p className="text-muted-foreground text-sm">{runnerTwoUse}</p>
                                            </CardContent>
                                        )}
                                    </Card>
                                )}
                            </div>
                        )}

                        {eliminatedBlock && (
                            <Card className="border-muted bg-muted/30">
                                <CardHeader>
                                    <CardTitle className="text-xs uppercase tracking-wide">Eliminated titles</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Collapsible open={eliminatedOpen} onOpenChange={setEliminatedOpen}>
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" className="w-full justify-between px-0">
                                                {eliminatedOpen ? 'Hide eliminated titles' : 'Show eliminated titles'}
                                                <ChevronDown className={`size-4 transition-transform ${eliminatedOpen ? 'rotate-180' : ''}`} />
                                            </Button>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <div className="text-muted-foreground mt-2 text-sm">
                                                <AgentMarkdown content={eliminatedBlock} />
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Full strategy output</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <AgentMarkdown content={result} />
                            </CardContent>
                        </Card>
                    </section>
                )}

                <p className="text-muted-foreground text-xs">
                    Agent metadata ({promptLabel}) is listed under{' '}
                    <Link href={tenantRouter.route('settings.organization.ai-prompts')} className="text-primary font-medium underline-offset-4 hover:underline">
                        Organization → AI prompts
                    </Link>{' '}
                    as <code className="rounded bg-muted px-1 py-0.5">{promptKey}</code>.
                </p>
            </div>
        </AppLayout>
    );
}
