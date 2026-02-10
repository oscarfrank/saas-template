import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect, useRef, useMemo, Component, type ErrorInfo, type ReactNode } from 'react';
import type { PartialBlock } from '@blocknote/core';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Download, Upload, AlertCircle, Sparkles, List, Check, X, FileText, Copy, Eye, ArrowLeft, Trash2, Share2, Link2, MoreHorizontal, Pencil, Plus, ImagePlus } from 'lucide-react';
import { useTenantRouter } from '@/hooks/use-tenant-router';

const AUTOSAVE_DEBOUNCE_MS = 1500;
const AUTOSAVE_DELAY_AFTER_MOUNT_MS = 2000;

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

interface EditorProps {
    initialContent?: PartialBlock[];
    onChange?: (content: PartialBlock[]) => void;
    placeholder?: string;
    editable?: boolean;
    onAiEditRequest?: (selectedText: string, instruction: string) => Promise<string | null>;
}

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
            <div className="min-h-[60vh] bg-muted/20 animate-pulse" aria-label="Editor loading" />
        );
    }
    return <Editor {...props} />;
}

interface TitleSuggestion {
    id: string;
    text: string;
    thumbnailText?: string;
}

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

const META_TAGS_MAX_LENGTH = 500;

interface DescriptionAssets {
    descriptionBlock: string;
    metaTags: string;
}

const TITLE_STYLE_OPTIONS = [
    { id: 'emotional', label: 'Emotional', description: 'Appeal to feelings' },
    { id: 'urgency', label: 'Urgency', description: 'Create FOMO, act now' },
    { id: 'curiosity', label: 'Curiosity', description: 'Tease without giving away' },
    { id: 'how-to', label: 'How-to', description: 'Clear, instructional' },
    { id: 'listicle', label: 'Listicle', description: 'Numbers and lists' },
    { id: 'question', label: 'Question', description: 'Pose a question' },
    { id: 'provocative', label: 'Provocative', description: 'Bold or controversial' },
] as const;

interface ScriptTypeOption {
    id: number;
    name: string;
    slug: string;
}

interface TitleOptionRow {
    id?: number;
    title: string;
    thumbnail_text: string | null;
    is_primary: boolean;
    sort_order?: number;
}

interface ThumbnailRow {
    id: number;
    type: string;
    url: string;
    filename: string;
    sort_order: number;
}

interface ScriptForEdit {
    id: number;
    uuid: string;
    title: string;
    thumbnail_text: string | null;
    script_type_id: number | null;
    content: PartialBlock[] | null;
    description: string | null;
    meta_tags: string | null;
    live_video_url: string | null;
    status: string;
    title_options: TitleOptionRow[];
    thumbnails: ThumbnailRow[];
    current_user_role?: string | null;
    can_edit?: boolean;
    can_delete?: boolean;
    can_manage_access?: boolean;
}

interface Props {
    script: ScriptForEdit | null;
    scriptTypes: ScriptTypeOption[];
}

interface ShareData {
    visibility: string;
    share_token: string | null;
    public_url: string | null;
    owner: { user_id: number; name: string; email: string; role: string };
    collaborators: Array<{ user_id: number; name: string; email: string; role: string }>;
}

