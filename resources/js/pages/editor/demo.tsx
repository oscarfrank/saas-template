import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect, Component, type ErrorInfo, type ReactNode } from 'react';
import type { PartialBlock } from '@blocknote/core';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Download, Upload, AlertCircle, Sparkles, List, Check, X, FileText, Copy, Eye } from 'lucide-react';

/** Catches editor render errors so the rest of the page still shows. */
class EditorErrorBoundary extends Component<
    { children: ReactNode; fallback?: ReactNode },
    { hasError: boolean; error: Error | null }
> {
    state = { hasError: false, error: null as Error | null };

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('BlockNote editor error:', error, info.componentStack);
    }

    render() {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <div
                    className="min-h-[400px] rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive"
                    role="alert"
                >
                    <p className="font-medium flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        Editor failed to load
                    </p>
                    <p className="mt-2 text-sm opacity-90">{this.state.error.message}</p>
                    <p className="mt-2 text-xs opacity-75">
                        If you recently upgraded, try <code className="bg-muted px-1 rounded">npm install</code> and
                        refresh. BlockNote 0.46+ is required for React 19.
                    </p>
                </div>
            );
        }
        return this.props.children;
    }
}

/** Props we pass to the BlockNote editor (avoids importing the component at module load). */
interface EditorProps {
    initialContent?: PartialBlock[];
    onChange?: (content: PartialBlock[]) => void;
    placeholder?: string;
}

/**
 * Loads and renders BlockNote only on the client. Dynamic import ensures
 * BlockNote (and its use of document/window) never runs during SSR, which
 * would crash and produce a blank page.
 */
function ClientOnlyBlockNoteEditor(props: EditorProps) {
    const [Editor, setEditor] = useState<React.ComponentType<EditorProps> | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        import('@/components/editor')
            .then((m) => setEditor(() => m.BlockNoteEditor))
            .catch((e) => setError(e?.message ?? 'Failed to load editor'));
    }, []);

    if (error) {
        return (
            <div className="min-h-[400px] rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                Editor failed to load: {error}
            </div>
        );
    }
    if (!Editor) {
        return (
            <div
                className="min-h-[60vh] bg-muted/20 animate-pulse"
                aria-label="Editor loading"
            />
        );
    }
    return <Editor {...props} />;
}

/** A single title suggestion (title + optional thumbnail text for YouTube). */
interface TitleSuggestion {
    id: string;
    text: string;
    thumbnailText?: string;
}

/** Extract plain text from BlockNote blocks for sending to the AI. */
function blocksToPlainText(blocks: PartialBlock[]): string {
    if (!blocks?.length) return '';
    type InlineLike = { type?: string; text?: string; content?: InlineLike[] };
    function inlineToText(inline: InlineLike | string): string {
        if (typeof inline === 'string') return inline;
        if (inline.type === 'text' && typeof inline.text === 'string') return inline.text;
        if (inline.type === 'link' && Array.isArray(inline.content)) return inline.content.map(inlineToText).join('');
        return '';
    }
    function blockToText(block: PartialBlock): string {
        const parts: string[] = [];
        const content = block.content as InlineLike[] | undefined;
        if (Array.isArray(content)) parts.push(content.map(inlineToText).join(''));
        if (Array.isArray(block.children) && block.children.length) parts.push(block.children.map(blockToText).join('\n'));
        return parts.filter(Boolean).join('\n');
    }
    return blocks.map(blockToText).filter(Boolean).join('\n\n');
}

/** YouTube allows up to 500 characters for meta tags. */
const META_TAGS_MAX_LENGTH = 500;

/** Generated description assets: one editable block (description + videos + timestamps) and meta tags. */
interface DescriptionAssets {
    descriptionBlock: string;
    metaTags: string;
}

/** Title style options shown in the "Generate title ideas" popover. */
const TITLE_STYLE_OPTIONS = [
    { id: 'emotional', label: 'Emotional', description: 'Appeal to feelings' },
    { id: 'urgency', label: 'Urgency', description: 'Create FOMO, act now' },
    { id: 'curiosity', label: 'Curiosity', description: 'Tease without giving away' },
    { id: 'how-to', label: 'How-to', description: 'Clear, instructional' },
    { id: 'listicle', label: 'Listicle', description: 'Numbers and lists' },
    { id: 'question', label: 'Question', description: 'Pose a question' },
    { id: 'provocative', label: 'Provocative', description: 'Bold or controversial' },
] as const;

