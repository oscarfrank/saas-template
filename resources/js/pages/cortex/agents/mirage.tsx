import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { route } from 'ziggy-js';

import { ChevronLeft, ChevronRight, Download, Eye, FileText, Loader2, Sparkles, Wand2, Youtube, Zap } from 'lucide-react';
import { CortexAgentSettingsMenu } from '@/components/cortex/cortex-agent-settings-menu';
import { MirageReferencePickerDialog } from '@/components/cortex/mirage-reference-picker-dialog';

type MirageIdea = {
    id: string;
    title: string;
    thumb_text: string;
    rationale: string;
    image_prompt: string;
};

type ImageResult = {
    url?: string;
    revised_prompt?: string | null;
    error?: string;
};

type FocusKey = 'face' | 'product' | 'mixed' | 'scene';

type InputMode = 'script' | 'youtube' | 'prompt';

/** v2: default off; bump key so legacy `mirage_review_before_images` does not force review on. */
const MIRAGE_REVIEW_KEY = 'mirage_review_before_images_v2';

type IdeasSource = {
    input_mode: InputMode;
    youtube_title?: string | null;
};

interface MiragePageProps extends PageProps {
    tenant: { slug: string };
    referencePreferences: {
        use_default_face_reference: boolean;
        use_default_style_references: boolean;
    };
    [key: string]: unknown;
}

interface Props {
    openAiConfigured: boolean;
    promptKey: string;
    promptLabel: string;
    promptDescription: string;
    imageProvider?: string | null;
    imageProviderLabel?: string | null;
    referencePreferences: {
        use_default_face_reference: boolean;
        use_default_style_references: boolean;
    };
}

const MAX_REFERENCE_BYTES = 5 * 1024 * 1024;
const MAX_STYLE_SAMPLES = 3;
const REF_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';

const PHOTO_COUNTS = [2, 3, 4] as const;

const MIRAGE_SESSION_PHOTO_COUNT_KEY = 'mirage_session_photo_count';

const MIRAGE_SESSION_FOCUS_KEY = 'mirage_session_focus';

function readSessionPhotoCount(): (typeof PHOTO_COUNTS)[number] {
    if (typeof window === 'undefined') {
        return 2;
    }
    try {
        const raw = sessionStorage.getItem(MIRAGE_SESSION_PHOTO_COUNT_KEY);
        const n = raw !== null ? Number(raw) : NaN;
        if (PHOTO_COUNTS.includes(n as (typeof PHOTO_COUNTS)[number])) {
            return n as (typeof PHOTO_COUNTS)[number];
        }
    } catch {
        /* ignore */
    }

    return 2;
}

function readSessionFocus(): FocusKey {
    if (typeof window === 'undefined') {
        return 'mixed';
    }
    try {
        const raw = sessionStorage.getItem(MIRAGE_SESSION_FOCUS_KEY);
        if (raw === 'face' || raw === 'product' || raw === 'mixed' || raw === 'scene') {
            return raw;
        }
    } catch {
        /* ignore */
    }

    return 'mixed';
}

function safeDownloadBasename(title: string, index: number): string {
    const s = title
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48);
    return (s || 'mirage-thumbnail') + `-${index + 1}`;
}

