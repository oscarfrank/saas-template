import { useState, useEffect, useRef, useCallback } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Copy, FileText, Lightbulb, Loader2, Plus, ScrollText, Sparkles, Wand2, Youtube } from 'lucide-react';
import { toast } from 'sonner';

interface ScriptSearchItem {
    uuid: string;
    title: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Scripts', href: '/script' },
    { title: 'YouTube transcripts', href: '/script/transcripts' },
];

const DEFAULT_REVIEW_PROMPT = `I want you to write the best conversational youtube script for the review of my {{DEVICE}}. I will provide you with scripts from other videos, and my observations about the device. Make it conversational, no bulletpoints, just what I would read in front of the camera, not one sentence per line, not like a poem. You can add the headings for each section, do not add cues. Below are specs, scripts and my observations.`;

const DEFAULT_COMPARISON_PROMPT = `I want you to write the best conversational youtube script for a comparison of my {{DEVICE1}} & {{DEVICE2}}. I will provide you with scripts from other videos, and my observations about the devices. Make it conversational, no bulletpoints, just what I would read in front of the camera, not one sentence per line, not like a poem. You can add the headings for each section, do not add cues. Below are specs, scripts and my observations.`;

type Mode = 'review' | 'comparison';

export default function TranscriptsPage() {
    const tenantRouter = useTenantRouter();
    const [mode, setMode] = useState<Mode>('review');

    // Transcript fetcher
    const [urls, setUrls] = useState('');
    const [transcript, setTranscript] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [summary, setSummary] = useState<{ fetched: number; failed: number } | null>(null);

    // Review mode
    const [deviceName, setDeviceName] = useState('');
    const [specs, setSpecs] = useState('');
    const [observations, setObservations] = useState('');
    const [reviewPrompt, setReviewPrompt] = useState(DEFAULT_REVIEW_PROMPT);

    // Comparison mode
    const [device1Name, setDevice1Name] = useState('');
    const [device2Name, setDevice2Name] = useState('');
    const [specs1, setSpecs1] = useState('');
    const [specs2, setSpecs2] = useState('');
    const [review1, setReview1] = useState('');
    const [review2, setReview2] = useState('');
    const [comparisonPrompt, setComparisonPrompt] = useState(DEFAULT_COMPARISON_PROMPT);

    // Built output
    const [builtOutput, setBuiltOutput] = useState('');
    // OpenAI generation
    const [generatedScript, setGeneratedScript] = useState('');
    const [generatingScript, setGeneratingScript] = useState(false);
    // Fetch specs from URL (GSMArena)
    const [specsUrl, setSpecsUrl] = useState('');
    const [specs1Url, setSpecs1Url] = useState('');
    const [specs2Url, setSpecs2Url] = useState('');
    const [fetchingSpecsFor, setFetchingSpecsFor] = useState<'specs' | 'specs1' | 'specs2' | null>(null);
    // Insert from my scripts (device review picker)
    const [reviewPickerOpen, setReviewPickerOpen] = useState<'review1' | 'review2' | null>(null);
    const [scriptSearchQuery, setScriptSearchQuery] = useState('');
    const [scriptSearchResults, setScriptSearchResults] = useState<ScriptSearchItem[]>([]);
    const [scriptSearchLoading, setScriptSearchLoading] = useState(false);
    const [scriptContentLoading, setScriptContentLoading] = useState(false);
    const [creatingScript, setCreatingScript] = useState(false);
    const scriptSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Script ideas tab
    const [ideasTopic, setIdeasTopic] = useState('');
    const [ideasTone, setIdeasTone] = useState('conversational and engaging');
    const [ideasCount, setIdeasCount] = useState(10);
    const [ideasResult, setIdeasResult] = useState('');
    const [ideasLoading, setIdeasLoading] = useState(false);

    const handleFetch = async () => {
        const trimmed = urls.trim();
        if (!trimmed) {
            toast.error('Paste at least one YouTube URL.');
            return;
        }

        setLoading(true);
        setErrors([]);
        setSummary(null);
        setTranscript('');

        try {
            const url = tenantRouter.route('script.transcripts.fetch');
            const csrfToken =
                document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ urls: trimmed }),
            });

            const data = await res.json();

            if (!res.ok) {
                const msg = data.message ?? 'Failed to fetch transcripts';
                toast.error(msg);
                setErrors(Array.isArray(data.errors) ? data.errors : [msg]);
                return;
            }

            setTranscript(data.transcript ?? '');
            setErrors(data.errors ?? []);
            setSummary({ fetched: data.fetched ?? 0, failed: data.failed ?? 0 });

            if (data.fetched > 0) {
                toast.success(`Fetched ${data.fetched} transcript(s).`);
            }
            if ((data.failed ?? 0) > 0) {
                toast.warning(`${data.failed} video(s) could not be fetched.`);
            }
        } catch (e) {
            toast.error('Network error. Please try again.');
            setErrors(['Network error. Please try again.']);
        } finally {
            setLoading(false);
        }
    };

    const buildForAI = () => {
        const parts: string[] = [];

        if (mode === 'review') {
            const prompt = reviewPrompt.replace(/\{\{DEVICE\}\}/g, deviceName.trim() || 'Device');
            parts.push(prompt);
            parts.push('');
            parts.push('# SCRIPTS');
            parts.push(transcript || '(Paste transcripts above and click Get transcripts)');
            parts.push('');
            parts.push(`# ${deviceName.trim() || 'Device'} SPECS`);
            parts.push(specs.trim() || '(Add specs here)');
            parts.push('');
            parts.push('# My Observations');
            parts.push(observations.trim() || '(Add your observations here)');
        } else {
            const d1 = device1Name.trim() || 'Device 1';
            const d2 = device2Name.trim() || 'Device 2';
            const prompt = comparisonPrompt
                .replace(/\{\{DEVICE1\}\}/g, d1)
                .replace(/\{\{DEVICE2\}\}/g, d2);
            parts.push(prompt);
            parts.push('');
            parts.push('# SCRIPTS');
            parts.push(transcript || '(Paste transcripts above and click Get transcripts)');
            parts.push('');
            parts.push(`# ${d1} SPECS`);
            parts.push(specs1.trim() || '(Add specs here)');
            parts.push('');
            parts.push(`# ${d2} SPECS`);
            parts.push(specs2.trim() || '(Add specs here)');
            parts.push('');
            parts.push(`# ${d1} REVIEW`);
            parts.push(review1.trim() || '(Optional: paste your existing review if you have one)');
            parts.push('');
            parts.push(`# ${d2} REVIEW`);
            parts.push(review2.trim() || '(Optional: paste your existing review if you have one)');
            parts.push('');
            parts.push('# My Observations');
            parts.push(observations.trim() || '(Add your observations here)');
        }

        setBuiltOutput(parts.join('\n'));
        toast.success('Prompt built. Copy to clipboard when ready.');
    };

    const copyToClipboard = async () => {
        if (!builtOutput) return;
        try {
            await navigator.clipboard.writeText(builtOutput);
            toast.success('Copied to clipboard.');
        } catch {
            toast.error('Could not copy.');
        }
    };

    const handleGenerateWithOpenAI = async () => {
        if (!builtOutput.trim()) {
            toast.error('Build the prompt first, then generate.');
            return;
        }
        setGeneratingScript(true);
        setGeneratedScript('');
        try {
            const url = tenantRouter.route('script.transcripts.generate');
            const csrfToken =
                document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ prompt: builtOutput }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message ?? 'Failed to generate script.');
                return;
            }
            setGeneratedScript(data.script ?? '');
            toast.success('Script generated.');
        } catch (e) {
            toast.error('Network error. Please try again.');
        } finally {
            setGeneratingScript(false);
        }
    };

    const copyGeneratedScript = async () => {
        if (!generatedScript) return;
        try {
            await navigator.clipboard.writeText(generatedScript);
            toast.success('Copied to clipboard.');
        } catch {
            toast.error('Could not copy.');
        }
    };

    const handleCreateScript = async () => {
        if (!generatedScript.trim()) return;
        setCreatingScript(true);
        try {
            const url = tenantRouter.route('script.transcripts.create-script');
            const csrfToken =
                document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    title: 'Generated script',
                    content: generatedScript,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message ?? 'Failed to create script.');
                return;
            }
            const editUrl = data.edit_url;
            if (editUrl) {
                toast.success('Script created. Opening editor…');
                router.visit(editUrl);
            } else {
                toast.error('Unexpected response.');
            }
        } catch (e) {
            toast.error('Could not create script. Try again.');
        } finally {
            setCreatingScript(false);
        }
    };

    const handleGenerateIdeas = async () => {
        if (!ideasTopic.trim()) {
            toast.error('Enter a topic or niche first.');
            return;
        }
        setIdeasLoading(true);
        setIdeasResult('');
        try {
            const url = tenantRouter.route('script.transcripts.generate-ideas');
            const csrfToken =
                document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    topic: ideasTopic.trim(),
                    count: ideasCount,
                    tone: ideasTone.trim() || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message ?? 'Failed to generate ideas.');
                return;
            }
            setIdeasResult(data.ideas ?? '');
            toast.success('Ideas generated.');
        } catch (e) {
            toast.error('Could not generate ideas. Try again.');
        } finally {
            setIdeasLoading(false);
        }
    };

    const fetchScriptSearch = useCallback(
        async (q: string) => {
            const base = tenantRouter.route('script.transcripts.search-my-scripts');
            const url = q.trim() ? `${base}?q=${encodeURIComponent(q.trim())}` : base;
            setScriptSearchLoading(true);
            try {
                const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
                const data = await res.json();
                setScriptSearchResults(Array.isArray(data.scripts) ? data.scripts : []);
            } catch {
                setScriptSearchResults([]);
            } finally {
                setScriptSearchLoading(false);
            }
        },
        [tenantRouter]
    );

    useEffect(() => {
        if (reviewPickerOpen === null) return;
        if (scriptSearchTimeout.current) clearTimeout(scriptSearchTimeout.current);
        scriptSearchTimeout.current = setTimeout(() => {
            fetchScriptSearch(scriptSearchQuery);
        }, 300);
        return () => {
            if (scriptSearchTimeout.current) clearTimeout(scriptSearchTimeout.current);
        };
    }, [scriptSearchQuery, reviewPickerOpen, fetchScriptSearch]);

    const handleOpenReviewPicker = (which: 'review1' | 'review2') => {
        setReviewPickerOpen(which);
        setScriptSearchQuery('');
        fetchScriptSearch('');
    };

    const handleSelectScriptForReview = async (scriptUuid: string) => {
        const which = reviewPickerOpen;
        if (!which) return;
        setScriptContentLoading(true);
        try {
            const url = tenantRouter.route('script.content-as-text', { script: scriptUuid });
            const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
            const data = await res.json();
            const content = typeof data.content === 'string' ? data.content : '';
            if (which === 'review1') setReview1(content);
            else setReview2(content);
            setReviewPickerOpen(null);
            toast.success('Script inserted.');
        } catch {
            toast.error('Could not load script.');
        } finally {
            setScriptContentLoading(false);
        }
    };

    const handleFetchSpecsFromUrl = async (target: 'specs' | 'specs1' | 'specs2') => {
        const url =
            target === 'specs' ? specsUrl.trim() : target === 'specs1' ? specs1Url.trim() : specs2Url.trim();
        if (!url) {
            toast.error('Paste a GSMArena URL first.');
            return;
        }
        setFetchingSpecsFor(target);
        try {
            const apiUrl = tenantRouter.route('script.transcripts.fetch-specs');
            const csrfToken =
                document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ url }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message ?? 'Failed to fetch specs.');
                return;
            }
            const text = data.specs ?? '';
            const title = (data.title ?? '').trim();
            if (target === 'specs') {
                setSpecs(text);
                if (title && !deviceName.trim()) setDeviceName(title);
            } else if (target === 'specs1') {
                setSpecs1(text);
                if (title && !device1Name.trim()) setDevice1Name(title);
            } else {
                setSpecs2(text);
                if (title && !device2Name.trim()) setDevice2Name(title);
            }
            toast.success('Specs fetched.');
        } catch (e) {
            toast.error('Could not fetch specs. Try again.');
        } finally {
            setFetchingSpecsFor(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="YouTube transcripts" />
            <div className="relative flex h-full flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <Link href={tenantRouter.route('script.index')}>
                                <Button variant="ghost" size="sm" className="gap-1.5">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Scripts
                                </Button>
                            </Link>
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl flex items-center gap-2">
                            <Youtube className="h-8 w-8 text-red-500" />
                            YouTube transcripts
                        </h1>
                        <p className="text-muted-foreground max-w-xl text-sm md:text-base">
                            Fetch transcripts, build review or comparison prompts with specs, generate scripts with AI, or brainstorm video ideas—all in one place.
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="fetch" className="w-full space-y-6">
                    <TabsList className="grid w-full max-w-2xl grid-cols-3 h-auto gap-1 p-1">
                        <TabsTrigger value="fetch" className="gap-2 py-2.5 data-[state=active]:bg-background">
                            <ScrollText className="h-4 w-4 shrink-0" />
                            <span className="hidden sm:inline">1.</span> Get transcripts
                        </TabsTrigger>
                        <TabsTrigger value="build" className="gap-2 py-2.5 data-[state=active]:bg-background">
                            <Wand2 className="h-4 w-4 shrink-0" />
                            <span className="hidden sm:inline">2.</span> Build for AI
                        </TabsTrigger>
                        <TabsTrigger value="ideas" className="gap-2 py-2.5 data-[state=active]:bg-background">
                            <Lightbulb className="h-4 w-4 shrink-0" />
                            <span className="hidden sm:inline">3.</span> Script ideas
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="fetch" className="mt-0 space-y-6">
                        <Card className="border-border/80 shadow-sm">
                            <CardHeader className="space-y-1">
                                <Label htmlFor="urls">YouTube URLs</Label>
                                <p className="text-muted-foreground text-sm font-normal">
                                    Paste one or more video URLs (one per line). We&apos;ll fetch captions and combine them for your prompt.
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <textarea
                                    id="urls"
                                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[160px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder={'https://www.youtube.com/watch?v=...\nhttps://youtu.be/...'}
                                    value={urls}
                                    onChange={(e) => setUrls(e.target.value)}
                                    disabled={loading}
                                    rows={6}
                                />
                                {!urls.trim() && (
                                    <p className="text-muted-foreground text-xs">
                                        Tip: Use videos that have captions enabled (most public videos do).
                                    </p>
                                )}
                                <Button
                                    onClick={handleFetch}
                                    disabled={loading || !urls.trim()}
                                    className="gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Fetching…
                                        </>
                                    ) : (
                                        'Get transcripts'
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {(transcript || errors.length > 0 || summary) && (
                            <Card className="border-border/80 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                    <Label>Transcripts</Label>
                                    {summary && (
                                        <span className="text-muted-foreground text-sm">
                                            {summary.fetched} fetched, {summary.failed} failed
                                        </span>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {errors.length > 0 && (
                                        <ul className="text-destructive text-sm list-disc list-inside">
                                            {errors.map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    )}
                                    <textarea
                                        readOnly
                                        className="border-input bg-muted/50 ring-offset-background flex min-h-[240px] w-full rounded-md border px-3 py-2 font-mono text-sm focus-visible:outline-none disabled:cursor-default disabled:opacity-100"
                                        value={transcript}
                                        rows={14}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="build" className="mt-0 space-y-6">
                        <Card className="border-border/80 shadow-sm">
                            <CardHeader className="space-y-1">
                                <Label>Mode</Label>
                                <p className="text-muted-foreground text-sm font-normal">
                                    Choose a single device review or a two-device comparison, then add specs and observations.
                                </p>
                            </CardHeader>
                            <CardContent>
                                <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
                                    <TabsList className="grid w-full max-w-sm grid-cols-2">
                                        <TabsTrigger value="review">Single review</TabsTrigger>
                                        <TabsTrigger value="comparison">Comparison</TabsTrigger>
                                    </TabsList>
                                    <div className="mt-4 space-y-4">
                                        {mode === 'review' && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label htmlFor="deviceName">Device name</Label>
                                                    <input
                                                        id="deviceName"
                                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                                        placeholder="e.g. Samsung Galaxy S25 Ultra"
                                                        value={deviceName}
                                                        onChange={(e) => setDeviceName(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Prompt (use &#123;&#123;DEVICE&#125;&#125; for the device name)</Label>
                                                    <textarea
                                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[120px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                                        value={reviewPrompt}
                                                        onChange={(e) => setReviewPrompt(e.target.value)}
                                                        rows={5}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="specs">Specs</Label>
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="url"
                                                                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 flex-1 rounded-md border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                                                placeholder="Or paste GSMArena URL (e.g. gsmarena.com/phone-12345.php)"
                                                                value={specsUrl}
                                                                onChange={(e) => setSpecsUrl(e.target.value)}
                                                                disabled={fetchingSpecsFor !== null}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={!specsUrl.trim() || fetchingSpecsFor !== null}
                                                                onClick={() => handleFetchSpecsFromUrl('specs')}
                                                            >
                                                                {fetchingSpecsFor === 'specs' ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    'Fetch specs'
                                                                )}
                                                            </Button>
                                                        </div>
                                                        <textarea
                                                            id="specs"
                                                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                                            placeholder="Paste or type device specs here, or fetch from GSMArena URL above..."
                                                            value={specs}
                                                            onChange={(e) => setSpecs(e.target.value)}
                                                            rows={4}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="observations-review">My Observations</Label>
                                                    <textarea
                                                        id="observations-review"
                                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                                        placeholder="Your observations while testing..."
                                                        value={observations}
                                                        onChange={(e) => setObservations(e.target.value)}
                                                        rows={4}
                                                    />
                                                </div>
                                            </>
                                        )}
                                        {mode === 'comparison' && (
                                            <>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="device1Name">Device 1 name</Label>
                                                        <input
                                                            id="device1Name"
                                                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                                            placeholder="e.g. iPhone 16 Pro"
                                                            value={device1Name}
                                                            onChange={(e) => setDevice1Name(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="device2Name">Device 2 name</Label>
                                                        <input
                                                            id="device2Name"
                                                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                                            placeholder="e.g. Samsung S25 Ultra"
                                                            value={device2Name}
                                                            onChange={(e) => setDevice2Name(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Prompt (use &#123;&#123;DEVICE1&#125;&#125; and &#123;&#123;DEVICE2&#125;&#125;)</Label>
                                                    <textarea
                                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[120px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                                        value={comparisonPrompt}
                                                        onChange={(e) => setComparisonPrompt(e.target.value)}
                                                        rows={5}
                                                    />
                                                </div>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="specs1">Device 1 specs</Label>
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="url"
                                                                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 flex-1 rounded-md border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                                                    placeholder="GSMArena URL..."
                                                                    value={specs1Url}
                                                                    onChange={(e) => setSpecs1Url(e.target.value)}
                                                                    disabled={fetchingSpecsFor !== null}
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={!specs1Url.trim() || fetchingSpecsFor !== null}
                                                                    onClick={() => handleFetchSpecsFromUrl('specs1')}
                                                                >
                                                                    {fetchingSpecsFor === 'specs1' ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        'Fetch'
                                                                    )}
                                                                </Button>
                                                            </div>
                                                            <textarea
                                                                id="specs1"
                                                                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                                                placeholder="Specs or fetch from URL..."
                                                                value={specs1}
                                                                onChange={(e) => setSpecs1(e.target.value)}
                                                                rows={3}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="specs2">Device 2 specs</Label>
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="url"
                                                                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 flex-1 rounded-md border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                                                    placeholder="GSMArena URL..."
                                                                    value={specs2Url}
                                                                    onChange={(e) => setSpecs2Url(e.target.value)}
                                                                    disabled={fetchingSpecsFor !== null}
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={!specs2Url.trim() || fetchingSpecsFor !== null}
                                                                    onClick={() => handleFetchSpecsFromUrl('specs2')}
                                                                >
                                                                    {fetchingSpecsFor === 'specs2' ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        'Fetch'
                                                                    )}
                                                                </Button>
                                                            </div>
                                                            <textarea
                                                                id="specs2"
                                                                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                                                placeholder="Specs or fetch from URL..."
                                                                value={specs2}
                                                                onChange={(e) => setSpecs2(e.target.value)}
                                                                rows={3}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <Label htmlFor="review1">Device 1 review (optional)</Label>
                                                            <Popover open={reviewPickerOpen === 'review1'} onOpenChange={(open) => !open && setReviewPickerOpen(null)}>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0"
                                                                        onClick={() => handleOpenReviewPicker('review1')}
                                                                        aria-label="Insert from my scripts"
                                                                    >
                                                                        <Plus className="h-4 w-4" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-80 p-0" align="end">
                                                                    <div className="p-2 border-b">
                                                                        <input
                                                                            type="text"
                                                                            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2"
                                                                            placeholder="Search your scripts..."
                                                                            value={scriptSearchQuery}
                                                                            onChange={(e) => setScriptSearchQuery(e.target.value)}
                                                                            autoFocus
                                                                        />
                                                                    </div>
                                                                    <div className="max-h-60 overflow-y-auto p-1">
                                                                        {scriptContentLoading && (
                                                                            <div className="flex items-center justify-center py-4">
                                                                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                                                            </div>
                                                                        )}
                                                                        {!scriptContentLoading && scriptSearchLoading && scriptSearchResults.length === 0 && (
                                                                            <p className="text-muted-foreground py-4 text-center text-sm">Searching...</p>
                                                                        )}
                                                                        {!scriptContentLoading && !scriptSearchLoading && scriptSearchResults.length === 0 && (
                                                                            <p className="text-muted-foreground py-4 text-center text-sm">No scripts found. Type to search.</p>
                                                                        )}
                                                                        {!scriptContentLoading && scriptSearchResults.map((s) => (
                                                                            <button
                                                                                key={s.uuid}
                                                                                type="button"
                                                                                className="hover:bg-muted focus:bg-muted w-full rounded-md px-3 py-2 text-left text-sm"
                                                                                onClick={() => handleSelectScriptForReview(s.uuid)}
                                                                            >
                                                                                {s.title}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>
                                                        <textarea
                                                            id="review1"
                                                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                                            placeholder="Paste existing review or use + to insert from your scripts..."
                                                            value={review1}
                                                            onChange={(e) => setReview1(e.target.value)}
                                                            rows={3}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <Label htmlFor="review2">Device 2 review (optional)</Label>
                                                            <Popover open={reviewPickerOpen === 'review2'} onOpenChange={(open) => !open && setReviewPickerOpen(null)}>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0"
                                                                        onClick={() => handleOpenReviewPicker('review2')}
                                                                        aria-label="Insert from my scripts"
                                                                    >
                                                                        <Plus className="h-4 w-4" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-80 p-0" align="end">
                                                                    <div className="p-2 border-b">
                                                                        <input
                                                                            type="text"
                                                                            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2"
                                                                            placeholder="Search your scripts..."
                                                                            value={scriptSearchQuery}
                                                                            onChange={(e) => setScriptSearchQuery(e.target.value)}
                                                                            autoFocus
                                                                        />
                                                                    </div>
                                                                    <div className="max-h-60 overflow-y-auto p-1">
                                                                        {scriptContentLoading && (
                                                                            <div className="flex items-center justify-center py-4">
                                                                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                                                            </div>
                                                                        )}
                                                                        {!scriptContentLoading && scriptSearchLoading && scriptSearchResults.length === 0 && (
                                                                            <p className="text-muted-foreground py-4 text-center text-sm">Searching...</p>
                                                                        )}
                                                                        {!scriptContentLoading && !scriptSearchLoading && scriptSearchResults.length === 0 && (
                                                                            <p className="text-muted-foreground py-4 text-center text-sm">No scripts found. Type to search.</p>
                                                                        )}
                                                                        {!scriptContentLoading && scriptSearchResults.map((s) => (
                                                                            <button
                                                                                key={s.uuid}
                                                                                type="button"
                                                                                className="hover:bg-muted focus:bg-muted w-full rounded-md px-3 py-2 text-left text-sm"
                                                                                onClick={() => handleSelectScriptForReview(s.uuid)}
                                                                            >
                                                                                {s.title}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>
                                                        <textarea
                                                            id="review2"
                                                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                                            placeholder="Paste existing review or use + to insert from your scripts..."
                                                            value={review2}
                                                            onChange={(e) => setReview2(e.target.value)}
                                                            rows={3}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="observations-comp">My Observations</Label>
                                                    <textarea
                                                        id="observations-comp"
                                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                                        placeholder="Your observations while testing both devices..."
                                                        value={observations}
                                                        onChange={(e) => setObservations(e.target.value)}
                                                        rows={4}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </Tabs>
                            </CardContent>
                        </Card>

                        <Card className="border-border/80 shadow-sm">
                            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <Label>Output for AI</Label>
                                    <p className="text-muted-foreground text-sm font-normal">
                                        Build the prompt below, then copy it or generate a script with OpenAI.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={buildForAI} variant="default" size="sm">
                                        Build for AI
                                    </Button>
                                    <Button
                                        onClick={copyToClipboard}
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5"
                                        disabled={!builtOutput}
                                    >
                                        <Copy className="h-4 w-4" />
                                        Copy
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <textarea
                                    readOnly
                                    className="border-input bg-muted/50 ring-offset-background flex min-h-[280px] w-full rounded-md border px-3 py-2 font-mono text-sm focus-visible:outline-none disabled:cursor-default disabled:opacity-100"
                                    value={builtOutput}
                                    placeholder="Click “Build for AI” to generate the full prompt with scripts, specs, and observations. Then copy and paste into ChatGPT or your preferred AI."
                                    rows={14}
                                />
                                <div className="flex justify-start">
                                    <Button
                                        onClick={handleGenerateWithOpenAI}
                                        disabled={!builtOutput.trim() || generatingScript}
                                        variant="secondary"
                                        size="sm"
                                        className="gap-1.5"
                                    >
                                        {generatingScript ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Generating…
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-4 w-4" />
                                                Generate with OpenAI
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {generatedScript && (
                            <Card className="border-border/80 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div className="space-y-1">
                                        <Label>Generated script</Label>
                                        <p className="text-muted-foreground text-sm font-normal">
                                            Create a new script from this or copy to use elsewhere.
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleCreateScript}
                                            disabled={creatingScript}
                                            variant="default"
                                            size="sm"
                                            className="gap-1.5"
                                        >
                                            {creatingScript ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <FileText className="h-4 w-4" />
                                            )}
                                            Create script
                                        </Button>
                                        <Button
                                            onClick={copyGeneratedScript}
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5"
                                        >
                                            <Copy className="h-4 w-4" />
                                            Copy script
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <textarea
                                        readOnly
                                        className="border-input bg-muted/50 ring-offset-background flex min-h-[320px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none disabled:cursor-default disabled:opacity-100"
                                        value={generatedScript}
                                        rows={18}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="ideas" className="mt-0 space-y-6">
                        <Card className="border-border/80 shadow-sm">
                            <CardHeader className="space-y-1">
                                <Label>Generate video ideas</Label>
                                <p className="text-muted-foreground text-sm font-normal">
                                    Describe your channel topic or niche. We&apos;ll suggest YouTube video or script ideas you can turn into content.
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ideas-topic">Topic or niche</Label>
                                    <textarea
                                        id="ideas-topic"
                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                        placeholder="e.g. Tech reviews, productivity for students, cooking on a budget..."
                                        value={ideasTopic}
                                        onChange={(e) => setIdeasTopic(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="ideas-count">Number of ideas</Label>
                                        <select
                                            id="ideas-count"
                                            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                            value={ideasCount}
                                            onChange={(e) => setIdeasCount(Number(e.target.value))}
                                        >
                                            {[5, 10, 15, 20].map((n) => (
                                                <option key={n} value={n}>{n} ideas</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ideas-tone">Tone</Label>
                                        <input
                                            id="ideas-tone"
                                            type="text"
                                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                            placeholder="e.g. conversational, educational"
                                            value={ideasTone}
                                            onChange={(e) => setIdeasTone(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button
                                    onClick={handleGenerateIdeas}
                                    disabled={!ideasTopic.trim() || ideasLoading}
                                    className="gap-2"
                                >
                                    {ideasLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Generating…
                                        </>
                                    ) : (
                                        <>
                                            <Lightbulb className="h-4 w-4" />
                                            Generate ideas
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {ideasResult && (
                            <Card className="border-border/80 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div>
                                        <Label>Your ideas</Label>
                                        <p className="text-muted-foreground text-sm font-normal mt-0.5">
                                            Copy what you like or use one as a starting point for a script.
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 shrink-0"
                                        onClick={async () => {
                                            try {
                                                await navigator.clipboard.writeText(ideasResult);
                                                toast.success('Copied to clipboard.');
                                            } catch {
                                                toast.error('Could not copy.');
                                            }
                                        }}
                                    >
                                        <Copy className="h-4 w-4" />
                                        Copy
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <pre className="text-muted-foreground whitespace-pre-wrap rounded-md border bg-muted/30 p-4 font-sans text-sm">
                                        {ideasResult}
                                    </pre>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