export default function EditorDemo() {
    const [content, setContent] = useState<PartialBlock[]>([]);
    const [pageTitle, setPageTitle] = useState('');
    const [titleSuggestions, setTitleSuggestions] = useState<TitleSuggestion[]>([]);
    const [selectedTitleStyles, setSelectedTitleStyles] = useState<string[]>([]);
    const [generatePopoverOpen, setGeneratePopoverOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [ideasSheetOpen, setIdeasSheetOpen] = useState(false);
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [descriptionSheetOpen, setDescriptionSheetOpen] = useState(false);
    const [descriptionData, setDescriptionData] = useState<DescriptionAssets | null>(null);
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
    const [descriptionError, setDescriptionError] = useState<string | null>(null);

    const { data, setData } = useForm({
        title: 'My Document',
        content: null as PartialBlock[] | null,
    });

    const handleContentChange = (blocks: PartialBlock[]) => {
        setContent(blocks);
        setData('content', blocks);
    };

    const handleSave = () => {
        // In a real app, you would save to the backend here
        console.log('Saving content:', content);
    };

    const toggleTitleStyle = (id: string) => {
        setSelectedTitleStyles((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    // Generate title ideas via OpenAI; uses editor content + selected title styles.
    const handleGenerateTitleIdeas = async () => {
        if (selectedTitleStyles.length === 0) return;
        setGeneratePopoverOpen(false);
        setIsGenerating(true);
        setGenerateError(null);
        const plainText = blocksToPlainText(content);
        const url = (window as unknown as { route: (name: string) => string }).route('editor.generate-title-ideas');
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ content: plainText || '(No content yet — add some in the editor below.)', styles: selectedTitleStyles }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setGenerateError(data.message ?? 'Failed to generate ideas.');
                setIsGenerating(false);
                return;
            }
            const titles = Array.isArray(data.titles) ? data.titles : [];
            const newSuggestions: TitleSuggestion[] = titles.map(
                (t: { title?: string; thumbnailText?: string }) => ({
                    id: crypto.randomUUID(),
                    text: typeof t.title === 'string' ? t.title : '',
                    thumbnailText: typeof t.thumbnailText === 'string' ? t.thumbnailText : undefined,
                })
            );
            setTitleSuggestions((prev) => [...prev, ...newSuggestions]);
            setIdeasSheetOpen(true);
        } catch (e) {
            setGenerateError('Network or server error. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUseAsTitle = (suggestion: TitleSuggestion) => {
        setPageTitle(suggestion.text);
        setData('title', suggestion.text);
    };

    const handleRemoveSuggestion = (id: string) => {
        setTitleSuggestions((prev) => prev.filter((s) => s.id !== id));
    };

    const handleGenerateDescriptionAssets = async () => {
        setIsGeneratingDescription(true);
        setDescriptionError(null);
        const plainText = blocksToPlainText(content);
        const url = (window as unknown as { route: (name: string) => string }).route('editor.generate-description-assets');
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    content: plainText || '(No content yet — add some in the editor below.)',
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setDescriptionError(data.message ?? 'Failed to generate.');
                setIsGeneratingDescription(false);
                return;
            }
            const shortDesc = typeof data.shortDescription === 'string' ? data.shortDescription : '';
            const timestamps = Array.isArray(data.timestamps)
                ? data.timestamps.map((t: { time?: string; label?: string }) => ({
                      time: typeof t.time === 'string' ? t.time : '',
                      label: typeof t.label === 'string' ? t.label : '',
                  }))
                : [];
            const parts: string[] = [
                shortDesc.trim(),
                '',
                '::::::::::::::: 🎬 Related Videos :::::::::::::::',
                'video 1 - ',
                'video 2 - ',
                'video 3 - ',
                '',
                '::::::::::::::: ⏰ Timestamps :::::::::::::::',
            ];
            for (const ts of timestamps) {
                parts.push(`${ts.time?.trim() ?? ''} ${ts.label?.trim() ?? ''}`.trim());
            }
            setDescriptionData({
                descriptionBlock: parts.join('\n'),
                metaTags: typeof data.metaTags === 'string' ? data.metaTags : '',
            });
            setDescriptionSheetOpen(true);
        } catch {
            setDescriptionError('Network or server error. Please try again.');
        } finally {
            setIsGeneratingDescription(false);
        }
    };

    const copyToClipboard = (text: string, label = 'Copied!') => {
        navigator.clipboard.writeText(text).then(() => toast.success(label)).catch(() => {});
    };

    const handleExport = () => {
        const json = JSON.stringify(content, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleLoad = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const loadedContent = JSON.parse(event.target?.result as string) as PartialBlock[];
                        setContent(loadedContent);
                        setData('content', loadedContent);
                    } catch (error) {
                        console.error('Error loading file:', error);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    return (
        <AppLayout>
            <Head title={pageTitle || 'BlockNote Editor Demo'} />
            <div className="w-full py-12 px-4 sm:px-6 lg:px-8">
                {/* Notion-style: page title + actions */}
                <div className="mb-2 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            value={pageTitle}
                            onChange={(e) => {
                                setPageTitle(e.target.value);
                                setData('title', e.target.value);
                            }}
                            placeholder="Untitled"
                            className="min-w-[200px] max-w-2xl border-0 bg-transparent text-2xl font-semibold shadow-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-3xl"
                        />
                        <Popover
                            open={generatePopoverOpen}
                            onOpenChange={(open) => {
                                setGeneratePopoverOpen(open);
                                if (open) setGenerateError(null);
                            }}
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0"
                                    disabled={isGenerating}
                                >
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    {isGenerating ? 'Generating…' : 'Generate title ideas'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="start" side="bottom">
                                <div className="space-y-3">
                                    <div>
                                        <h4 className="font-medium leading-none">Choose title style</h4>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            Pick one or more. We’ll use your editor content to generate ideas (AI not connected yet).
                                        </p>
                                    </div>
                                    <div className="grid gap-2 py-2">
                                        {TITLE_STYLE_OPTIONS.map((opt) => (
                                            <label
                                                key={opt.id}
                                                className="flex cursor-pointer items-start gap-3 rounded-md border border-transparent px-2 py-1.5 hover:bg-muted/50 has-[:checked]:bg-muted/30"
                                            >
                                                <Checkbox
                                                    checked={selectedTitleStyles.includes(opt.id)}
                                                    onCheckedChange={() => toggleTitleStyle(opt.id)}
                                                />
                                                <div className="grid gap-0.5 leading-none">
                                                    <span className="text-sm font-medium">{opt.label}</span>
                                                    <span className="text-muted-foreground text-xs">
                                                        {opt.description}
                                                    </span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="w-full"
                                        onClick={handleGenerateTitleIdeas}
                                        disabled={selectedTitleStyles.length === 0}
                                    >
                                        Generate ideas
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                        {generateError && (
                            <p className="text-destructive mt-1 text-sm" role="alert">
                                {generateError}
                            </p>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            disabled={isGeneratingDescription}
                            onClick={handleGenerateDescriptionAssets}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            {isGeneratingDescription ? 'Generating…' : 'Description & more'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="shrink-0"
                            onClick={() => setDescriptionSheetOpen(true)}
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            View description & tags
                        </Button>
                        {descriptionError && (
                            <p className="text-destructive mt-1 text-sm" role="alert">
                                {descriptionError}
                            </p>
                        )}
                        <Sheet open={ideasSheetOpen} onOpenChange={setIdeasSheetOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="shrink-0"
                                >
                                    <List className="mr-2 h-4 w-4" />
                                    View ideas
                                    {titleSuggestions.length > 0 && (
                                        <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                                            {titleSuggestions.length}
                                        </span>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-full sm:max-w-md">
                                <SheetHeader>
                                    <SheetTitle>Title ideas</SheetTitle>
                                    <SheetDescription>
                                        Use one as the page title or remove ideas you don’t want to keep.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="flex flex-1 flex-col gap-2 overflow-auto py-4">
                                    {titleSuggestions.length === 0 ? (
                                        <p className="text-muted-foreground text-sm">
                                            No ideas yet. Choose a title style and click “Generate title ideas” to create up to 5 titles with thumbnail text.
                                        </p>
                                    ) : (
                                        titleSuggestions.map((suggestion) => (
                                            <div
                                                key={suggestion.id}
                                                className="flex items-start justify-between gap-2 rounded-lg border bg-muted/30 p-3"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium">{suggestion.text}</p>
                                                    {suggestion.thumbnailText && (
                                                        <p className="text-muted-foreground mt-1 text-xs">
                                                            {suggestion.thumbnailText}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex shrink-0 gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleUseAsTitle(suggestion)}
                                                        title="Use as title"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleRemoveSuggestion(suggestion.id)}
                                                        title="Remove"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                        <Sheet
                            open={descriptionSheetOpen}
                            onOpenChange={(open) => {
                                setDescriptionSheetOpen(open);
                                if (open) setDescriptionError(null);
                            }}
                        >
                            <SheetContent
                                side="right"
                                className="flex w-full flex-col gap-0 sm:max-w-xl"
                            >
                                <SheetHeader className="px-6 pt-6 pb-4">
                                    <SheetTitle>Description, timestamps & tags</SheetTitle>
                                    <SheetDescription>
                                        Edit below. Copy description + videos + timestamps together, or meta tags separately.
                                    </SheetDescription>
                                    {descriptionData && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="mt-2 w-full sm:w-auto"
                                            onClick={() => copyToClipboard(descriptionData.descriptionBlock)}
                                        >
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy
                                        </Button>
                                    )}
                                </SheetHeader>
                                {!descriptionData ? (
                                    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
                                        <p className="text-muted-foreground text-sm">
                                            Nothing generated yet. Use &quot;Description & more&quot; to generate from your script.
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setDescriptionSheetOpen(false)}
                                        >
                                            Close
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-8 pt-2">
                                        <section className="space-y-2">
                                            <label className="text-sm font-medium">
                                                Description, related videos & timestamps
                                            </label>
                                            <p className="text-muted-foreground text-xs">
                                                Edit everything in one place, then copy above or from the box.
                                            </p>
                                            <Textarea
                                                value={descriptionData.descriptionBlock}
                                                onChange={(e) =>
                                                    setDescriptionData((prev) =>
                                                        prev ? { ...prev, descriptionBlock: e.target.value } : null
                                                    )
                                                }
                                                rows={18}
                                                className="min-h-[320px] resize-y font-sans text-sm leading-relaxed"
                                                                                                placeholder={`Short description…

::::::::::::::: 🎬 Related Videos :::::::::::::::
video 1 -
video 2 -
video 3 -

::::::::::::::: ⏰ Timestamps :::::::::::::::
0:00 Intro`}
                                            />
                                        </section>
                                        <section className="space-y-2 rounded-lg border border-border/60 bg-muted/10 p-4">
                                            <div className="flex items-center justify-between gap-2">
                                                <label className="text-sm font-medium">Meta tags</label>
                                                <span
                                                    className={`text-xs tabular-nums ${
                                                        descriptionData.metaTags.length > META_TAGS_MAX_LENGTH
                                                            ? 'text-destructive'
                                                            : 'text-muted-foreground'
                                                    }`}
                                                >
                                                    {descriptionData.metaTags.length} / {META_TAGS_MAX_LENGTH}
                                                </span>
                                            </div>
                                            <Textarea
                                                value={descriptionData.metaTags}
                                                onChange={(e) =>
                                                    setDescriptionData((prev) =>
                                                        prev ? { ...prev, metaTags: e.target.value.slice(0, META_TAGS_MAX_LENGTH) } : null
                                                    )
                                                }
                                                maxLength={META_TAGS_MAX_LENGTH}
                                                rows={3}
                                                className="resize-y font-sans text-sm"
                                                placeholder="tag1, tag2, tag3… (max 500 characters for YouTube)"
                                            />
                                            <div className="flex justify-end">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-xs"
                                                    onClick={() => copyToClipboard(descriptionData.metaTags, 'Tags copied!')}
                                                >
                                                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                                                    Copy tags
                                                </Button>
                                            </div>
                                        </section>
                                    </div>
                                )}
                            </SheetContent>
                        </Sheet>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleSave} variant="ghost" size="sm">
                            <Save className="mr-2 h-4 w-4" />
                            Save
                        </Button>
                        <Button onClick={handleExport} variant="ghost" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button onClick={handleLoad} variant="ghost" size="sm">
                            <Upload className="mr-2 h-4 w-4" />
                            Load
                        </Button>
                    </div>
                </div>

                <EditorErrorBoundary>
                    <ClientOnlyBlockNoteEditor
                        initialContent={content.length > 0 ? content : undefined}
                        onChange={handleContentChange}
                        placeholder="Start typing or press '/' for commands..."
                    />
                </EditorErrorBoundary>
            </div>
        </AppLayout>
    );
}