async function downloadImageUrl(url: string, filenameBase: string): Promise<void> {
    if (url.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = url;
        const mime = /^data:([^;]+);/.exec(url)?.[1] ?? 'image/png';
        const ext =
            mime.includes('jpeg') || mime === 'image/jpg'
                ? 'jpg'
                : mime.includes('webp')
                  ? 'webp'
                  : mime.includes('gif')
                    ? 'gif'
                    : 'png';
        a.download = `${filenameBase}.${ext}`;
        a.rel = 'noopener';
        a.click();
        return;
    }

    try {
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        const blob = await res.blob();
        const type = blob.type || 'image/png';
        const ext = type.includes('jpeg') ? 'jpg' : type.includes('webp') ? 'webp' : type.includes('gif') ? 'gif' : 'png';
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `${filenameBase}.${ext}`;
        a.rel = 'noopener';
        a.click();
        URL.revokeObjectURL(objectUrl);
    } catch {
        toast.error('Could not download directly. Opening the image in a new tab — save from there.');
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}

const FOCUS_OPTIONS: { value: FocusKey; title: string; description: string }[] = [
    { value: 'face', title: 'Face', description: 'Reaction or talking head' },
    { value: 'product', title: 'Product', description: 'Gadget, screen, or object' },
    { value: 'mixed', title: 'Face + product', description: 'Both in the frame' },
    { value: 'scene', title: 'Scene', description: 'Place or mood, no face' },
];

export default function MiragePage({
    openAiConfigured,
    promptKey,
    promptLabel,
    promptDescription,
    imageProvider,
    imageProviderLabel,
    referencePreferences,
}: Props) {
    const tenantRouter = useTenantRouter();
    const { tenant } = usePage<MiragePageProps>().props;

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [{ title: 'Cortex', href: tenantRouter.route('cortex.index') }, { title: 'Mirage', href: '' }],
        [tenantRouter],
    );

    const [topic, setTopic] = useState('');
    const [inputMode, setInputMode] = useState<InputMode>('script');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [reviewBeforeImages, setReviewBeforeImages] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }
        try {
            return localStorage.getItem(MIRAGE_REVIEW_KEY) === '1';
        } catch {
            return false;
        }
    });
    const [lastSource, setLastSource] = useState<IdeasSource | null>(null);

    const [faceDataUrl, setFaceDataUrl] = useState<string | null>(null);
    const [productDataUrl, setProductDataUrl] = useState<string | null>(null);
    const [styleSampleDataUrls, setStyleSampleDataUrls] = useState<string[]>([]);
    const [faceLibraryOpen, setFaceLibraryOpen] = useState(false);
    const [styleLibraryOpen, setStyleLibraryOpen] = useState(false);
    const [useDefaultFace, setUseDefaultFace] = useState(referencePreferences.use_default_face_reference);
    const [useDefaultStyle, setUseDefaultStyle] = useState(referencePreferences.use_default_style_references);
    const [savingRefPrefs, setSavingRefPrefs] = useState(false);
    const [photoCount, setPhotoCount] = useState<(typeof PHOTO_COUNTS)[number]>(() => readSessionPhotoCount());
    const [focus, setFocus] = useState<FocusKey>(() => readSessionFocus());

    const [ideas, setIdeas] = useState<MirageIdea[]>([]);
    const [imageByIdeaId, setImageByIdeaId] = useState<Record<string, ImageResult>>({});

    const [phase, setPhase] = useState<'ideas' | 'images' | null>(null);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);

    const updateIdea = (id: string, patch: Partial<MirageIdea>) => {
        setIdeas((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    };

    const canUseAgent = openAiConfigured;
    const busy = phase !== null;

    const patchReferencePreferences = useCallback(
        async (patch: { use_default_face_reference?: boolean; use_default_style_references?: boolean }) => {
            const nextFace = patch.use_default_face_reference ?? useDefaultFace;
            const nextStyle = patch.use_default_style_references ?? useDefaultStyle;
            setSavingRefPrefs(true);
            try {
                const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
                const { data } = await axios.patch<{
                    preferences: { use_default_face_reference: boolean; use_default_style_references: boolean };
                }>(
                    route('cortex.agents.mirage.reference_preferences.update', { tenant: tenant.slug }),
                    {
                        use_default_face_reference: nextFace,
                        use_default_style_references: nextStyle,
                    },
                    {
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': csrf,
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );
                setUseDefaultFace(data.preferences.use_default_face_reference);
                setUseDefaultStyle(data.preferences.use_default_style_references);
            } catch {
                toast.error('Could not save library defaults preference.');
            } finally {
                setSavingRefPrefs(false);
            }
        },
        [tenant.slug, useDefaultFace, useDefaultStyle],
    );

    useEffect(() => {
        try {
            localStorage.setItem(MIRAGE_REVIEW_KEY, reviewBeforeImages ? '1' : '0');
        } catch {
            /* ignore */
        }
    }, [reviewBeforeImages]);

    useEffect(() => {
        try {
            sessionStorage.setItem(MIRAGE_SESSION_PHOTO_COUNT_KEY, String(photoCount));
        } catch {
            /* ignore */
        }
    }, [photoCount]);

    useEffect(() => {
        try {
            sessionStorage.setItem(MIRAGE_SESSION_FOCUS_KEY, focus);
        } catch {
            /* ignore */
        }
    }, [focus]);

    const resetAll = () => {
        setIdeas([]);
        setImageByIdeaId({});
        setPhase(null);
        setLastSource(null);
        setPreviewIndex(null);
    };

    const showImageGrid =
        ideas.length > 0 && (phase === 'images' || ideas.some((i) => imageByIdeaId[i.id] != null));

    const indicesWithImages = useMemo(
        () =>
            ideas
                .map((idea, i) => ({ i, url: imageByIdeaId[idea.id]?.url }))
                .filter((x): x is { i: number; url: string } => Boolean(x.url))
                .map((x) => x.i),
        [ideas, imageByIdeaId],
    );

    const stepPreview = useCallback(
        (delta: number) => {
            setPreviewIndex((prev) => {
                if (prev === null || indicesWithImages.length === 0) {
                    return prev;
                }
                const pos = indicesWithImages.indexOf(prev);
                if (pos < 0) {
                    return indicesWithImages[0] ?? null;
                }
                const nextPos = (pos + delta + indicesWithImages.length) % indicesWithImages.length;

                return indicesWithImages[nextPos];
            });
        },
        [indicesWithImages],
    );

    useEffect(() => {
        if (previewIndex === null) {
            return;
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                stepPreview(1);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                stepPreview(-1);
            }
        };
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [previewIndex, stepPreview]);

    useEffect(() => {
        if (previewIndex === null) {
            return;
        }
        const idea = ideas[previewIndex];
        if (!idea || !imageByIdeaId[idea.id]?.url) {
            setPreviewIndex(null);
        }
    }, [previewIndex, ideas, imageByIdeaId]);

    const handleDownloadThumbnail = useCallback(
        (ideaIndex: number) => {
            const idea = ideas[ideaIndex];
            const url = imageByIdeaId[idea.id]?.url;
            if (!url) {
                return;
            }
            void downloadImageUrl(url, safeDownloadBasename(idea.title, ideaIndex));
        },
        [ideas, imageByIdeaId],
    );

    const inputIsValid = (): boolean => {
        if (inputMode === 'youtube') {
            return youtubeUrl.trim() !== '';
        }

        return topic.trim() !== '';
    };

    const readImageFile = (file: File, kind: 'face' | 'product') => {
        if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
            toast.error('Use a JPEG, PNG, GIF, or WebP image.');
            return;
        }
        if (file.size > MAX_REFERENCE_BYTES) {
            toast.error('Each reference photo must be 5MB or smaller.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const s = reader.result;
            if (typeof s !== 'string' || !s.startsWith('data:image/')) {
                toast.error('Could not read that image.');
                return;
            }
            if (kind === 'face') setFaceDataUrl(s);
            else setProductDataUrl(s);
        };
        reader.readAsDataURL(file);
    };

    const readStyleSampleFile = (file: File) => {
        if (styleSampleDataUrls.length >= MAX_STYLE_SAMPLES) {
            toast.error(`You can add up to ${MAX_STYLE_SAMPLES} sample thumbnails.`);
            return;
        }
        if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
            toast.error('Use a JPEG, PNG, GIF, or WebP image.');
            return;
        }
        if (file.size > MAX_REFERENCE_BYTES) {
            toast.error('Each sample must be 5MB or smaller.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const s = reader.result;
            if (typeof s !== 'string' || !s.startsWith('data:image/')) {
                toast.error('Could not read that image.');
                return;
            }
            setStyleSampleDataUrls((prev) => (prev.length >= MAX_STYLE_SAMPLES ? prev : [...prev, s]));
        };
        reader.readAsDataURL(file);
    };

    const fetchIdeas = async (): Promise<MirageIdea[] | null> => {
        const url = tenantRouter.route('cortex.agents.mirage.ideas');
        const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

        const body: Record<string, unknown> = {
            input_mode: inputMode,
            idea_count: photoCount,
            focus,
            face_reference: faceDataUrl ?? undefined,
            product_reference: productDataUrl ?? undefined,
            style_references: styleSampleDataUrls.length > 0 ? styleSampleDataUrls : undefined,
        };
        if (inputMode === 'youtube') {
            body.youtube_url = youtubeUrl.trim();
            body.input = '';
        } else {
            body.input = topic.trim();
        }

        const { data } = await axios.post<{ ideas?: MirageIdea[]; message?: string; source?: IdeasSource }>(
            url,
            body,
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

        if (!data.ideas?.length) {
            toast.error(data.message ?? 'No thumbnails were returned. Try again.');
            return null;
        }

        if (data.source) {
            setLastSource(data.source);
        }

        return data.ideas;
    };

    const fetchImages = async (list: MirageIdea[]) => {
        const url = tenantRouter.route('cortex.agents.mirage.images');
        const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

        const { data } = await axios.post<{
            results?: Array<{ idea_id?: string | null; url?: string; revised_prompt?: string | null; error?: string }>;
        }>(
            url,
            {
                items: list.map((i) => ({
                    idea_id: i.id,
                    image_prompt: i.image_prompt,
                })),
                face_reference: faceDataUrl ?? undefined,
                product_reference: productDataUrl ?? undefined,
                style_references: styleSampleDataUrls.length > 0 ? styleSampleDataUrls : undefined,
            },
            {
                timeout: 600_000,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            },
        );

        const results = data.results ?? [];
        setImageByIdeaId((prev) => {
            const out = { ...prev };
            for (const r of results) {
                const id = r.idea_id ?? '';
                if (!id) continue;
                if (r.error) {
                    out[id] = { error: r.error };
                } else if (r.url) {
                    out[id] = { url: r.url, revised_prompt: r.revised_prompt };
                }
            }
            return out;
        });

        const ok = results.filter((r) => r.url).length;
        const bad = results.filter((r) => r.error).length;
        if (ok) toast.success(`Created ${ok} image${ok === 1 ? '' : 's'}.`);
        if (bad) toast.error(`${bad} image${bad === 1 ? '' : 's'} could not be created.`);
    };

    const generateIdeasOnly = async () => {
        if (!inputIsValid()) {
            if (inputMode === 'youtube') {
                toast.error('Paste a YouTube watch URL or video ID.');
            } else {
                toast.error(
                    inputMode === 'prompt'
                        ? 'Add a short creative brief (tone, angle, or niche).'
                        : 'Paste a script, outline, or topic.',
                );
            }
            return;
        }

        setPhase('ideas');
        setIdeas([]);
        setImageByIdeaId({});
        setLastSource(null);

        try {
            const list = await fetchIdeas();
            if (!list) {
                setPhase(null);
                return;
            }

            setIdeas(list);
            setPhase(null);
        } catch (e) {
            setPhase(null);
            if (axios.isAxiosError(e)) {
                const msg = (e.response?.data as { message?: string } | undefined)?.message ?? e.message ?? 'Something went wrong.';
                toast.error(msg);
            } else {
                toast.error('Something went wrong.');
            }
        }
    };

    const runFullPipeline = async () => {
        if (!inputIsValid()) {
            if (inputMode === 'youtube') {
                toast.error('Paste a YouTube watch URL or video ID.');
            } else {
                toast.error(
                    inputMode === 'prompt'
                        ? 'Add a short creative brief (tone, angle, or niche).'
                        : 'Paste a script, outline, or topic.',
                );
            }
            return;
        }

        setPhase('ideas');
        setIdeas([]);
        setImageByIdeaId({});
        setLastSource(null);

        try {
            const list = await fetchIdeas();
            if (!list) {
                setPhase(null);
                return;
            }

            setIdeas(list);
            setPhase('images');
            await fetchImages(list);
            setPhase(null);
        } catch (e) {
            setPhase(null);
            if (axios.isAxiosError(e)) {
                const msg = (e.response?.data as { message?: string } | undefined)?.message ?? e.message ?? 'Something went wrong.';
                toast.error(msg);
            } else {
                toast.error('Something went wrong.');
            }
        }
    };

    const runPrimaryAction = () => {
        if (reviewBeforeImages) {
            void generateIdeasOnly();
        } else {
            void runFullPipeline();
        }
    };

    const generateImagesFromReview = async () => {
        if (ideas.length === 0) {
            return;
        }
        const missing = ideas.some((i) => !i.image_prompt.trim());
        if (missing) {
            toast.error('Each idea needs an image prompt before creating images.');
            return;
        }

        setPhase('images');
        try {
            await fetchImages(ideas);
            setPhase(null);
        } catch (e) {
            setPhase(null);
            if (axios.isAxiosError(e)) {
                const msg = (e.response?.data as { message?: string } | undefined)?.message ?? e.message ?? 'Something went wrong.';
                toast.error(msg);
            } else {
                toast.error('Something went wrong.');
            }
        }
    };

    const hasRightPanelContent =
        (ideas.length > 0 && reviewBeforeImages) || showImageGrid;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mirage - Cortex" />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-3 pb-3 pt-2 md:px-4 md:pt-3 lg:h-[calc(100dvh-6.25rem)] lg:min-h-0 lg:max-h-[calc(100dvh-6.25rem)] lg:overflow-hidden">
                <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/50 px-0.5 pb-3 pt-1">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
                            <Wand2 className="size-4" />
                        </div>
                        <div className="min-w-0 space-y-1">
                            <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">Mirage</h1>
                            {promptDescription ? (
                                <p className="text-muted-foreground line-clamp-2 max-w-xl text-[11px] leading-relaxed md:text-xs">
                                    {promptDescription}
                                </p>
                            ) : imageProviderLabel ? (
                                <p className="text-muted-foreground truncate text-[11px] leading-snug md:text-xs">{imageProviderLabel}</p>
                            ) : null}
                        </div>
                    </div>
                    <CortexAgentSettingsMenu agentKey="mirage" className="shrink-0 self-start pt-0.5" />
                </header>

                {!canUseAgent && (
                    <Alert variant="destructive" className="shrink-0 py-2">
                        <AlertTitle className="text-sm">Chat / ideas not configured</AlertTitle>
                        <AlertDescription className="text-xs">
                            Set agents under <strong>Settings → Agent settings</strong>; images under Image generation.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4 lg:overflow-hidden">
                    <div className="min-h-0 overflow-y-auto overflow-x-hidden lg:max-h-full lg:pr-1">
                        <Card className="border-muted/80 shadow-sm">
                            <CardContent className="space-y-3 p-3 sm:p-4">
                        <div className="bg-muted/40 flex flex-row items-center justify-between gap-2 rounded-lg border px-2.5 py-2">
                            <Label htmlFor="mirage_review" className="cursor-pointer text-xs font-medium leading-tight">
                                Review prompts before images
                            </Label>
                            <Switch
                                id="mirage_review"
                                checked={reviewBeforeImages}
                                onCheckedChange={setReviewBeforeImages}
                                disabled={!canUseAgent || busy}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Source</Label>
                            <Tabs
                                value={inputMode}
                                onValueChange={(v) => setInputMode(v as InputMode)}
                                className="w-full"
                            >
                                <TabsList className="grid h-8 w-full grid-cols-3 gap-0.5 p-0.5">
                                    <TabsTrigger value="script" className="gap-1 px-1.5 py-1 text-[11px] sm:text-xs">
                                        <FileText className="size-3 shrink-0" />
                                        <span className="truncate">Script</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="youtube" className="gap-1 px-1.5 py-1 text-[11px] sm:text-xs">
                                        <Youtube className="size-3 shrink-0" />
                                        YouTube
                                    </TabsTrigger>
                                    <TabsTrigger value="prompt" className="gap-1 px-1.5 py-1 text-[11px] sm:text-xs">
                                        <Zap className="size-3 shrink-0" />
                                        Brief
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="script" className="mt-2 space-y-1">
                                    <Textarea
                                        id="mirage_topic_script"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="Script, outline, or one sentence…"
                                        disabled={!canUseAgent || busy}
                                        rows={4}
                                        className="min-h-[5.5rem] resize-y text-sm"
                                    />
                                </TabsContent>
                                <TabsContent value="youtube" className="mt-2 space-y-1">
                                    <Input
                                        id="mirage_youtube_url"
                                        type="url"
                                        value={youtubeUrl}
                                        onChange={(e) => setYoutubeUrl(e.target.value)}
                                        placeholder="youtube.com/watch?v=… or youtu.be/…"
                                        disabled={!canUseAgent || busy}
                                        autoComplete="off"
                                        className="h-9 font-mono text-xs"
                                    />
                                </TabsContent>
                                <TabsContent value="prompt" className="mt-2 space-y-1">
                                    <Textarea
                                        id="mirage_topic_prompt"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="Tone, niche, style (short)…"
                                        disabled={!canUseAgent || busy}
                                        rows={3}
                                        className="min-h-[4.5rem] resize-y text-sm"
                                    />
                                </TabsContent>
                            </Tabs>
                        </div>

                        {lastSource?.youtube_title ? (
                            <div className="flex flex-wrap items-center gap-1.5 rounded border border-dashed px-2 py-1.5 text-[10px]">
                                <Badge variant="outline" className="gap-1">
                                    <Youtube className="size-3" />
                                    Transcript loaded
                                </Badge>
                                <span className="text-muted-foreground line-clamp-2">{lastSource.youtube_title}</span>
                            </div>
                        ) : null}

                        <Accordion
                            type="single"
                            collapsible
                            className="rounded-lg border-2 border-violet-500/45 bg-violet-500/[0.07] px-2 shadow-sm ring-1 ring-violet-500/20 dark:border-violet-400/40 dark:bg-violet-500/10 dark:ring-violet-400/15"
                        >
                            <AccordionItem value="refs" className="border-0">
                                <AccordionTrigger className="py-2 text-xs font-semibold text-violet-950 hover:no-underline dark:text-violet-100">
                                    References and style (optional)
                                </AccordionTrigger>
                                <AccordionContent className="space-y-3 pb-2">
                                    <div className="bg-muted/30 space-y-2 rounded-md border px-2.5 py-2">
                                        <p className="text-[10px] font-medium text-muted-foreground">Saved library defaults</p>
                                        <p className="text-muted-foreground text-[10px] leading-snug">
                                            When on, Mirage uses your default face or style from Library if you leave that slot empty for
                                            this run.
                                        </p>
                                        <div className="flex flex-row items-center justify-between gap-2">
                                            <Label
                                                htmlFor="mirage_use_def_face"
                                                className="cursor-pointer text-[10px] font-normal leading-tight"
                                            >
                                                Auto-use default face
                                            </Label>
                                            <Switch
                                                id="mirage_use_def_face"
                                                checked={useDefaultFace}
                                                onCheckedChange={(v) => void patchReferencePreferences({ use_default_face_reference: v })}
                                                disabled={!canUseAgent || busy || savingRefPrefs}
                                            />
                                        </div>
                                        <div className="flex flex-row items-center justify-between gap-2">
                                            <Label
                                                htmlFor="mirage_use_def_style"
                                                className="cursor-pointer text-[10px] font-normal leading-tight"
                                            >
                                                Auto-use default style sample
                                            </Label>
                                            <Switch
                                                id="mirage_use_def_style"
                                                checked={useDefaultStyle}
                                                onCheckedChange={(v) =>
                                                    void patchReferencePreferences({ use_default_style_references: v })
                                                }
                                                disabled={!canUseAgent || busy || savingRefPrefs}
                                            />
                                        </div>
                                    </div>
                                    {imageProvider === 'dall_e_3' && (faceDataUrl || productDataUrl || styleSampleDataUrls.length > 0) ? (
                                        <Alert className="py-2">
                                            <AlertTitle className="text-xs">DALL·E 3</AlertTitle>
                                            <AlertDescription className="text-[10px] leading-snug">
                                                Refs inform ideas only — use GPT Image 1 to pass images into renders.
                                            </AlertDescription>
                                        </Alert>
                                    ) : null}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label htmlFor="mirage_face_ref" className="text-[10px]">
                                                Face
                                            </Label>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Input
                                                    id="mirage_face_ref"
                                                    type="file"
                                                    accept={REF_ACCEPT}
                                                    disabled={!canUseAgent || busy}
                                                    className="cursor-pointer text-sm file:mr-2"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0];
                                                        if (f) readImageFile(f, 'face');
                                                        e.target.value = '';
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-xs"
                                                    disabled={!canUseAgent || busy}
                                                    onClick={() => setFaceLibraryOpen(true)}
                                                >
                                                    Library
                                                </Button>
                                                <MirageReferencePickerDialog
                                                    open={faceLibraryOpen}
                                                    onOpenChange={setFaceLibraryOpen}
                                                    kind="face"
                                                    title="Face reference library"
                                                    disabled={!canUseAgent || busy}
                                                    onSelectDataUrl={(dataUrl) => setFaceDataUrl(dataUrl)}
                                                />
                                                {faceDataUrl ? (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setFaceDataUrl(null)}
                                                        disabled={busy}
                                                    >
                                                        Remove
                                                    </Button>
                                                ) : null}
                                            </div>
                                            {faceDataUrl ? (
                                                <div className="bg-muted/50 relative mt-1 aspect-square max-h-20 overflow-hidden rounded border">
                                                    <img src={faceDataUrl} alt="" className="size-full object-cover" />
                                                </div>
                                            ) : null}
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="mirage_product_ref" className="text-[10px]">
                                                Product
                                            </Label>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Input
                                                    id="mirage_product_ref"
                                                    type="file"
                                                    accept={REF_ACCEPT}
                                                    disabled={!canUseAgent || busy}
                                                    className="cursor-pointer text-sm file:mr-2"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0];
                                                        if (f) readImageFile(f, 'product');
                                                        e.target.value = '';
                                                    }}
                                                />
                                                {productDataUrl ? (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setProductDataUrl(null)}
                                                        disabled={busy}
                                                    >
                                                        Remove
                                                    </Button>
                                                ) : null}
                                            </div>
                                            {productDataUrl ? (
                                                <div className="bg-muted/50 relative mt-1 aspect-square max-h-20 overflow-hidden rounded border">
                                                    <img src={productDataUrl} alt="" className="size-full object-cover" />
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="space-y-1 border-t pt-2">
                                        <Label htmlFor="mirage_style_samples" className="text-[10px] font-medium">
                                            Style samples (max {MAX_STYLE_SAMPLES})
                                        </Label>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {styleSampleDataUrls.length < MAX_STYLE_SAMPLES ? (
                                                <Input
                                                    id="mirage_style_samples"
                                                    type="file"
                                                    accept={REF_ACCEPT}
                                                    disabled={!canUseAgent || busy}
                                                    className="max-w-xs cursor-pointer text-sm file:mr-2"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0];
                                                        if (f) readStyleSampleFile(f);
                                                        e.target.value = '';
                                                    }}
                                                />
                                            ) : null}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs"
                                                disabled={!canUseAgent || busy}
                                                onClick={() => setStyleLibraryOpen(true)}
                                            >
                                                Library
                                            </Button>
                                            <MirageReferencePickerDialog
                                                open={styleLibraryOpen}
                                                onOpenChange={setStyleLibraryOpen}
                                                kind="style"
                                                title="Style reference library"
                                                disabled={!canUseAgent || busy}
                                                selectDisabled={styleSampleDataUrls.length >= MAX_STYLE_SAMPLES}
                                                onSelectDataUrl={(dataUrl) =>
                                                    setStyleSampleDataUrls((prev) =>
                                                        prev.length >= MAX_STYLE_SAMPLES ? prev : [...prev, dataUrl],
                                                    )
                                                }
                                            />
                                        </div>
                                        {styleSampleDataUrls.length > 0 ? (
                                            <ul className="mt-1 flex flex-wrap gap-1.5">
                                                {styleSampleDataUrls.map((src, idx) => (
                                                    <li key={`${idx}-${src.slice(0, 32)}`} className="relative">
                                                        <div className="bg-muted/50 relative aspect-video w-16 overflow-hidden rounded border">
                                                            <img src={src} alt="" className="size-full object-cover" />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            className="mt-0.5 h-6 w-full max-w-16 px-0 text-[10px]"
                                                            disabled={busy}
                                                            onClick={() =>
                                                                setStyleSampleDataUrls((prev) => prev.filter((_, i) => i !== idx))
                                                            }
                                                        >
                                                            ×
                                                        </Button>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        <div className="flex flex-wrap items-end gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Count</Label>
                                <ToggleGroup
                                    type="single"
                                    value={String(photoCount)}
                                    onValueChange={(v) => {
                                        if (v) setPhotoCount(Number(v) as (typeof PHOTO_COUNTS)[number]);
                                    }}
                                    disabled={!canUseAgent || busy}
                                    variant="outline"
                                    className="h-8 justify-stretch"
                                >
                                    {PHOTO_COUNTS.map((n) => (
                                        <ToggleGroupItem key={n} value={String(n)} className="px-3 py-1 text-xs">
                                            {n}
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                                <Label className="text-xs font-medium">Focus</Label>
                                <div className="flex flex-wrap gap-1">
                                    {FOCUS_OPTIONS.map((opt) => {
                                        const selected = focus === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                disabled={!canUseAgent || busy}
                                                onClick={() => setFocus(opt.value)}
                                                className={cn(
                                                    'rounded-md border px-2 py-1 text-left text-[10px] transition-colors',
                                                    selected ? 'border-primary bg-primary/10' : 'border-muted bg-card',
                                                    (!canUseAgent || busy) && 'pointer-events-none opacity-50',
                                                )}
                                            >
                                                <span className="font-medium">{opt.title}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Button
                                type="button"
                                className="w-full sm:w-auto"
                                onClick={() => void runPrimaryAction()}
                                disabled={!canUseAgent || busy || !inputIsValid()}
                            >
                                {busy && phase === 'ideas' ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        {reviewBeforeImages ? 'Writing ideas…' : 'Preparing…'}
                                    </>
                                ) : busy && phase === 'images' ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Creating images…
                                    </>
                                ) : reviewBeforeImages ? (
                                    <>
                                        <Sparkles className="mr-2 size-4" />
                                        Generate ideas
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="mr-2 size-4" />
                                        Generate thumbnails
                                    </>
                                )}
                            </Button>
                            {ideas.length > 0 && !busy && (
                                <Button type="button" variant="ghost" size="sm" onClick={resetAll} className="text-muted-foreground">
                                    Clear
                                </Button>
                            )}
                        </div>
                            </CardContent>
                        </Card>
                        <p className="text-muted-foreground mt-2 px-0.5 text-[10px] leading-tight">
                            {promptLabel}
                            {' · '}
                            <Link href={tenantRouter.route('settings.organization.ai-prompts')} className="text-primary hover:underline">
                                AI prompts
                            </Link>
                            {' · '}
                            <code className="rounded bg-muted px-1">{promptKey}</code>
                        </p>
                    </div>

                    <div className="border-border/50 flex min-h-0 flex-col overflow-hidden lg:min-h-[12rem] lg:border-l lg:pl-4">
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                            {!hasRightPanelContent ? (
                                <div className="text-muted-foreground flex h-full min-h-[140px] flex-col items-center justify-center rounded-lg border border-dashed p-3 text-center text-[11px] leading-relaxed">
                                    <p className="max-w-[14rem]">
                                        Output lands here: review (if enabled) and thumbnails — kept beside the form on desktop.
                                    </p>
                                </div>
                            ) : null}

                            {ideas.length > 0 && reviewBeforeImages && (
                                <Card className="border-muted/80 shadow-sm">
                                    <CardHeader className="space-y-0 p-3 pb-0">
                                        <CardTitle className="text-sm">Review</CardTitle>
                                        <CardDescription className="text-[10px] leading-snug">
                                            Edit prompts, then create images.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3 p-3 pt-2">
                                        {ideas.map((idea) => (
                                            <div key={idea.id} className="space-y-2 rounded-lg border p-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]" htmlFor={`mirage-title-${idea.id}`}>
                                                        Title
                                                    </Label>
                                                    <Input
                                                        id={`mirage-title-${idea.id}`}
                                                        value={idea.title}
                                                        onChange={(e) => updateIdea(idea.id, { title: e.target.value })}
                                                        disabled={!canUseAgent || busy}
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]" htmlFor={`mirage-thumb-${idea.id}`}>
                                                        Overlay
                                                    </Label>
                                                    <Input
                                                        id={`mirage-thumb-${idea.id}`}
                                                        value={idea.thumb_text}
                                                        onChange={(e) => updateIdea(idea.id, { thumb_text: e.target.value })}
                                                        disabled={!canUseAgent || busy}
                                                        className="h-8 text-xs"
                                                        placeholder="On-image text"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px]" htmlFor={`mirage-prompt-${idea.id}`}>
                                                        Image prompt
                                                    </Label>
                                                    <Textarea
                                                        id={`mirage-prompt-${idea.id}`}
                                                        value={idea.image_prompt}
                                                        onChange={(e) => updateIdea(idea.id, { image_prompt: e.target.value })}
                                                        disabled={!canUseAgent || busy}
                                                        rows={3}
                                                        className="min-h-[4rem] resize-y text-xs"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="flex-1 sm:flex-none"
                                                onClick={() => void generateImagesFromReview()}
                                                disabled={!canUseAgent || busy}
                                            >
                                                {phase === 'images' ? (
                                                    <>
                                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                                        Creating…
                                                    </>
                                                ) : (
                                                    <>
                                                        <Wand2 className="mr-2 size-4" />
                                                        Create images
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => void generateIdeasOnly()}
                                                disabled={!canUseAgent || busy || !inputIsValid()}
                                            >
                                                {busy && phase === 'ideas' ? (
                                                    <>
                                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                                        Ideas…
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="mr-2 size-4" />
                                                        Regenerate
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {showImageGrid && (
                                <section className="space-y-2">
                        <div className="flex flex-wrap items-baseline justify-between gap-1">
                            <h2 className="text-foreground text-sm font-semibold">Thumbnails</h2>
                            <p className="text-muted-foreground max-w-[12rem] text-right text-[10px] leading-tight">
                                <span className="text-foreground font-medium">View prompts</span> for model text
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {ideas.map((idea, idx) => {
                                const img = imageByIdeaId[idea.id];
                                const waiting = busy && phase === 'images' && !img?.url && !img?.error;

                                return (
                                    <article
                                        key={idea.id}
                                        className="bg-card flex h-full flex-col overflow-hidden rounded-lg border shadow-sm"
                                    >
                                        <div className="bg-muted/40 relative aspect-video w-full shrink-0">
                                            {img?.url ? (
                                                <button
                                                    type="button"
                                                    className="group relative block size-full cursor-zoom-in border-0 p-0"
                                                    onClick={() => setPreviewIndex(idx)}
                                                    title="Open preview"
                                                >
                                                    <img
                                                        src={img.url}
                                                        alt=""
                                                        className="size-full object-cover transition-opacity group-hover:opacity-95"
                                                    />
                                                    <span className="sr-only">Open full preview</span>
                                                </button>
                                            ) : waiting ? (
                                                <div className="text-muted-foreground flex size-full flex-col items-center justify-center gap-1 text-[10px]">
                                                    <Loader2 className="size-5 animate-spin opacity-60" />
                                                    Drawing…
                                                </div>
                                            ) : img?.error ? (
                                                <div className="flex size-full items-center justify-center p-2">
                                                    <p className="text-destructive text-center text-[10px] leading-tight">{img.error}</p>
                                                </div>
                                            ) : (
                                                <div className="text-muted-foreground flex size-full items-center justify-center text-[10px]">
                                                    <Loader2 className="mr-1 size-3 animate-spin" />
                                                    …
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-1 flex-col gap-1.5 p-2">
                                            <div className="min-h-0 space-y-0.5">
                                                <h3 className="line-clamp-2 text-[11px] font-semibold leading-tight">{idea.title}</h3>
                                                {idea.thumb_text ? (
                                                    <p className="text-muted-foreground line-clamp-1 text-[10px]">
                                                        {idea.thumb_text}
                                                    </p>
                                                ) : null}
                                            </div>
                                            <div className="grid grid-cols-2 gap-1">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-7 gap-0.5 px-1 text-[10px]"
                                                    disabled={!img?.url}
                                                    onClick={() => handleDownloadThumbnail(idx)}
                                                    title="Download image"
                                                >
                                                    <Download className="size-3 shrink-0" />
                                                    Save
                                                </Button>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button type="button" variant="outline" size="sm" className="h-7 gap-0.5 px-1 text-[10px]">
                                                        <Eye className="size-3" />
                                                        Prompts
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-xl">
                                                    <DialogHeader>
                                                        <DialogTitle>Prompts for this thumbnail</DialogTitle>
                                                        <DialogDescription>
                                                            Text sent to the image model for “{idea.title}”. If the provider revises the prompt,
                                                            that appears below when available.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4 text-sm">
                                                        <div>
                                                            <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                                                                Image prompt (your idea)
                                                            </p>
                                                            <pre className="bg-muted/80 max-h-48 overflow-auto rounded-lg border p-3 text-xs leading-relaxed whitespace-pre-wrap">
                                                                {idea.image_prompt}
                                                            </pre>
                                                        </div>
                                                        {img?.revised_prompt ? (
                                                            <div>
                                                                <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
                                                                    Revised by model (if any)
                                                                </p>
                                                                <pre className="bg-muted/80 max-h-48 overflow-auto rounded-lg border p-3 text-xs leading-relaxed whitespace-pre-wrap">
                                                                    {img.revised_prompt}
                                                                </pre>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Dialog
                open={previewIndex !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPreviewIndex(null);
                    }
                }}
            >
                <DialogContent
                    className="flex max-h-[95vh] w-[min(96vw,56rem)] flex-col gap-3 overflow-hidden p-3 sm:max-w-[90vw] sm:p-4"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    {previewIndex !== null &&
                    ideas[previewIndex] &&
                    imageByIdeaId[ideas[previewIndex].id]?.url ? (
                        <>
                            <DialogHeader className="sr-only">
                                <DialogTitle>Thumbnail preview</DialogTitle>
                            </DialogHeader>
                            <div className="relative flex min-h-[min(70vh,520px)] items-center justify-center gap-2">
                                {indicesWithImages.length > 1 ? (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="icon"
                                        className="absolute left-0 z-10 shrink-0 shadow-md"
                                        onClick={() => stepPreview(-1)}
                                        aria-label="Previous image"
                                    >
                                        <ChevronLeft className="size-5" />
                                    </Button>
                                ) : null}
                                <img
                                    src={imageByIdeaId[ideas[previewIndex].id]!.url}
                                    alt=""
                                    className="max-h-[min(78vh,720px)] w-full max-w-full rounded-md object-contain"
                                />
                                {indicesWithImages.length > 1 ? (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="icon"
                                        className="absolute right-0 z-10 shrink-0 shadow-md"
                                        onClick={() => stepPreview(1)}
                                        aria-label="Next image"
                                    >
                                        <ChevronRight className="size-5" />
                                    </Button>
                                ) : null}
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2">
                                <p className="min-w-0 flex-1 truncate text-sm font-medium">{ideas[previewIndex].title}</p>
                                <div className="flex shrink-0 items-center gap-2">
                                    {indicesWithImages.length > 1 ? (
                                        <span className="text-muted-foreground text-xs tabular-nums">
                                            {indicesWithImages.indexOf(previewIndex) + 1} / {indicesWithImages.length}
                                        </span>
                                    ) : null}
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="gap-1.5"
                                        onClick={() => handleDownloadThumbnail(previewIndex)}
                                    >
                                        <Download className="size-4" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                            {indicesWithImages.length > 1 ? (
                                <p className="text-muted-foreground text-center text-[11px]">
                                    Arrow keys ← → to cycle
                                </p>
                            ) : null}
                        </>
                    ) : null}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