export default function ScriptForm({ script: initialScript, scriptTypes }: Props) {
    const tenantRouter = useTenantRouter();
    const isEdit = initialScript !== null;
    const readOnly = isEdit && initialScript?.can_edit === false;
    const canManageAccess = !!(isEdit && initialScript?.can_manage_access);

    const [content, setContent] = useState<PartialBlock[]>(
        initialScript?.content?.length ? initialScript.content : []
    );
    const [pageTitle, setPageTitle] = useState(initialScript?.title ?? '');
    const [mainThumbnailText, setMainThumbnailText] = useState<string | null>(initialScript?.thumbnail_text ?? null);
    const [scriptTypeId, setScriptTypeId] = useState<string | null>(
        initialScript?.script_type_id != null ? String(initialScript.script_type_id) : null
    );
    const [titleOptions, setTitleOptions] = useState<TitleOptionRow[]>(
        initialScript?.title_options?.length ? initialScript.title_options : []
    );
    const [titleSuggestions, setTitleSuggestions] = useState<TitleSuggestion[]>([]);
    const [selectedTitleStyles, setSelectedTitleStyles] = useState<string[]>([]);
    const [generatePopoverOpen, setGeneratePopoverOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [ideasSheetOpen, setIdeasSheetOpen] = useState(false);
    const [editingTitleKey, setEditingTitleKey] = useState<string | null>(null);
    const [editingTitleDraft, setEditingTitleDraft] = useState({ title: '', thumbnailText: '' });
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [descriptionSheetOpen, setDescriptionSheetOpen] = useState(false);
    const [descriptionData, setDescriptionData] = useState<DescriptionAssets | null>(
        initialScript?.description || initialScript?.meta_tags
            ? { descriptionBlock: initialScript?.description ?? '', metaTags: initialScript?.meta_tags ?? '' }
            : null
    );
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
    const [descriptionError, setDescriptionError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [shareSheetOpen, setShareSheetOpen] = useState(false);
    const [shareData, setShareData] = useState<ShareData | null>(null);
    const [shareLoading, setShareLoading] = useState(false);
    const [sharePublishLoading, setSharePublishLoading] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'view' | 'edit' | 'admin'>('view');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [thumbnails, setThumbnails] = useState<ThumbnailRow[]>(initialScript?.thumbnails ?? []);
    const [thumbnailsSheetOpen, setThumbnailsSheetOpen] = useState(false);
    const [thumbnailUploading, setThumbnailUploading] = useState(false);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    const autosaveReadyAtRef = useRef<number>(Date.now() + AUTOSAVE_DELAY_AFTER_MOUNT_MS);
    const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const formStateRef = useRef({ content, pageTitle, mainThumbnailText, scriptTypeId, descriptionData, titleOptions });

    formStateRef.current = { content, pageTitle, mainThumbnailText, scriptTypeId, descriptionData, titleOptions };

    const handleContentChange = (blocks: PartialBlock[]) => {
        setContent(blocks);
    };

    const handleAiEditSelection = async (
        selectedText: string,
        instruction: string
    ): Promise<string | null> => {
        const url = tenantRouter.route('script.ai-edit-selection');
        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
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
                    content: blocksToPlainText(content) || '',
                    selected_text: selectedText,
                    instruction,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data.message ?? 'AI edit failed');
                return null;
            }
            return typeof data.rewritten === 'string' ? data.rewritten : null;
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'AI edit failed');
            return null;
        }
    };

    const toggleTitleStyle = (id: string) => {
        setSelectedTitleStyles((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    const handleGenerateTitleIdeas = async (stylesOverride?: string[]) => {
        const stylesToUse = stylesOverride ?? selectedTitleStyles;
        if (stylesToUse.length === 0) return;
        setGeneratePopoverOpen(false);
        setIsGenerating(true);
        setGenerateError(null);
        const plainText = blocksToPlainText(content);
        const url = tenantRouter.route('script.generate-title-ideas');
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
                body: JSON.stringify({ content: plainText || '(No content yet — add some in the editor below.)', styles: stylesToUse }),
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
            setTitleOptions((prev) => [
                ...prev,
                ...newSuggestions.map((s) => ({
                    id: undefined as number | undefined,
                    title: s.text,
                    thumbnail_text: s.thumbnailText ?? null,
                    is_primary: false,
                })),
            ]);
            setIdeasSheetOpen(true);
        } catch (e) {
            setGenerateError('Network or server error. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUseAsTitle = (suggestion: TitleSuggestion) => {
        setPageTitle(suggestion.text);
        setMainThumbnailText(suggestion.thumbnailText ?? null);
        setTitleOptions((prev) => {
            const next = prev.filter((o) => !(o.title === suggestion.text && (o.thumbnail_text ?? null) === (suggestion.thumbnailText ?? null)));
            return [
                ...next.map((o) => ({ ...o, is_primary: false })),
                { id: undefined, title: suggestion.text, thumbnail_text: suggestion.thumbnailText ?? null, is_primary: true },
            ];
        });
        setTitleSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
    };

    const handleAddSuggestionToList = (suggestion: TitleSuggestion) => {
        setTitleOptions((prev) => {
            const exists = prev.some((o) => o.title === suggestion.text && (o.thumbnail_text ?? null) === (suggestion.thumbnailText ?? null));
            if (exists) return prev;
            const isFirst = prev.length === 0;
            if (isFirst) {
                setPageTitle(suggestion.text);
                setMainThumbnailText(suggestion.thumbnailText ?? null);
            }
            return [...prev.map((o) => ({ ...o, is_primary: false })), { id: undefined, title: suggestion.text, thumbnail_text: suggestion.thumbnailText ?? null, is_primary: isFirst }];
        });
    };

    const handleRemoveSuggestion = (id: string) => {
        setTitleSuggestions((prev) => prev.filter((s) => s.id !== id));
    };

    const handleUseAsTitleOption = (option: TitleOptionRow) => {
        setPageTitle(option.title);
        setMainThumbnailText(option.thumbnail_text ?? null);
        setTitleOptions((prev) =>
            prev.map((o) => ({
                ...o,
                is_primary: (o.id != null && option.id != null && o.id === option.id) || (o.id == null && option.id == null && o.title === option.title),
            }))
        );
    };

    const handleRemoveOption = (option: TitleOptionRow) => {
        setTitleOptions((prev) => {
            const next = prev.filter((o) => (o.id != null && option.id != null ? o.id !== option.id : o.title !== option.title));
            if (next.length > 0 && !next.some((o) => o.is_primary)) {
                return next.map((o, i) => ({ ...o, is_primary: i === 0 }));
            }
            return next;
        });
        setEditingTitleKey(null);
    };

    const startEditingOption = (option: TitleOptionRow, index: number) => {
        setEditingTitleKey(`opt-${index}`);
        setEditingTitleDraft({ title: option.title, thumbnailText: option.thumbnail_text ?? '' });
    };

    const startEditingSuggestion = (suggestion: TitleSuggestion) => {
        setEditingTitleKey(`sug-${suggestion.id}`);
        setEditingTitleDraft({ title: suggestion.text, thumbnailText: suggestion.thumbnailText ?? '' });
    };

    const applyEditingTitle = () => {
        if (!editingTitleKey) return;
        const [kind, idOrIndex] = editingTitleKey.split('-');
        const title = editingTitleDraft.title.trim() || editingTitleDraft.title;
        const thumbnailText = editingTitleDraft.thumbnailText.trim() || null;
        if (kind === 'sug') {
            setTitleSuggestions((prev) =>
                prev.map((s) => (s.id === idOrIndex ? { ...s, text: title || s.text, thumbnailText: thumbnailText ?? undefined } : s))
            );
        } else {
            const index = parseInt(idOrIndex, 10);
            if (Number.isNaN(index)) return;
            setTitleOptions((prev) => {
                const next = prev.map((o, i) => {
                    if (i !== index) return o;
                    const updated = { ...o, title: title || o.title, thumbnail_text: thumbnailText ?? o.thumbnail_text };
                    if (o.is_primary) {
                        setPageTitle(updated.title);
                        setMainThumbnailText(updated.thumbnail_text ?? null);
                    }
                    return updated;
                });
                return next;
            });
        }
        setEditingTitleKey(null);
    };

    const cancelEditingTitle = () => {
        setEditingTitleKey(null);
    };

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !initialScript || !tenantRouter) return;
        setThumbnailUploading(true);
        const url = tenantRouter.route('script.thumbnails.store', { script: initialScript.uuid });
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
                body: formData,
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.thumbnail) {
                setThumbnails((prev) => [...prev, data.thumbnail]);
            } else {
                toast.error(data.message ?? 'Upload failed.');
            }
        } catch {
            toast.error('Upload failed.');
        } finally {
            setThumbnailUploading(false);
            e.target.value = '';
        }
    };

    const handleThumbnailDelete = async (thumb: ThumbnailRow) => {
        if (!initialScript || !tenantRouter) return;
        const url = tenantRouter.route('script.thumbnails.destroy', { script: initialScript.uuid, thumbnail: thumb.id });
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        try {
            const res = await fetch(url, {
                method: 'DELETE',
                headers: { 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
            });
            if (res.ok) {
                setThumbnails((prev) => prev.filter((t) => t.id !== thumb.id));
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.message ?? 'Delete failed.');
            }
        } catch {
            toast.error('Delete failed.');
        }
    };

    const displayIdeas = useMemo(() => {
        const suggestionMatchesOption = (s: TitleSuggestion) =>
            titleOptions.some((o) => o.title === s.text && (o.thumbnail_text ?? null) === (s.thumbnailText ?? null));
        const suggestionsOnly = titleSuggestions.filter((s) => !suggestionMatchesOption(s));
        return [
            ...titleOptions.map((option, index) => ({ kind: 'option' as const, option, index })),
            ...suggestionsOnly.map((suggestion) => ({ kind: 'suggestion' as const, suggestion })),
        ];
    }, [titleOptions, titleSuggestions]);
    const hasIdeasToView = displayIdeas.length > 0;

    const buildUpdatePayload = () => {
        const state = formStateRef.current;
        type OptionPayload = { id?: number; title: string; thumbnail_text: string | null; is_primary: boolean };
        const optionsToSend: OptionPayload[] = state.titleOptions.length > 0
            ? state.titleOptions.map((o) => ({
                  id: o.id,
                  title: o.is_primary ? (state.pageTitle.trim() || o.title) : o.title,
                  thumbnail_text: o.is_primary ? state.mainThumbnailText : o.thumbnail_text,
                  is_primary: o.is_primary,
              }))
            : [];
        if (optionsToSend.length === 0 && state.pageTitle.trim()) {
            optionsToSend.push({ title: state.pageTitle.trim(), thumbnail_text: state.mainThumbnailText ?? null, is_primary: true });
        }
        return {
            title: state.pageTitle.trim() || 'Untitled script',
            thumbnail_text: state.mainThumbnailText ?? null,
            script_type_id: state.scriptTypeId ? Number(state.scriptTypeId) : null,
            content: state.content,
            description: state.descriptionData?.descriptionBlock ?? null,
            meta_tags: state.descriptionData?.metaTags ?? null,
            status: initialScript?.status ?? 'draft',
            title_options: optionsToSend,
        };
    };

    const performAutosave = () => {
        if (!initialScript || !tenantRouter) return;
        setAutosaveStatus('saving');
        const payload = buildUpdatePayload();
        router.put(tenantRouter.route('script.update', { script: initialScript.uuid }), payload, {
            preserveScroll: true,
            onFinish: () => {
                setAutosaveStatus('saved');
                setTimeout(() => setAutosaveStatus('idle'), 2000);
            },
            onError: () => setAutosaveStatus('idle'),
        });
    };

    const performCreateSave = () => {
        if (isEdit || !tenantRouter) return;
        setAutosaveStatus('saving');
        const state = formStateRef.current;
        const titleOptionsPayload = state.pageTitle.trim()
            ? [{ title: state.pageTitle.trim(), thumbnail_text: state.mainThumbnailText ?? null, is_primary: true }]
            : [];
        router.post(tenantRouter.route('script.store'), {
            title: state.pageTitle.trim() || 'Untitled script',
            thumbnail_text: state.mainThumbnailText ?? null,
            script_type_id: state.scriptTypeId ? Number(state.scriptTypeId) : null,
            content: state.content,
            description: state.descriptionData?.descriptionBlock ?? null,
            meta_tags: state.descriptionData?.metaTags ?? null,
            status: 'draft',
            title_options: titleOptionsPayload,
        }, {
            preserveScroll: false,
            onFinish: () => setAutosaveStatus('idle'),
            onError: () => setAutosaveStatus('idle'),
        });
    };

    useEffect(() => {
        if (readOnly) return;
        if (Date.now() < autosaveReadyAtRef.current) return;

        if (autosaveTimeoutRef.current) {
            clearTimeout(autosaveTimeoutRef.current);
        }
        autosaveTimeoutRef.current = setTimeout(() => {
            autosaveTimeoutRef.current = null;
            if (isEdit && initialScript) {
                performAutosave();
            } else if (!isEdit) {
                const state = formStateRef.current;
                const hasContent = (state.pageTitle?.trim() ?? '') !== '' || (state.content?.length ?? 0) > 0;
                if (hasContent) performCreateSave();
            }
        }, AUTOSAVE_DEBOUNCE_MS);

        return () => {
            if (autosaveTimeoutRef.current) {
                clearTimeout(autosaveTimeoutRef.current);
                autosaveTimeoutRef.current = null;
            }
        };
    }, [content, pageTitle, mainThumbnailText, scriptTypeId, descriptionData, titleOptions, isEdit, initialScript?.id, readOnly]);

    const handleSave = () => {
        setIsSaving(true);
        if (isEdit && initialScript) {
            const payload = buildUpdatePayload();
            router.put(tenantRouter.route('script.update', { script: initialScript.uuid }), payload, {
                preserveScroll: true,
                onFinish: () => setIsSaving(false),
                onError: () => setIsSaving(false),
            });
        } else {
            const titleOptionsPayload = pageTitle.trim()
                ? [{ title: pageTitle.trim(), thumbnail_text: mainThumbnailText ?? null, is_primary: true }]
                : [];
            router.post(tenantRouter.route('script.store'), {
                title: pageTitle.trim() || 'Untitled script',
                thumbnail_text: mainThumbnailText ?? null,
                script_type_id: scriptTypeId ? Number(scriptTypeId) : null,
                content,
                description: descriptionData?.descriptionBlock ?? null,
                meta_tags: descriptionData?.metaTags ?? null,
                status: 'draft',
                title_options: titleOptionsPayload,
            }, {
                preserveScroll: true,
                onFinish: () => setIsSaving(false),
                onError: () => setIsSaving(false),
            });
        }
    };

    const handleDelete = () => {
        if (!initialScript || !window.confirm('Delete this script? This cannot be undone.')) return;
        router.delete(tenantRouter.route('script.destroy', { script: initialScript.uuid }), {
            preserveScroll: false,
        });
    };

    const handleGenerateDescriptionAssets = async () => {
        setIsGeneratingDescription(true);
        setDescriptionError(null);
        const plainText = blocksToPlainText(content);
        const url = tenantRouter.route('script.generate-description-assets');
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
        a.download = 'script.json';
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
                    } catch (error) {
                        console.error('Error loading file:', error);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    const fetchShareData = async () => {
        if (!initialScript) return;
        setShareLoading(true);
        try {
            const url = tenantRouter.route('script.share', { script: initialScript.uuid });
            const res = await fetch(url, { headers: { Accept: 'application/json' } });
            const data = await res.json();
            if (res.ok) setShareData(data);
        } finally {
            setShareLoading(false);
        }
    };

    useEffect(() => {
        if (shareSheetOpen && initialScript && canManageAccess) fetchShareData();
    }, [shareSheetOpen, initialScript?.id, canManageAccess]);

    const handlePublish = async () => {
        if (!initialScript) return;
        setSharePublishLoading(true);
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        try {
            const url = tenantRouter.route('script.publish', { script: initialScript.uuid });
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = await res.json();
            if (res.ok && data.public_url) {
                setShareData((prev) => prev ? { ...prev, visibility: 'published', public_url: data.public_url, share_token: data.share_token } : null);
            }
        } finally {
            setSharePublishLoading(false);
        }
    };

    const handleUnpublish = async () => {
        if (!initialScript) return;
        setSharePublishLoading(true);
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        try {
            const url = tenantRouter.route('script.unpublish', { script: initialScript.uuid });
            await fetch(url, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
            });
            setShareData((prev) => prev ? { ...prev, visibility: 'private', public_url: null } : null);
        } finally {
            setSharePublishLoading(false);
        }
    };

    const handleInvite = async () => {
        if (!initialScript || !inviteEmail.trim()) return;
        setInviteLoading(true);
        setInviteError(null);
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        try {
            const url = tenantRouter.route('script.collaborators.store', { script: initialScript.uuid });
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
            });
            const data = await res.json();
            if (res.ok && data.collaborator) {
                setShareData((prev) => prev ? { ...prev, collaborators: [...(prev.collaborators || []), data.collaborator] } : null);
                setInviteEmail('');
                setInviteRole('view');
            } else {
                setInviteError(data.message || 'Failed to invite.');
            }
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRemoveCollaborator = async (userId: number) => {
        if (!initialScript) return;
        const url = tenantRouter.route('script.collaborators.destroy', { script: initialScript.uuid, user: userId });
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        await fetch(url, { method: 'DELETE', headers: { 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' } });
        setShareData((prev) => prev ? { ...prev, collaborators: (prev.collaborators || []).filter((c) => c.user_id !== userId) } : null);
    };

    const handleUpdateCollaboratorRole = async (userId: number, role: string) => {
        if (!initialScript) return;
        const url = tenantRouter.route('script.collaborators.update', { script: initialScript.uuid, user: userId });
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ role }),
        });
        setShareData((prev) => {
            if (!prev) return prev;
            return { ...prev, collaborators: (prev.collaborators || []).map((c) => (c.user_id === userId ? { ...c, role } : c)) };
        });
    };

    const copyPublicLink = () => {
        if (shareData?.public_url) {
            navigator.clipboard.writeText(shareData.public_url);
            toast.success('Link copied to clipboard');
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Scripts', href: tenantRouter.route('script.index') },
        { title: isEdit ? (initialScript?.title || 'Edit script') : 'New script', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle || (isEdit ? 'Edit script' : 'New script')} />
            <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <Button variant="outline" size="icon" asChild>
                            <Link href={tenantRouter.route('script.index')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Input
                            value={pageTitle}
                            onChange={(e) => setPageTitle(e.target.value)}
                            placeholder="Untitled script"
                            disabled={readOnly}
                            className="min-w-[200px] max-w-2xl flex-1 border-0 bg-transparent text-2xl font-semibold shadow-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-3xl disabled:opacity-80"
                        />
                        <div className="ml-auto flex shrink-0 items-center gap-1">
                            {isEdit && autosaveStatus !== 'idle' && (
                                <span className="text-muted-foreground text-xs">
                                    {autosaveStatus === 'saving' ? 'Saving…' : 'Saved'}
                                </span>
                            )}
                            {!isEdit && autosaveStatus === 'saving' && (
                                <span className="text-muted-foreground text-xs">Saving…</span>
                            )}
                            {canManageAccess && (
                                <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setShareSheetOpen(true)}>
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Share
                                </Button>
                            )}
                            {!readOnly && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={handleSave} disabled={isSaving}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {isSaving ? (isEdit ? 'Saving…' : 'Saving…') : (isEdit ? 'Save now' : 'Save to create script')}
                                        </DropdownMenuItem>
                                        {isEdit && initialScript?.can_delete && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete script
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleExport}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Export
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleLoad}>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Load
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                    {scriptTypes.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Label className="text-muted-foreground shrink-0 text-sm">Type</Label>
                            <Select value={scriptTypeId ?? ''} onValueChange={setScriptTypeId} disabled={readOnly}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {scriptTypes.map((t) => (
                                        <SelectItem key={t.id} value={String(t.id)}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {!readOnly && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    {/* Title ideas: show Generate only when no ideas yet; otherwise only View ideas (includes saved title options) */}
                    {!hasIdeasToView ? (
                        <Popover
                            open={generatePopoverOpen}
                            onOpenChange={(open) => {
                                setGeneratePopoverOpen(open);
                                if (open) setGenerateError(null);
                            }}
                        >
                            <PopoverTrigger asChild>
                                <Button type="button" variant="outline" size="sm" className="shrink-0" disabled={isGenerating}>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    {isGenerating ? 'Generating…' : 'Generate title ideas'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="start" side="bottom">
                                <div className="space-y-3">
                                    <div>
                                        <h4 className="font-medium leading-none">Choose title style</h4>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            Pick one or more. We’ll use your script content to generate ideas.
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
                                                    <span className="text-muted-foreground text-xs">{opt.description}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => handleGenerateTitleIdeas()}
                                        disabled={selectedTitleStyles.length === 0}
                                    >
                                        Generate ideas
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    ) : (
                        <Sheet open={ideasSheetOpen} onOpenChange={setIdeasSheetOpen}>
                                <SheetTrigger asChild>
                                    <Button type="button" variant="ghost" size="sm" className="shrink-0">
                                        <List className="mr-2 h-4 w-4" />
                                        View ideas
                                        <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                                            {displayIdeas.length}
                                        </span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-full sm:max-w-md">
                                    <SheetHeader>
                                        <SheetTitle>Title ideas</SheetTitle>
                                        <SheetDescription>
                                            Checkmark sets one as the current title; the rest stay. Remove only the ones you don’t want. Regenerate adds new ideas below. Edit with the pencil. Changes save with the script.
                                        </SheetDescription>
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={isGenerating}
                                                onClick={() => handleGenerateTitleIdeas(selectedTitleStyles.length > 0 ? undefined : ['curiosity'])}
                                            >
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                {isGenerating ? 'Generating…' : 'Regenerate'}
                                            </Button>
                                        </div>
                                    </SheetHeader>
                                <div className="flex flex-1 flex-col gap-2 overflow-auto py-4">
                                    {displayIdeas.map((item) =>
                                        item.kind === 'suggestion' ? (() => {
                                            const { suggestion } = item;
                                            const isEditing = editingTitleKey === `sug-${suggestion.id}`;
                                            return (
                                            <div key={`sug-${suggestion.id}`} className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
                                                {isEditing ? (
                                                    <>
                                                        <Label className="text-xs">Title</Label>
                                                        <Input
                                                            value={editingTitleDraft.title}
                                                            onChange={(e) => setEditingTitleDraft((d) => ({ ...d, title: e.target.value }))}
                                                            placeholder="Title"
                                                            className="h-9"
                                                        />
                                                        <Label className="text-xs">Thumbnail text (optional)</Label>
                                                        <Input
                                                            value={editingTitleDraft.thumbnailText}
                                                            onChange={(e) => setEditingTitleDraft((d) => ({ ...d, thumbnailText: e.target.value }))}
                                                            placeholder="Short text for thumbnail"
                                                            className="h-9"
                                                        />
                                                        <div className="flex gap-2 pt-1">
                                                            <Button type="button" size="sm" onClick={applyEditingTitle}>Save</Button>
                                                            <Button type="button" size="sm" variant="ghost" onClick={cancelEditingTitle}>Cancel</Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium">{suggestion.text}</p>
                                                                {suggestion.thumbnailText && (
                                                                    <p className="text-muted-foreground mt-1 text-xs">{suggestion.thumbnailText}</p>
                                                                )}
                                                            </div>
                                                            <div className="flex shrink-0 gap-1">
                                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUseAsTitle(suggestion)} title="Use as title">
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAddSuggestionToList(suggestion)} title="Add to saved titles">
                                                                    <Plus className="h-4 w-4" />
                                                                </Button>
                                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditingSuggestion(suggestion)} title="Edit">
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveSuggestion(suggestion.id)} title="Remove">
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                          ); })()
                                        : (() => {
                                            const { option, index } = item;
                                            const isEditing = editingTitleKey === `opt-${index}`;
                                            return (
                                            <div key={`opt-${option.id ?? option.title ?? index}`} className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
                                                {isEditing ? (
                                                    <>
                                                        <Label className="text-xs">Title</Label>
                                                        <Input
                                                            value={editingTitleDraft.title}
                                                            onChange={(e) => setEditingTitleDraft((d) => ({ ...d, title: e.target.value }))}
                                                            placeholder="Title"
                                                            className="h-9"
                                                        />
                                                        <Label className="text-xs">Thumbnail text (optional)</Label>
                                                        <Input
                                                            value={editingTitleDraft.thumbnailText}
                                                            onChange={(e) => setEditingTitleDraft((d) => ({ ...d, thumbnailText: e.target.value }))}
                                                            placeholder="Short text for thumbnail"
                                                            className="h-9"
                                                        />
                                                        <div className="flex gap-2 pt-1">
                                                            <Button type="button" size="sm" onClick={applyEditingTitle}>Save</Button>
                                                            <Button type="button" size="sm" variant="ghost" onClick={cancelEditingTitle}>Cancel</Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium">{option.title}</p>
                                                                {option.thumbnail_text && (
                                                                    <p className="text-muted-foreground mt-1 text-xs">{option.thumbnail_text}</p>
                                                                )}
                                                                {option.is_primary && (
                                                                    <p className="text-muted-foreground mt-1 text-xs">Current title</p>
                                                                )}
                                                            </div>
                                                            <div className="flex shrink-0 gap-1">
                                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleUseAsTitleOption(option)} title="Use as title" disabled={option.is_primary}>
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditingOption(option, index)} title="Edit">
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveOption(option)} title="Remove">
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                          ); })()
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    )}
                    {generateError && (
                        <p className="text-destructive text-sm" role="alert">{generateError}</p>
                    )}

                    {/* Description: show Generate only when none yet; otherwise only View */}
                    {!descriptionData ? (
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
                    ) : (
                        <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={() => setDescriptionSheetOpen(true)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View description & tags
                        </Button>
                    )}
                    {descriptionError && (
                        <p className="text-destructive text-sm" role="alert">{descriptionError}</p>
                    )}
                    {/* Thumbnails: only for existing scripts; view/add/delete images in a side sheet */}
                    {isEdit && (
                        <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={() => setThumbnailsSheetOpen(true)}>
                            <ImagePlus className="mr-2 h-4 w-4" />
                            {thumbnails.length > 0 ? `Thumbnails (${thumbnails.length})` : 'Thumbnails'}
                        </Button>
                    )}
                    <Sheet open={descriptionSheetOpen} onOpenChange={(open) => { setDescriptionSheetOpen(open); if (open) setDescriptionError(null); }}>
                        <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-xl">
                            <SheetHeader className="px-6 pt-6 pb-4">
                                <SheetTitle>Description, timestamps & tags</SheetTitle>
                                <SheetDescription>
                                    Edit below — changes are saved automatically with the script. Copy description or meta tags as needed.
                                </SheetDescription>
                                {descriptionData && (
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <Button type="button" variant="secondary" size="sm" onClick={() => copyToClipboard(descriptionData.descriptionBlock)}>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy description
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={isGeneratingDescription}
                                            onClick={handleGenerateDescriptionAssets}
                                        >
                                            <FileText className="mr-2 h-4 w-4" />
                                            {isGeneratingDescription ? 'Generating…' : 'Regenerate'}
                                        </Button>
                                    </div>
                                )}
                            </SheetHeader>
                            {descriptionData && (
                                <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-8 pt-2">
                                    <section className="space-y-2">
                                        <label className="text-sm font-medium">Description, related videos & timestamps</label>
                                        <Textarea
                                            value={descriptionData.descriptionBlock}
                                            onChange={(e) => setDescriptionData((prev) => prev ? { ...prev, descriptionBlock: e.target.value } : null)}
                                            rows={18}
                                            className="min-h-[320px] resize-y font-sans text-sm leading-relaxed"
                                            placeholder="Short description…"
                                        />
                                    </section>
                                    <section className="space-y-2 rounded-lg border border-border/60 bg-muted/10 p-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <label className="text-sm font-medium">Meta tags</label>
                                            <span className={`text-xs tabular-nums ${descriptionData.metaTags.length > META_TAGS_MAX_LENGTH ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                {descriptionData.metaTags.length} / {META_TAGS_MAX_LENGTH}
                                            </span>
                                        </div>
                                        <Textarea
                                            value={descriptionData.metaTags}
                                            onChange={(e) => setDescriptionData((prev) => prev ? { ...prev, metaTags: e.target.value.slice(0, META_TAGS_MAX_LENGTH) } : null)}
                                            maxLength={META_TAGS_MAX_LENGTH}
                                            rows={3}
                                            className="resize-y font-sans text-sm"
                                            placeholder="tag1, tag2, tag3… (max 500 characters for YouTube)"
                                        />
                                        <div className="flex justify-end">
                                            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => copyToClipboard(descriptionData.metaTags, 'Tags copied!')}>
                                                <Copy className="mr-1.5 h-3.5 w-3.5" />
                                                Copy tags
                                            </Button>
                                        </div>
                                    </section>
                                </div>
                            )}
                        </SheetContent>
                    </Sheet>
                    <Sheet open={thumbnailsSheetOpen} onOpenChange={setThumbnailsSheetOpen}>
                        <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-lg">
                            <SheetHeader className="px-6 pt-6 pb-4">
                                <SheetTitle className="flex items-center gap-2">
                                    <ImagePlus className="h-5 w-5" />
                                    Thumbnails
                                </SheetTitle>
                                <SheetDescription>
                                    Overlay text is set in Title ideas. Here you can add and view thumbnail images for this script — upload to keep a gallery, remove any you don’t need.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-8 pt-2">
                                {mainThumbnailText && (
                                    <section className="rounded-lg border border-border/60 bg-muted/10 p-3">
                                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Overlay text</p>
                                        <p className="mt-1 text-sm">{mainThumbnailText}</p>
                                        <p className="text-muted-foreground mt-1 text-xs">Edit in Title ideas → use or edit a title option.</p>
                                    </section>
                                )}
                                <section>
                                    <div className="flex items-center justify-between gap-2 pb-2">
                                        <p className="text-sm font-medium">Images</p>
                                        {!readOnly && (
                                            <>
                                                <input
                                                    ref={thumbnailInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleThumbnailUpload}
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={thumbnailUploading}
                                                    onClick={() => thumbnailInputRef.current?.click()}
                                                >
                                                    {thumbnailUploading ? 'Uploading…' : 'Add image'}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                    {thumbnails.length === 0 ? (
                                        <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/10 p-8 text-center">
                                            <ImagePlus className="mx-auto h-10 w-10 text-muted-foreground/50" />
                                            <p className="text-muted-foreground mt-2 text-sm">No thumbnail images yet</p>
                                            <p className="text-muted-foreground mt-1 text-xs">Upload an image to get started (e.g. 1280×720 for YouTube).</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                                            {thumbnails.map((thumb) => (
                                                <div key={thumb.id} className="group relative overflow-hidden rounded-lg border bg-muted/30">
                                                    <img src={thumb.url} alt="" className="aspect-video w-full object-cover" />
                                                    {!readOnly && (
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            className="absolute right-2 top-2 h-8 w-8 opacity-90 shadow hover:opacity-100"
                                                            onClick={() => handleThumbnailDelete(thumb)}
                                                            title="Remove"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
                )}

                {readOnly && (
                    <p className="text-muted-foreground mb-4 text-sm">You have view-only access to this script.</p>
                )}

                <EditorErrorBoundary>
                    <ClientOnlyBlockNoteEditor
                        initialContent={content.length > 0 ? content : undefined}
                        onChange={handleContentChange}
                        placeholder="Start typing your script or press '/' for commands..."
                        editable={!readOnly}
                        onAiEditRequest={readOnly ? undefined : handleAiEditSelection}
                    />
                </EditorErrorBoundary>

                {canManageAccess && initialScript && (
                    <Sheet open={shareSheetOpen} onOpenChange={setShareSheetOpen}>
                        <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
                            <SheetHeader className="px-6 pt-6 pb-4">
                                <SheetTitle className="flex items-center gap-2">
                                    <Share2 className="h-5 w-5" />
                                    Share & access
                                </SheetTitle>
                                <SheetDescription>
                                    Invite people or publish a read-only link. Only people with access can open this script.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pb-8 pt-2">
                                <section className="space-y-3">
                                    <h4 className="text-sm font-medium">Publish to web</h4>
                                    {shareLoading ? (
                                        <p className="text-muted-foreground text-sm">Loading…</p>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-muted-foreground text-sm">
                                                    {shareData?.visibility === 'published' ? 'Anyone with the link can view (read-only)' : 'Only people with access can open'}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant={shareData?.visibility === 'published' ? 'secondary' : 'default'}
                                                    size="sm"
                                                    disabled={sharePublishLoading}
                                                    onClick={shareData?.visibility === 'published' ? handleUnpublish : handlePublish}
                                                >
                                                    {sharePublishLoading ? '…' : shareData?.visibility === 'published' ? 'Unpublish' : 'Publish'}
                                                </Button>
                                            </div>
                                            {shareData?.visibility === 'published' && shareData?.public_url && (
                                                <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                                                    <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    <input readOnly className="min-w-0 flex-1 bg-transparent text-sm outline-none" value={shareData.public_url} />
                                                    <Button type="button" variant="ghost" size="sm" onClick={copyPublicLink}>
                                                        Copy
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </section>
                                <section className="space-y-3">
                                    <h4 className="text-sm font-medium">People with access</h4>
                                    {shareData && (
                                        <ul className="space-y-2">
                                            <li className="flex items-center justify-between gap-2 rounded-md border p-2">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">{shareData.owner?.name}</p>
                                                    <p className="text-muted-foreground truncate text-xs">{shareData.owner?.email}</p>
                                                </div>
                                                <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs font-medium">Owner</span>
                                            </li>
                                            {(shareData.collaborators || []).map((c) => (
                                                <li key={c.user_id} className="flex items-center justify-between gap-2 rounded-md border p-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium">{c.name}</p>
                                                        <p className="text-muted-foreground truncate text-xs">{c.email}</p>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-1">
                                                        <Select value={c.role} onValueChange={(v) => handleUpdateCollaboratorRole(c.user_id, v)}>
                                                            <SelectTrigger className="h-8 w-24">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="view">View</SelectItem>
                                                                <SelectItem value="edit">Edit</SelectItem>
                                                                <SelectItem value="admin">Admin</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveCollaborator(c.user_id)} title="Remove">
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        <Input
                                            type="email"
                                            placeholder="Email"
                                            value={inviteEmail}
                                            onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); }}
                                            className="max-w-[180px]"
                                        />
                                        <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'view' | 'edit' | 'admin')}>
                                            <SelectTrigger className="w-28">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="view">View</SelectItem>
                                                <SelectItem value="edit">Edit</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button type="button" size="sm" onClick={handleInvite} disabled={inviteLoading || !inviteEmail.trim()}>
                                            {inviteLoading ? '…' : 'Invite'}
                                        </Button>
                                    </div>
                                    {inviteError && <p className="text-destructive text-sm">{inviteError}</p>}
                                </section>
                            </div>
                        </SheetContent>
                    </Sheet>
                )}
            </div>
        </AppLayout>
    );
}
