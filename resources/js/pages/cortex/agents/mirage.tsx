import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import axios from 'axios';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { CortexAgentSettingsMenu } from '@/components/cortex/cortex-agent-settings-menu';

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

interface Props {
    openAiConfigured: boolean;
    promptKey: string;
    promptLabel: string;
    promptDescription: string;
    imageProvider?: string | null;
    imageProviderLabel?: string | null;
}

const MAX_REFERENCE_BYTES = 5 * 1024 * 1024;
const REF_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';

const PHOTO_COUNTS = [2, 3, 4] as const;

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
}: Props) {
    const tenantRouter = useTenantRouter();

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [{ title: 'Cortex', href: tenantRouter.route('cortex.index') }, { title: 'Mirage', href: '' }],
        [tenantRouter],
    );

    const [topic, setTopic] = useState('');
    const [faceDataUrl, setFaceDataUrl] = useState<string | null>(null);
    const [productDataUrl, setProductDataUrl] = useState<string | null>(null);
    const [photoCount, setPhotoCount] = useState<(typeof PHOTO_COUNTS)[number]>(3);
    const [focus, setFocus] = useState<FocusKey>('mixed');

    const [ideas, setIdeas] = useState<MirageIdea[]>([]);
    const [imageByIdeaId, setImageByIdeaId] = useState<Record<string, ImageResult>>({});

    const [phase, setPhase] = useState<'ideas' | 'images' | null>(null);

    const canUseAgent = openAiConfigured;
    const busy = phase !== null;

    const resetAll = () => {
        setIdeas([]);
        setImageByIdeaId({});
        setPhase(null);
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

    const fetchIdeas = async (): Promise<MirageIdea[] | null> => {
        const url = tenantRouter.route('cortex.agents.mirage.ideas');
        const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

        const { data } = await axios.post<{ ideas?: MirageIdea[]; message?: string }>(
            url,
            {
                input: topic.trim(),
                idea_count: photoCount,
                focus,
                face_reference: faceDataUrl ?? undefined,
                product_reference: productDataUrl ?? undefined,
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

        if (!data.ideas?.length) {
            toast.error(data.message ?? 'No thumbnails were returned. Try again.');
            return null;
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

    const generateThumbnails = async () => {
        if (!topic.trim()) {
            toast.error('Describe your video in the box above.');
            return;
        }

        setPhase('ideas');
        setIdeas([]);
        setImageByIdeaId({});

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mirage - Cortex" />
            <div className="mx-auto flex max-w-5xl flex-col gap-8 p-4 pb-16 md:p-6">
                <div className="space-y-3 text-center sm:text-left">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                            <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl">
                                <Wand2 className="size-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">Mirage</h1>
                                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                                    {promptDescription || 'Turn your topic into realistic YouTube thumbnail images.'} Describe the video, pick options, then generate.
                                </p>
                                {imageProviderLabel ? (
                                    <p className="text-muted-foreground mt-2 text-xs">
                                        Images: <span className="text-foreground font-medium">{imageProviderLabel}</span>
                                    </p>
                                ) : null}
                            </div>
                        </div>
                        <CortexAgentSettingsMenu agentKey="mirage" className="self-center sm:self-start" />
                    </div>
                </div>

                {!canUseAgent && (
                    <Alert variant="destructive">
                        <AlertTitle>Chat / ideas model not configured</AlertTitle>
                        <AlertDescription>
                            Open <strong>Settings → Agent settings</strong> to choose OpenAI or Anthropic for chat and ideas. Image generation is
                            configured separately under Settings → Image generation.
                        </AlertDescription>
                    </Alert>
                )}

                <Card className="border-muted/80 mx-auto w-full max-w-2xl shadow-sm">
                    <CardHeader className="space-y-1 pb-2">
                        <CardTitle className="text-lg">Create thumbnails</CardTitle>
                        <CardDescription>Optional reference photos, then a few choices, then generate.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="mirage_topic" className="text-base font-medium">
                                1. What is your video about?
                            </Label>
                            <Textarea
                                id="mirage_topic"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="Paste your script, or write one sentence (e.g. “5 mistakes killing your editing speed”)."
                                disabled={!canUseAgent || busy}
                                rows={6}
                                className="min-h-[120px] resize-y text-base"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-base font-medium">2. Optional reference photos</Label>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                Add a face and/or product shot to steer likeness and what appears on the thumbnail. With{' '}
                                <span className="text-foreground font-medium">GPT Image 1</span> (Image settings), those photos are sent into generation. With DALL·E 3,
                                they still guide ideas and prompts, but the final image is text-only.
                            </p>
                            {imageProvider === 'dall_e_3' && (faceDataUrl || productDataUrl) ? (
                                <Alert>
                                    <AlertTitle className="text-sm">DALL·E 3 selected</AlertTitle>
                                    <AlertDescription className="text-xs">
                                        Reference photos are analyzed for ideas only. Switch to GPT Image 1 under Image settings to pass your photos into the image model.
                                    </AlertDescription>
                                </Alert>
                            ) : null}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="mirage_face_ref" className="text-sm">
                                        Face (optional)
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
                                        {faceDataUrl ? (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => setFaceDataUrl(null)} disabled={busy}>
                                                Remove
                                            </Button>
                                        ) : null}
                                    </div>
                                    {faceDataUrl ? (
                                        <div className="bg-muted/50 relative mt-1 aspect-square max-h-36 overflow-hidden rounded-lg border">
                                            <img src={faceDataUrl} alt="" className="size-full object-cover" />
                                        </div>
                                    ) : null}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mirage_product_ref" className="text-sm">
                                        Product (optional)
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
                                            <Button type="button" variant="ghost" size="sm" onClick={() => setProductDataUrl(null)} disabled={busy}>
                                                Remove
                                            </Button>
                                        ) : null}
                                    </div>
                                    {productDataUrl ? (
                                        <div className="bg-muted/50 relative mt-1 aspect-square max-h-36 overflow-hidden rounded-lg border">
                                            <img src={productDataUrl} alt="" className="size-full object-cover" />
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-base font-medium">3. How many thumbnail images?</Label>
                            <ToggleGroup
                                type="single"
                                value={String(photoCount)}
                                onValueChange={(v) => {
                                    if (v) setPhotoCount(Number(v) as (typeof PHOTO_COUNTS)[number]);
                                }}
                                disabled={!canUseAgent || busy}
                                variant="outline"
                                className="flex w-full justify-stretch gap-0 sm:inline-flex sm:w-auto"
                            >
                                {PHOTO_COUNTS.map((n) => (
                                    <ToggleGroupItem key={n} value={String(n)} className="flex-1 px-6 py-2.5 text-sm font-medium sm:flex-none">
                                        {n}
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                            <p className="text-muted-foreground text-xs">We create this many different ideas, then one image for each.</p>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-base font-medium">4. What should the photo emphasize?</Label>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {FOCUS_OPTIONS.map((opt) => {
                                    const selected = focus === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            disabled={!canUseAgent || busy}
                                            onClick={() => setFocus(opt.value)}
                                            className={cn(
                                                'rounded-xl border-2 px-4 py-3 text-left transition-colors',
                                                selected ? 'border-primary bg-primary/5' : 'border-muted bg-card hover:border-muted-foreground/25',
                                                (!canUseAgent || busy) && 'pointer-events-none opacity-50',
                                            )}
                                        >
                                            <span className="font-medium">{opt.title}</span>
                                            <span className="text-muted-foreground mt-0.5 block text-xs">{opt.description}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Button
                                type="button"
                                size="lg"
                                className="w-full sm:w-auto sm:min-w-[220px]"
                                onClick={() => void generateThumbnails()}
                                disabled={!canUseAgent || busy || !topic.trim()}
                            >
                                {busy ? (
                                    <>
                                        <Loader2 className="mr-2 size-5 animate-spin" />
                                        {phase === 'ideas' ? 'Writing ideas…' : 'Creating images…'}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 size-5" />
                                        Generate thumbnails
                                    </>
                                )}
                            </Button>
                            {ideas.length > 0 && !busy && (
                                <Button type="button" variant="ghost" size="lg" onClick={resetAll} className="text-muted-foreground">
                                    Clear results
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {ideas.length > 0 && (
                    <section className="w-full space-y-4">
                        <h2 className="text-muted-foreground text-sm font-medium uppercase tracking-wide">Your thumbnails</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                            {ideas.map((idea) => {
                                const img = imageByIdeaId[idea.id];
                                const waiting = busy && phase === 'images' && !img?.url && !img?.error;

                                return (
                                    <article
                                        key={idea.id}
                                        className="bg-card flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm"
                                    >
                                        <div className="bg-muted/40 relative aspect-video w-full shrink-0">
                                            {img?.url ? (
                                                <img
                                                    src={img.url}
                                                    alt=""
                                                    className="size-full object-cover"
                                                />
                                            ) : waiting ? (
                                                <div className="text-muted-foreground flex size-full flex-col items-center justify-center gap-2 text-sm">
                                                    <Loader2 className="size-8 animate-spin opacity-60" />
                                                    Drawing image…
                                                </div>
                                            ) : img?.error ? (
                                                <div className="flex size-full items-center justify-center p-4">
                                                    <p className="text-destructive text-center text-sm">{img.error}</p>
                                                </div>
                                            ) : (
                                                <div className="text-muted-foreground flex size-full items-center justify-center text-sm">
                                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                                    Waiting…
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-1 flex-col justify-end space-y-1 p-4">
                                            <h3 className="font-semibold leading-snug">{idea.title}</h3>
                                            {idea.thumb_text ? (
                                                <p className="text-muted-foreground text-sm">
                                                    <span className="text-foreground font-medium">On image:</span> {idea.thumb_text}
                                                </p>
                                            ) : null}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}

                <p className="text-muted-foreground mx-auto max-w-2xl text-center text-xs sm:text-left">
                    Customize the AI personality for this tool ({promptLabel}) under{' '}
                    <Link href={tenantRouter.route('settings.organization.ai-prompts')} className="text-primary font-medium underline-offset-4 hover:underline">
                        Organization → AI prompts
                    </Link>{' '}
                    <code className="rounded bg-muted px-1 py-0.5">{promptKey}</code>.
                </p>
            </div>
        </AppLayout>
    );
}
