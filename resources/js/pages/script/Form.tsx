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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Download, AlertCircle, Sparkles, List, Check, X, FileText, Copy, Eye, ArrowLeft, Trash2, Share2, Link2, MoreHorizontal, Pencil, Plus, ImagePlus, BookOpen, ClipboardList, FileStack, Quote, BarChart2, Film, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTenantRouter } from '@/hooks/use-tenant-router';

/** Simple markdown-style renderer for analysis text (headings, lists, bold). */
function AnalysisMarkdown({ text }: { text: string }) {
    const lines = text.split(/\n/);
    const out: React.ReactNode[] = [];
    let listItems: string[] = [];
    const flushList = () => {
        if (listItems.length > 0) {
            out.push(
                <ul key={out.length} className="list-inside list-disc space-y-0.5 py-1">
                    {listItems.map((item, i) => (
                        <li key={i}>{item.replace(/\*\*(.+?)\*\*/g, (_, w) => (w as string))}</li>
                    ))}
                </ul>
            );
            listItems = [];
        }
    };
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (/^###\s/.test(trimmed)) {
            flushList();
            out.push(<h3 key={out.length} className="mt-3 font-semibold text-sm">{trimmed.slice(3).trim()}</h3>);
        } else if (/^##\s/.test(trimmed)) {
            flushList();
            out.push(<h2 key={out.length} className="mt-4 font-semibold">{trimmed.slice(2).trim()}</h2>);
        } else if (/^#\s/.test(trimmed)) {
            flushList();
            out.push(<h1 key={out.length} className="mt-4 text-lg font-semibold">{trimmed.slice(1).trim()}</h1>);
        } else if (/^[-*]\s/.test(trimmed)) {
            listItems.push(trimmed.slice(1).trim());
        } else if (trimmed === '') {
            flushList();
            out.push(<div key={out.length} className="h-2" />);
        } else {
            flushList();
            out.push(
                <p key={out.length} className="py-0.5 text-sm">
                    {trimmed.split(/(\*\*.+?\*\*)/g).map((part, j) =>
                        /^\*\*.+?\*\*$/.test(part) ? <strong key={j}>{part.slice(2, -2)}</strong> : part
                    )}
                </p>
            );
        }
    }
    flushList();
    return <div className="space-y-0">{out}</div>;
}

const AUTOSAVE_DEBOUNCE_MS = 1500;
const AUTOSAVE_DELAY_AFTER_MOUNT_MS = 2000;

/** Extract all text from BlockNote blocks and count words */
function countWordsInBlocks(blocks: PartialBlock[]): number {
    const extractText = (items: unknown[]): string => {
        let text = '';
        for (const item of items) {
            if (typeof item !== 'object' || item === null) continue;
            const obj = item as Record<string, unknown>;
            // Extract text from inline content
            if (obj.type === 'text' && typeof obj.text === 'string') {
                text += ' ' + obj.text;
            }
            // Recurse into content array (inline elements)
            if (Array.isArray(obj.content)) {
                text += ' ' + extractText(obj.content);
            }
            // Recurse into children array (nested blocks)
            if (Array.isArray(obj.children)) {
                text += ' ' + extractText(obj.children);
            }
        }
        return text;
    };
    const allText = extractText(blocks);
    // Split by whitespace, filter empty strings
    const words = allText.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length;
}

export type OutlineEntry = { id: string; level: number; text: string };

function getOutlineFromBlocks(blocks: PartialBlock[]): OutlineEntry[] {
    const entries: OutlineEntry[] = [];
    const extractText = (items: unknown[]): string => {
        let t = '';
        for (const item of items) {
            if (typeof item !== 'object' || item === null) continue;
            const obj = item as Record<string, unknown>;
            if (obj.type === 'text' && typeof obj.text === 'string') t += obj.text;
            if (Array.isArray(obj.content)) t += extractText(obj.content);
        }
        return t;
    };
    blocks.forEach((block, index) => {
        const type = (block as { type?: string }).type;
        const level = type === 'heading' ? (block as { props?: { level?: number } }).props?.level ?? 1 : 0;
        if (level > 0) {
            const content = (block as { content?: unknown[] }).content;
            const text = Array.isArray(content) ? extractText(content) : '';
            entries.push({ id: (block as { id?: string }).id ?? `h-${index}`, level, text: text.trim() || '(Untitled)' });
        }
    });
    return entries;
}

function minutesAtWpm(wordCount: number, wpm: number): number {
    return Math.max(0, Math.round((wordCount / wpm) * 10) / 10);
}

/** Returns estimated video length at slower (130), normal (150), and faster (170) WPM. */
function getReadingTimeRange(wordCount: number): { slower: number; normal: number; faster: number } {
    return {
        slower: minutesAtWpm(wordCount, WPM_SLOWER),
        normal: minutesAtWpm(wordCount, WPM_NORMAL),
        faster: minutesAtWpm(wordCount, WPM_FASTER),
    };
}

/** Format decimal minutes as "Xm Ys" (e.g. 10.5 → "10m 30s"). */
function formatMinSec(totalMinutes: number): string {
    const totalSeconds = Math.round(totalMinutes * 60);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    if (s === 0) return `${m}m`;
    return `${m}m ${s}s`;
}

/** Normalize timestamp time to MM:SS (leading zero when minute < 10). */
function formatTimestampTime(time: string): string {
    const parts = (time ?? '').trim().split(':');
    const min = Math.max(0, parseInt(parts[0], 10) || 0);
    const sec = Math.max(0, parseInt(parts[1], 10) || 0);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/** Simple readability: average words per sentence. Lower = denser. */
function getReadability(plainText: string): { avgWordsPerSentence: number; label: string } {
    const sentences = plainText.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
    if (sentences.length === 0) return { avgWordsPerSentence: 0, label: '—' };
    const words = plainText.trim().split(/\s+/).filter(Boolean).length;
    const avg = words / sentences.length;
    let label = 'Conversational';
    if (avg > 25) label = 'Dense';
    else if (avg > 18) label = 'Moderate';
    else if (avg < 10) label = 'Very simple';
    return { avgWordsPerSentence: Math.round(avg * 10) / 10, label };
}

const OVERUSED_WORDS = ['actually', 'basically', 'just', 'really', 'very', 'so', 'literally', 'honestly', 'obviously', 'simply', 'clearly', 'quite', 'pretty', 'thing', 'things'];

function getRepetitionStats(plainText: string): { repeatedPhrases: Array<{ phrase: string; count: number }>; overused: Array<{ word: string; count: number }> } {
    const lower = plainText.toLowerCase().replace(/[^\w\s]/g, ' ');
    const words = lower.split(/\s+/).filter(Boolean);
    const phraseCounts: Record<string, number> = {};
    const n = 3;
    for (let i = 0; i <= words.length - n; i++) {
        const phrase = words.slice(i, i + n).join(' ');
        if (phrase.length < 15) continue;
        phraseCounts[phrase] = (phraseCounts[phrase] ?? 0) + 1;
    }
    const repeatedPhrases = Object.entries(phraseCounts)
        .filter(([, c]) => c >= 2)
        .map(([phrase, count]) => ({ phrase, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    const wordCounts: Record<string, number> = {};
    words.forEach((w) => {
        if (OVERUSED_WORDS.includes(w)) wordCounts[w] = (wordCounts[w] ?? 0) + 1;
    });
    const overused = Object.entries(wordCounts)
        .filter(([, c]) => c >= 2)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count);
    return { repeatedPhrases, overused };
}

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

/** BlockNote editor instance for programmatic insert (intro/outro). */
type BlockNoteEditorRef = {
    document: PartialBlock[];
    insertBlocks: (blocks: PartialBlock[], referenceBlock: PartialBlock | string, placement: 'before' | 'after') => void;
    replaceBlocks: (blocksToRemove: (PartialBlock | string)[], blocksToInsert: PartialBlock[]) => void;
};

interface EditorProps {
    initialContent?: PartialBlock[];
    onChange?: (content: PartialBlock[]) => void;
    placeholder?: string;
    editable?: boolean;
    onAiEditRequest?: (selectedText: string, instruction: string) => Promise<string | null>;
    onEditorReady?: (editor: BlockNoteEditorRef) => void;
}

function ClientOnlyBlockNoteEditor(props: EditorProps) {
    const [Editor, setEditor] = useState<React.ComponentType<EditorProps> | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        import('@/components/editor')
            .then((m) => setEditor(() => m.BlockNoteEditor as React.ComponentType<EditorProps>))
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

type InlineLike = { type?: string; text?: string; content?: InlineLike[] };

function getTextFromBlock(block: PartialBlock): string {
    function inlineToText(inline: InlineLike | string): string {
        if (typeof inline === 'string') return inline;
        if (inline.type === 'text' && typeof inline.text === 'string') return inline.text;
        if (inline.type === 'link' && Array.isArray(inline.content)) return inline.content.map(inlineToText).join('');
        return '';
    }
    const parts: string[] = [];
    const content = block.content as InlineLike[] | undefined;
    if (Array.isArray(content)) parts.push(content.map(inlineToText).join(''));
    if (Array.isArray(block.children) && block.children.length) parts.push(block.children.map(getTextFromBlock).join('\n'));
    return parts.filter(Boolean).join('\n');
}

/** Normalize for matching: collapse whitespace, unify quotes. */
function normalizeForMatch(s: string): string {
    return s
        .replace(/\s+/g, ' ')
        .replace(/[\u201C\u201D\u201E\u201F\u2033"]/g, '"')
        .replace(/[\u2018\u2019\u201A\u201B\u2032']/g, "'")
        .trim();
}

/** Find first block whose text contains the given snippet. Tries full match, then first N words, then first N chars. */
function findBlockContainingText(blocks: PartialBlock[], snippet: string): PartialBlock | null {
    const normalized = normalizeForMatch(snippet);
    if (!normalized) return null;
    const firstWords = normalized.split(/\s+/).slice(0, 15).join(' ');
    const firstChars = normalized.slice(0, 100);
    const searchPhrases = [normalized];
    if (firstWords.length < normalized.length) searchPhrases.push(firstWords);
    if (firstChars.length < normalized.length && firstChars.length >= 20) searchPhrases.push(firstChars);

    function search(blks: PartialBlock[]): PartialBlock | null {
        for (const block of blks) {
            const text = getTextFromBlock(block);
            const normText = normalizeForMatch(text);
            for (const phrase of searchPhrases) {
                if (phrase.length >= 10 && normText.includes(phrase)) return block;
            }
            if (Array.isArray(block.children)) {
                const found = search(block.children);
                if (found) return found;
            }
        }
        return null;
    }
    return search(blocks);
}

function blocksToPlainText(blocks: PartialBlock[]): string {
    if (!blocks?.length) return '';
    return blocks.map(getTextFromBlock).filter(Boolean).join('\n\n');
}

const META_TAGS_MAX_LENGTH = 500;

interface DescriptionAssets {
    descriptionBlock: string;
    metaTags: string;
}

const WPM_SLOWER = 130;
const WPM_NORMAL = 150;
const WPM_FASTER = 170;

/** Script templates: PartialBlock[] for starting from a structure. Content uses simple inline text (BlockNote accepts at runtime). */
const SCRIPT_TEMPLATES: { id: string; name: string; content: PartialBlock[] }[] = [
    {
        id: 'review',
        name: 'Review',
        content: [
            { id: crypto.randomUUID(), type: 'heading', content: [{ type: 'text', text: 'Hook (first 30 sec)' }], props: { level: 2 } },
            { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: '' }] },
            { id: crypto.randomUUID(), type: 'heading', content: [{ type: 'text', text: 'Intro' }], props: { level: 2 } },
            { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: '' }] },
            { id: crypto.randomUUID(), type: 'heading', content: [{ type: 'text', text: 'Main review' }], props: { level: 2 } },
            { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: '' }] },
            { id: crypto.randomUUID(), type: 'heading', content: [{ type: 'text', text: 'Verdict & CTA' }], props: { level: 2 } },
            { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: '' }] },
        ],
    },
    {
        id: 'tutorial',
        name: 'Tutorial',
        content: [
            { id: crypto.randomUUID(), type: 'heading', content: [{ type: 'text', text: 'Hook (first 30 sec)' }], props: { level: 2 } },
            { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: '' }] },
            { id: crypto.randomUUID(), type: 'heading', content: [{ type: 'text', text: 'What we\'ll cover' }], props: { level: 2 } },
            { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: '' }] },
            { id: crypto.randomUUID(), type: 'heading', content: [{ type: 'text', text: 'Step 1' }], props: { level: 2 } },
            { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: '' }] },
            { id: crypto.randomUUID(), type: 'heading', content: [{ type: 'text', text: 'Step 2' }], props: { level: 2 } },
            { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: '' }] },
            { id: crypto.randomUUID(), type: 'heading', content: [{ type: 'text', text: 'Step 3' }], props: { level: 2 } },
            { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: '' }] },
            { id: crypto.randomUUID(), type: 'heading', content: [{ type: 'text', text: 'Outro & subscribe' }], props: { level: 2 } },
            { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: '' }] },
        ],
    },
    {
        id: 'listicle',
        name: 'Listicle',
        content: [
            { id: crypto.randomUUID(), type: 'heading', content: [{ type: 'text', text: 'Hook (first 30 sec)' }], props: { level: 2 } },
            { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: '' }] },
            { id: crypto.randomUUID(), type: 'heading', content: [{ type: 'text', text: 'Intro' }], props: { level: 2 } },
            { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: '' }] },
            { id: crypto.randomUUID(), type: 'heading', content: [{ type: 'text', text: 'Point 1' }], props: { level: 2 } },
            { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: '' }] },
            { id: crypto.randomUUID(), type: 'heading', content: [{ type: 'text', text: 'Point 2' }], props: { level: 2 } },
            { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: '' }] },
            { id: crypto.randomUUID(), type: 'heading', content: [{ type: 'text', text: 'Point 3' }], props: { level: 2 } },
            { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: '' }] },
            { id: crypto.randomUUID(), type: 'heading', content: [{ type: 'text', text: 'Outro & subscribe' }], props: { level: 2 } },
            { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: '' }] },
        ],
    },
    {
        id: 'story',
        name: 'Story / Vlog',
        content: [
            { id: crypto.randomUUID(), type: 'heading', content: [{ type: 'text', text: 'Hook (first 30 sec)' }], props: { level: 2 } },
            { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: '' }] },
            { id: crypto.randomUUID(), type: 'heading', content: [{ type: 'text', text: 'Setup' }], props: { level: 2 } },
            { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: '' }] },
            { id: crypto.randomUUID(), type: 'heading', content: [{ type: 'text', text: 'Story' }], props: { level: 2 } },
            { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: '' }] },
            { id: crypto.randomUUID(), type: 'heading', content: [{ type: 'text', text: 'Takeaway & CTA' }], props: { level: 2 } },
            { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: '' }] },
        ],
    },
] as { id: string; name: string; content: PartialBlock[] }[];

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

type ScriptWorkflowStatus = 'draft' | 'writing' | 'completed' | 'published';
type ProductionStatus = 'not_shot' | 'shot' | 'editing' | 'edited';

export interface ChecklistItem {
    id: string;
    label: string;
    checked: boolean;
}

const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
    { id: 'hook', label: 'Hook in first 15 sec', checked: false },
    { id: 'main', label: '3 main points', checked: false },
    { id: 'cta', label: 'Clear CTA', checked: false },
    { id: 'outro', label: 'Outro / subscribe ask', checked: false },
];

interface AnalysisRetentionSaved {
    analysis: string;
    suggestions: Array<{ label: string; originalSnippet: string; suggestedText: string }>;
    generated_at?: string;
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
    production_status: string | null;
    scheduled_at: string | null;
    title_options: TitleOptionRow[];
    thumbnails: ThumbnailRow[];
    checklist?: ChecklistItem[] | null;
    analysis_retention?: AnalysisRetentionSaved | null;
    analysis_cta?: AnalysisRetentionSaved | null;
    analysis_storytelling?: AnalysisRetentionSaved | null;
    reel_captions?: { generated_at: string; options: { caption: string }[] } | null;
    current_user_role?: string | null;
    can_edit?: boolean;
    can_delete?: boolean;
    can_manage_access?: boolean;
    co_authors?: Array<{ user_id: number; name: string; email: string; sort_order?: number }>;
    author?: { user_id: number; name: string; email: string } | null;
    last_edited_by?: { user_id: number; name: string; email: string } | null;
    updated_at?: string | null;
}

interface HRTaskItem {
    id: number;
    title: string;
    status: string;
    due_at: string | null;
    completed_at: string | null;
    assignee: string | null;
}

interface Props {
    /** undefined = edit page with deferred script still loading */
    script: ScriptForEdit | null | undefined;
    scriptTypes: ScriptTypeOption[];
    hrTasks?: HRTaskItem[];
}

function SnippetAddForm({
    tenantRouter,
    onAdded,
}: {
    tenantRouter: ReturnType<typeof useTenantRouter>;
    onAdded: (s: { id: number; title: string; body: string }) => void;
}) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) return;
        setLoading(true);
        const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        try {
            const res = await fetch(tenantRouter.route('script.snippets.store'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf, 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ title: title.trim(), body: body.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.snippet) {
                onAdded(data.snippet);
                setTitle('');
                setBody('');
                toast.success('Snippet saved');
            } else toast.error(data.message ?? 'Failed to save');
        } catch {
            toast.error('Failed to save');
        } finally {
            setLoading(false);
        }
    };
    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="h-9" />
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" rows={2} className="resize-y text-sm" />
            <Button type="submit" size="sm" disabled={loading || !title.trim() || !body.trim()}>{loading ? 'Saving…' : 'Add snippet'}</Button>
        </form>
    );
}

/** Skeleton shown while script data is loading (deferred prop) on the edit page. */
function EditorPageSkeleton() {
    const tenantRouter = useTenantRouter();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Scripts', href: tenantRouter.route('script.index') },
        { title: 'Loading…', href: '#' },
    ];
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Loading script…" />
            <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
                        <Skeleton className="h-9 min-w-[200px] max-w-2xl flex-1" />
                        <div className="ml-auto flex gap-2">
                            <Skeleton className="h-9 w-20 rounded-md" />
                            <Skeleton className="h-9 w-9 rounded-md" />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-10" />
                            <Skeleton className="h-9 w-[180px]" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-9 w-[190px]" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-9 w-[150px]" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-9 w-[160px]" />
                        </div>
                    </div>
                </div>
                <div className="mb-4 flex gap-2">
                    <Skeleton className="h-9 w-40 rounded-md" />
                    <Skeleton className="h-9 w-28 rounded-md" />
                </div>
                <Skeleton className="min-h-[60vh] w-full rounded-lg" aria-hidden="true" />
            </div>
        </AppLayout>
    );
}

interface ShareData {
    visibility: string;
    share_token: string | null;
    public_url: string | null;
    owner: { user_id: number; name: string; email: string; role: string };
    collaborators: Array<{ user_id: number; name: string; email: string; role: string }>;
    org_members?: Array<{ user_id: number; name: string; email: string }>;
    access_denied_user_ids?: number[];
}

interface CoAuthorRow {
    user_id: number;
    name: string;
    email: string;
    sort_order?: number;
}

export default function ScriptForm({ script: initialScript, scriptTypes, hrTasks = [] }: Props) {
    const tenantRouter = useTenantRouter();
    const isEdit = initialScript !== null && initialScript !== undefined;
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
    const normalizeStatus = (s: string | undefined): ScriptWorkflowStatus => {
        if (s === 'writing' || s === 'completed' || s === 'published') return s;
        if (s === 'in_review') return 'writing';
        if (s === 'archived') return 'completed';
        return 'draft';
    };
    const [workflowStatus, setWorkflowStatus] = useState<ScriptWorkflowStatus>(() =>
        normalizeStatus(initialScript?.status)
    );
    const [productionStatus, setProductionStatus] = useState<ProductionStatus>(
        (initialScript?.production_status as ProductionStatus) ?? 'not_shot'
    );
    const [scheduledAt, setScheduledAt] = useState<string>(() => {
        const v = initialScript?.scheduled_at;
        if (!v) return '';
        try {
            const d = new Date(v);
            if (Number.isNaN(d.getTime())) return '';
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const h = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            return `${y}-${m}-${day}T${h}:${min}`;
        } catch {
            return '';
        }
    });
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
    const [showManualTitleForm, setShowManualTitleForm] = useState(false);
    const [manualTitleDraft, setManualTitleDraft] = useState({ title: '', thumbnailText: '' });
    const [checklist, setChecklist] = useState<ChecklistItem[]>(() =>
        initialScript?.checklist?.length ? initialScript.checklist : DEFAULT_CHECKLIST_ITEMS.map((i) => ({ ...i }))
    );
    const [outlineOpen, setOutlineOpen] = useState(false);
    const [analysisPopoverOpen, setAnalysisPopoverOpen] = useState(false);
    const [analysisPanelOpen, setAnalysisPanelOpen] = useState(false);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{
        type: string;
        analysis: string;
        suggestions: Array<{ label: string; originalSnippet: string; suggestedText: string }>;
    } | null>(null);
    const [snippets, setSnippets] = useState<Array<{ id: number; title: string; body: string }>>([]);
    const [snippetsSheetOpen, setSnippetsSheetOpen] = useState(false);
    const [snippetsLoading, setSnippetsLoading] = useState(false);
    const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
    const [shortDialogOpen, setShortDialogOpen] = useState(false);
    const [shortScriptText, setShortScriptText] = useState('');
    const [shortLoading, setShortLoading] = useState(false);
    const [shortCreating, setShortCreating] = useState(false);
    const [aiScriptActionLoading, setAiScriptActionLoading] = useState<string | null>(null);
    const blockNoteEditorRef = useRef<BlockNoteEditorRef | null>(null);
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
    const [inviteMemberId, setInviteMemberId] = useState<number | ''>('');
    const [inviteRole, setInviteRole] = useState<'view' | 'edit' | 'admin'>('view');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [coAuthors, setCoAuthors] = useState<CoAuthorRow[]>(initialScript?.co_authors ?? []);
    const [coAuthorAdding, setCoAuthorAdding] = useState(false);
    const [coAuthorRemoving, setCoAuthorRemoving] = useState<number | null>(null);
    const [coAuthorPickId, setCoAuthorPickId] = useState<number | ''>('');
    const [coAuthorAddAsEditor, setCoAuthorAddAsEditor] = useState(false);
    const [thumbnails, setThumbnails] = useState<ThumbnailRow[]>(initialScript?.thumbnails ?? []);
    const [thumbnailsSheetOpen, setThumbnailsSheetOpen] = useState(false);
    const [thumbnailUploading, setThumbnailUploading] = useState(false);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);
    const [reelCaptionsSheetOpen, setReelCaptionsSheetOpen] = useState(false);
    const [reelCaptionsLoading, setReelCaptionsLoading] = useState(false);
    const [reelCaptionsData, setReelCaptionsData] = useState<{ generated_at: string; options: { caption: string }[] } | null>(initialScript?.reel_captions ?? null);
    const hasHydratedFromDeferredRef = useRef(false);

    const autosaveReadyAtRef = useRef<number>(Date.now() + AUTOSAVE_DELAY_AFTER_MOUNT_MS);
    const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const saveInProgressRef = useRef(false);

    const anyBackgroundLoading = useMemo(
        () =>
            analysisLoading ||
            shortLoading ||
            reelCaptionsLoading ||
            isGenerating ||
            isGeneratingDescription ||
            !!aiScriptActionLoading ||
            shareLoading ||
            sharePublishLoading ||
            inviteLoading ||
            thumbnailUploading ||
            snippetsLoading ||
            autosaveStatus === 'saving',
        [
            analysisLoading,
            shortLoading,
            reelCaptionsLoading,
            isGenerating,
            isGeneratingDescription,
            aiScriptActionLoading,
            shareLoading,
            sharePublishLoading,
            inviteLoading,
            thumbnailUploading,
            snippetsLoading,
            autosaveStatus,
        ]
    );
    const formStateRef = useRef({
        content,
        pageTitle,
        mainThumbnailText,
        scriptTypeId,
        descriptionData,
        titleOptions,
        workflowStatus,
        scheduledAt,
        productionStatus,
        checklist,
    });

    formStateRef.current = {
        content,
        pageTitle,
        mainThumbnailText,
        scriptTypeId,
        descriptionData,
        titleOptions,
        workflowStatus,
        scheduledAt,
        productionStatus,
        checklist,
    };

    useEffect(() => {
        if (initialScript != null && typeof initialScript === 'object' && !hasHydratedFromDeferredRef.current) {
            hasHydratedFromDeferredRef.current = true;
            setContent(initialScript.content?.length ? initialScript.content : []);
            setPageTitle(initialScript.title ?? '');
            setMainThumbnailText(initialScript.thumbnail_text ?? null);
            setScriptTypeId(initialScript.script_type_id != null ? String(initialScript.script_type_id) : null);
            setWorkflowStatus(normalizeStatus(initialScript.status));
            setProductionStatus((initialScript.production_status as ProductionStatus) ?? 'not_shot');
            if (initialScript.scheduled_at) {
                try {
                    const d = new Date(initialScript.scheduled_at);
                    if (!Number.isNaN(d.getTime())) {
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        const h = String(d.getHours()).padStart(2, '0');
                        const min = String(d.getMinutes()).padStart(2, '0');
                        setScheduledAt(`${y}-${m}-${day}T${h}:${min}`);
                    }
                } catch {
                    setScheduledAt('');
                }
            } else {
                setScheduledAt('');
            }
            setTitleOptions(initialScript.title_options?.length ? initialScript.title_options : []);
            setDescriptionData(
                initialScript.description || initialScript.meta_tags
                    ? { descriptionBlock: initialScript.description ?? '', metaTags: initialScript.meta_tags ?? '' }
                    : null
            );
            setThumbnails(initialScript.thumbnails ?? []);
            setReelCaptionsData(initialScript.reel_captions ?? null);
            setChecklist(
                initialScript.checklist?.length
                    ? initialScript.checklist
                    : DEFAULT_CHECKLIST_ITEMS.map((i) => ({ ...i }))
            );
        }
    }, [initialScript]);

    const handleContentChange = (blocks: PartialBlock[]) => {
        setContent(blocks);
    };

    const PRESET_TO_ACTION: Record<string, string> = {
        'Shorten this.': 'shorten',
        'Expand this.': 'expand',
        'Make it more casual.': 'casual',
        'Add an example.': 'add_example',
    };

    const handleAiEditSelection = async (
        selectedText: string,
        instruction: string
    ): Promise<string | null> => {
        const action = PRESET_TO_ACTION[instruction];
        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        const url = action
            ? tenantRouter.route('script.ai-script-action')
            : tenantRouter.route('script.ai-edit-selection');
        try {
            const body = action
                ? { action, content: selectedText }
                : {
                      content: blocksToPlainText(content) || '',
                      selected_text: selectedText,
                      instruction,
                  };
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(body),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data.message ?? 'AI edit failed');
                return null;
            }
            const text = action ? data.text : data.rewritten;
            return typeof text === 'string' ? text : null;
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'AI edit failed');
            return null;
        }
    };

    const handleAiScriptAction = async (
        action: 'intro' | 'outro' | 'hook' | 'shorten' | 'expand' | 'casual' | 'add_example',
        options: { selectedText?: string; insertAt?: 'top' | 'bottom' }
    ): Promise<string | null> => {
        setAiScriptActionLoading(action);
        const fullScript = blocksToPlainText(content) || '';
        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        try {
            const body: { action: string; content?: string; full_script?: string } = { action };
            if (options.selectedText) body.content = options.selectedText;
            if (['intro', 'outro', 'hook'].includes(action)) body.full_script = fullScript;
            else if (options.selectedText) body.content = options.selectedText;
            const res = await fetch(tenantRouter.route('script.ai-script-action'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(body),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data.message ?? 'AI action failed');
                return null;
            }
            const text = typeof data.text === 'string' ? data.text : null;
            if (text && options.insertAt) {
                const paragraphs = text.split(/\n\n+/).map((p: string) => p.trim()).filter(Boolean);
                const newBlocks: PartialBlock[] = paragraphs.length > 0
                    ? paragraphs.map((p: string) => ({ type: 'paragraph', content: p } as PartialBlock))
                    : [{ type: 'paragraph', content: text } as PartialBlock];
                const editor = blockNoteEditorRef.current;
                if (editor?.document && (editor.insertBlocks || editor.replaceBlocks)) {
                    try {
                        const doc = editor.document;
                        if (doc.length > 0) {
                            if (options.insertAt === 'top') {
                                editor.insertBlocks(newBlocks, doc[0], 'before');
                            } else {
                                editor.insertBlocks(newBlocks, doc[doc.length - 1], 'after');
                            }
                        } else {
                            editor.replaceBlocks([], newBlocks);
                        }
                    } catch (e) {
                        console.warn('Editor insert failed, falling back to setContent', e);
                        if (options.insertAt === 'top') setContent([...newBlocks, ...content]);
                        else setContent([...content, ...newBlocks]);
                    }
                } else {
                    if (options.insertAt === 'top') setContent([...newBlocks, ...content]);
                    else setContent([...content, ...newBlocks]);
                }
            }
            return text;
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'AI action failed');
            return null;
        } finally {
            setAiScriptActionLoading(null);
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

    const handleGenerateReelCaptions = async () => {
        if (!initialScript?.uuid) return;
        setReelCaptionsLoading(true);
        try {
            const path = `/${tenantRouter.tenant.slug}/script/${initialScript.uuid}/generate-reel-captions`;
            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
            const res = await fetch(path, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data.message ?? 'Could not generate captions.');
                return;
            }
            setReelCaptionsData({ generated_at: data.generated_at ?? '', options: data.options ?? [] });
        } catch {
            toast.error('Network error. Try again.');
        } finally {
            setReelCaptionsLoading(false);
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

    const handleAddManualTitle = () => {
        const title = manualTitleDraft.title.trim();
        if (!title) return;
        setTitleOptions((prev) => {
            const exists = prev.some((o) => o.title === title && (o.thumbnail_text ?? null) === (manualTitleDraft.thumbnailText?.trim() ?? null));
            if (exists) return prev;
            const isFirst = prev.length === 0;
            if (isFirst) {
                setPageTitle(title);
                setMainThumbnailText(manualTitleDraft.thumbnailText?.trim() ?? null);
            }
            const thumbnail = manualTitleDraft.thumbnailText?.trim() || null;
            return [...prev.map((o) => ({ ...o, is_primary: false })), { id: undefined, title, thumbnail_text: thumbnail, is_primary: isFirst }];
        });
        setManualTitleDraft({ title: '', thumbnailText: '' });
        setShowManualTitleForm(false);
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

    const wordCount = useMemo(() => countWordsInBlocks(content), [content]);
    const readingTimeRange = useMemo(() => getReadingTimeRange(wordCount), [wordCount]);
    const outlineEntries = useMemo(() => getOutlineFromBlocks(content), [content]);
    const plainTextForQuality = useMemo(() => blocksToPlainText(content), [content]);
    const readability = useMemo(() => getReadability(plainTextForQuality), [plainTextForQuality]);
    const repetitionStats = useMemo(() => getRepetitionStats(plainTextForQuality), [plainTextForQuality]);

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
            status: state.workflowStatus,
            scheduled_at: state.scheduledAt?.trim() ? state.scheduledAt.trim() : null,
            production_status: state.productionStatus,
            title_options: optionsToSend,
            custom_attributes: { checklist: state.checklist },
        };
    };

    const performAutosave = async () => {
        if (!initialScript || !tenantRouter) return;
        if (saveInProgressRef.current) return;
        saveInProgressRef.current = true;
        setAutosaveStatus('saving');
        const payload = buildUpdatePayload();
        try {
            const response = await fetch(tenantRouter.route('script.update', { script: initialScript.uuid }), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''),
                },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                setAutosaveStatus('saved');
                setTimeout(() => setAutosaveStatus('idle'), 2000);
            } else {
                setAutosaveStatus('idle');
            }
        } catch {
            setAutosaveStatus('idle');
        } finally {
            saveInProgressRef.current = false;
        }
    };

    const performCreateSave = async () => {
        if (isEdit || !tenantRouter) return;
        if (saveInProgressRef.current) return;
        saveInProgressRef.current = true;
        setAutosaveStatus('saving');
        const state = formStateRef.current;
        const titleOptionsPayload = state.pageTitle.trim()
            ? [{ title: state.pageTitle.trim(), thumbnail_text: state.mainThumbnailText ?? null, is_primary: true }]
            : [];
        try {
            const response = await fetch(tenantRouter.route('script.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''),
                },
                body: JSON.stringify({
                    title: state.pageTitle.trim() || 'Untitled script',
                    thumbnail_text: state.mainThumbnailText ?? null,
                    script_type_id: state.scriptTypeId ? Number(state.scriptTypeId) : null,
                    content: state.content,
                    description: state.descriptionData?.descriptionBlock ?? null,
                    meta_tags: state.descriptionData?.metaTags ?? null,
                    status: state.workflowStatus,
                    scheduled_at: state.scheduledAt?.trim() ? state.scheduledAt.trim() : null,
                    production_status: state.productionStatus,
                    title_options: titleOptionsPayload,
                    custom_attributes: { checklist: state.checklist },
                }),
            });
            if (response.ok) {
                // Backend returns a redirect - get the URL from the response
                const data = await response.json().catch(() => null);
                if (data?.redirect_url) {
                    router.visit(data.redirect_url, { preserveScroll: false });
                } else {
                    // Fallback: follow the redirect location header or reload
                    const redirectUrl = response.headers.get('X-Inertia-Location') || response.url;
                    if (redirectUrl && redirectUrl !== window.location.href) {
                        router.visit(redirectUrl, { preserveScroll: false });
                    }
                }
            }
            setAutosaveStatus('idle');
        } catch {
            setAutosaveStatus('idle');
        } finally {
            saveInProgressRef.current = false;
        }
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
    }, [content, pageTitle, mainThumbnailText, scriptTypeId, descriptionData, titleOptions, workflowStatus, scheduledAt, productionStatus, checklist, isEdit, initialScript?.id, readOnly]);

    // When only script type changes, trigger a save so it persists without requiring an editor change
    const scriptTypeSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevScriptTypeIdRef = useRef<string | null>(initialScript?.script_type_id != null ? String(initialScript.script_type_id) : null);
    useEffect(() => {
        if (readOnly || !isEdit || !initialScript) return;
        if (scriptTypeId === prevScriptTypeIdRef.current) return;
        prevScriptTypeIdRef.current = scriptTypeId;
        if (scriptTypeSaveTimeoutRef.current) clearTimeout(scriptTypeSaveTimeoutRef.current);
        scriptTypeSaveTimeoutRef.current = setTimeout(() => {
            scriptTypeSaveTimeoutRef.current = null;
            if (Date.now() >= autosaveReadyAtRef.current) performAutosave();
        }, 400);
        return () => {
            if (scriptTypeSaveTimeoutRef.current) {
                clearTimeout(scriptTypeSaveTimeoutRef.current);
                scriptTypeSaveTimeoutRef.current = null;
            }
        };
    }, [scriptTypeId, isEdit, initialScript, readOnly]);

    const prevWorkflowStatusRef = useRef<ScriptWorkflowStatus>(normalizeStatus(initialScript?.status));
    useEffect(() => {
        if (readOnly || !isEdit || !initialScript) return;
        if (workflowStatus === prevWorkflowStatusRef.current) return;
        prevWorkflowStatusRef.current = workflowStatus;
        if (scriptTypeSaveTimeoutRef.current) clearTimeout(scriptTypeSaveTimeoutRef.current);
        scriptTypeSaveTimeoutRef.current = setTimeout(() => {
            scriptTypeSaveTimeoutRef.current = null;
            if (Date.now() >= autosaveReadyAtRef.current) performAutosave();
        }, 400);
        return () => {
            if (scriptTypeSaveTimeoutRef.current) {
                clearTimeout(scriptTypeSaveTimeoutRef.current);
                scriptTypeSaveTimeoutRef.current = null;
            }
        };
    }, [workflowStatus, isEdit, initialScript, readOnly]);

    const prevScheduledAtRef = useRef<string | null>(null);
    useEffect(() => {
        if (readOnly || !isEdit || !initialScript) return;
        const current = scheduledAt?.trim() ?? '';
        if (prevScheduledAtRef.current === null) {
            prevScheduledAtRef.current = current;
            return;
        }
        if (current === prevScheduledAtRef.current) return;
        prevScheduledAtRef.current = current;
        if (scriptTypeSaveTimeoutRef.current) clearTimeout(scriptTypeSaveTimeoutRef.current);
        scriptTypeSaveTimeoutRef.current = setTimeout(() => {
            scriptTypeSaveTimeoutRef.current = null;
            if (Date.now() >= autosaveReadyAtRef.current) performAutosave();
        }, 400);
        return () => {
            if (scriptTypeSaveTimeoutRef.current) {
                clearTimeout(scriptTypeSaveTimeoutRef.current);
                scriptTypeSaveTimeoutRef.current = null;
            }
        };
    }, [scheduledAt, isEdit, initialScript, readOnly]);

    const handleSave = () => {
        setIsSaving(true);
        if (isEdit && initialScript) {
            const payload = buildUpdatePayload();
            router.put(tenantRouter.route('script.update', { script: initialScript.uuid }), payload as unknown as Parameters<typeof router.put>[1], {
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
                status: workflowStatus,
                scheduled_at: scheduledAt?.trim() ? scheduledAt.trim() : null,
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
                const timeStr = formatTimestampTime(ts.time ?? '');
                const labelStr = (ts.label ?? '').trim();
                parts.push(labelStr ? `${timeStr} - ${labelStr}` : timeStr);
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

    type AnalysisType = 'retention' | 'readability' | 'cta' | 'storytelling';

    const getSavedAnalysis = (t: AnalysisType): AnalysisRetentionSaved | null | undefined => {
        if (t === 'retention') return initialScript?.analysis_retention;
        if (t === 'cta') return initialScript?.analysis_cta;
        if (t === 'storytelling') return initialScript?.analysis_storytelling;
        return undefined;
    };

    const runAnalysis = async (type: AnalysisType, forceRegenerate = false) => {
        setAnalysisPopoverOpen(false);
        if (type === 'readability') {
            const analysis = [
                '## Readability',
                `${readability.label} (avg ${readability.avgWordsPerSentence} words/sentence).`,
                '',
                '## Repeated phrases (3+ words)',
                repetitionStats.repeatedPhrases.length === 0
                    ? 'None detected.'
                    : repetitionStats.repeatedPhrases.slice(0, 10).map((p) => `- "${p.phrase}" (${p.count}×)`).join('\n'),
                '',
                '## Overused words',
                repetitionStats.overused.length === 0 ? 'None detected.' : repetitionStats.overused.slice(0, 12).map((w) => `- ${w.word} (${w.count}×)`).join('\n'),
            ].join('\n');
            setAnalysisResult({ type: 'readability', analysis, suggestions: [] });
            setAnalysisPanelOpen(true);
            return;
        }
        const saved = getSavedAnalysis(type);
        if (!forceRegenerate && saved?.analysis) {
            setAnalysisResult({
                type,
                analysis: saved.analysis,
                suggestions: Array.isArray(saved.suggestions) ? saved.suggestions : [],
            });
            setAnalysisPanelOpen(true);
            return;
        }
        setAnalysisLoading(true);
        setAnalysisResult(null);
        try {
            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
            const res = await fetch(tenantRouter.route('script.analyze'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ type, content: blocksToPlainText(content) || '' }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data.message ?? 'Analysis failed.');
                return;
            }
            const result = {
                type,
                analysis: data.analysis ?? '',
                suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
            };
            setAnalysisResult(result);
            setAnalysisPanelOpen(true);
            if (initialScript?.uuid && (type === 'retention' || type === 'cta' || type === 'storytelling')) {
                const path = `/${tenantRouter.tenant.slug}/script/${initialScript.uuid}/analysis-${type}`;
                try {
                    const saveRes = await fetch(path, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
                        body: JSON.stringify({ analysis: result.analysis, suggestions: result.suggestions }),
                    });
                    if (!saveRes.ok) toast.error('Analysis could not be saved for next time.');
                } catch {
                    toast.error('Analysis could not be saved for next time.');
                }
            }
        } catch (e) {
            console.error('Analysis request failed', e);
            toast.error('Network error. Please try again.');
        } finally {
            setAnalysisLoading(false);
        }
    };

    const applySuggestion = (suggestion: { originalSnippet: string; suggestedText: string }) => {
        const editor = blockNoteEditorRef.current;
        if (!editor?.document?.length) {
            toast.error('Editor not ready. Focus the script and try again.');
            return;
        }
        let refBlock = findBlockContainingText(editor.document, suggestion.originalSnippet);
        if (!refBlock && content.length > 0) {
            refBlock = findBlockContainingText(content, suggestion.originalSnippet);
        }
        if (!refBlock) {
            toast.error('Could not find that section in the script. The text may have been edited or the suggestion quote does not match exactly.');
            return;
        }
        const newBlock: PartialBlock = {
            id: `suggestion-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            type: 'paragraph',
            content: [{ type: 'text', text: suggestion.suggestedText }],
        } as PartialBlock;
        editor.insertBlocks([newBlock], refBlock, 'before');
        toast.success('Suggested version added above the original. Compare and edit as needed.');
    };

    const handleGenerateShort = async () => {
        const plain = blocksToPlainText(content) || '';
        if (!plain.trim()) {
            toast.error('Add some script content first.');
            return;
        }
        setShortLoading(true);
        setShortScriptText('');
        try {
            const path = `/${tenantRouter.tenant.slug}/script/generate-short`;
            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
            const res = await fetch(path, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ content: plain }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data.message ?? 'Could not generate short.');
                return;
            }
            setShortScriptText(data.short_script ?? '');
            setShortDialogOpen(true);
        } catch {
            toast.error('Network error. Try again.');
        } finally {
            setShortLoading(false);
        }
    };

    const handleCreateScriptFromShort = async () => {
        if (!shortScriptText.trim()) {
            toast.error('Nothing to save.');
            return;
        }
        setShortCreating(true);
        try {
            const url = tenantRouter.route('script.transcripts.create-script');
            const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
            const title = (initialScript?.title?.trim() || 'Script') + ' SHORT';
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ title, content: shortScriptText.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data.message ?? 'Failed to create script.');
                return;
            }
            const editUrl = data.edit_url;
            if (editUrl) {
                toast.success('Short script created. Opening…');
                router.visit(editUrl);
            } else {
                toast.success('Short script created.');
                setShortDialogOpen(false);
            }
        } catch {
            toast.error('Could not create script. Try again.');
        } finally {
            setShortCreating(false);
        }
    };

    const handleExport = async (format: 'json' | 'csv') => {
        if (!initialScript) return;
        const url = tenantRouter.route('script.export', { script: initialScript.uuid, format });
        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: format === 'csv' ? 'text/csv' : 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ content }),
            });
            if (!res.ok) {
                toast.error('Failed to export script.');
                return;
            }
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `script-${initialScript.uuid}.${format}`;
            a.click();
            URL.revokeObjectURL(blobUrl);
        } catch (e) {
            toast.error('Network error while exporting.');
        }
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

    useEffect(() => {
        if (initialScript?.co_authors) setCoAuthors(initialScript.co_authors);
    }, [initialScript?.co_authors]);

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
                setInviteMemberId('');
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

    const handleReAddRemoved = async (email: string) => {
        if (!initialScript) return;
        setInviteError(null);
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        const url = tenantRouter.route('script.collaborators.store', { script: initialScript.uuid });
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ email, role: 'view' }),
        });
        const data = await res.json();
        if (res.ok && data.collaborator) {
            setShareData((prev) => prev ? { ...prev, collaborators: [...(prev.collaborators || []), data.collaborator], access_denied_user_ids: (prev.access_denied_user_ids || []).filter((id) => id !== data.collaborator.user_id) } : null);
        }
    };

    const handleAddCoAuthor = async (userId: number, addAsCollaborator: boolean) => {
        if (!initialScript) return;
        setCoAuthorAdding(true);
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        try {
            const url = tenantRouter.route('script.co-authors.store', { script: initialScript.uuid });
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ user_id: userId, add_as_collaborator: addAsCollaborator }),
            });
            const data = await res.json();
            if (res.ok && data.co_author) {
                setCoAuthors((prev) => [...prev, data.co_author]);
                if (data.co_author && addAsCollaborator && shareData) {
                    setShareData((prev) => prev ? { ...prev, collaborators: [...(prev.collaborators || []), { user_id: data.co_author.user_id, name: data.co_author.name, email: data.co_author.email, role: 'edit' }], access_denied_user_ids: (prev.access_denied_user_ids || []).filter((id) => id !== data.co_author.user_id) } : null);
                }
            }
        } finally {
            setCoAuthorAdding(false);
        }
    };

    const handleRemoveCoAuthor = async (userId: number) => {
        if (!initialScript) return;
        setCoAuthorRemoving(userId);
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
        try {
            const url = tenantRouter.route('script.co-authors.destroy', { script: initialScript.uuid, user: userId });
            await fetch(url, { method: 'DELETE', headers: { 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' } });
            setCoAuthors((prev) => prev.filter((c) => c.user_id !== userId));
        } finally {
            setCoAuthorRemoving(null);
        }
    };

    if (initialScript === undefined) {
        return <EditorPageSkeleton />;
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Scripts', href: tenantRouter.route('script.index') },
        { title: isEdit ? (initialScript?.title || 'Edit script') : 'New script', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle || (isEdit ? 'Edit script' : 'New script')} />
            {anyBackgroundLoading && (
                <div className="fixed top-0 left-0 right-0 z-[100] h-1 overflow-hidden bg-primary/20" role="progressbar" aria-label="Loading">
                    <div className="h-full w-[40%] animate-[script-loading-bar_1.5s_ease-in-out_infinite] bg-primary" />
                </div>
            )}
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
                        <div className="ml-auto flex shrink-0 items-center gap-2">
                            <span className="text-muted-foreground text-xs tabular-nums">
                                {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
                                {wordCount > 0 && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="ml-1.5 cursor-default">
                                                · ~
                                                {readingTimeRange.faster === readingTimeRange.slower
                                                    ? formatMinSec(readingTimeRange.normal)
                                                    : `${formatMinSec(readingTimeRange.faster)}–${formatMinSec(readingTimeRange.slower)}`}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">
                                            Faster: ~{formatMinSec(readingTimeRange.faster)} · Normal: ~{formatMinSec(readingTimeRange.normal)} · Slower: ~{formatMinSec(readingTimeRange.slower)}
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {((isEdit && autosaveStatus !== 'idle') || (!isEdit && autosaveStatus === 'saving')) && (
                                    <span className="mx-1">·</span>
                                )}
                                {isEdit && autosaveStatus !== 'idle' && (autosaveStatus === 'saving' ? 'Saving…' : 'Saved')}
                                {!isEdit && autosaveStatus === 'saving' && 'Saving…'}
                            </span>
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
                                        <DropdownMenuItem onClick={() => handleExport('json')}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Export JSON
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleExport('csv')}>
                                            <Download className="mr-2 h-4 w-4" />
                                            Export CSV
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
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                    {isEdit && (initialScript?.author || (initialScript?.co_authors && initialScript.co_authors.length > 0) || initialScript?.last_edited_by) && (
                        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            {initialScript?.author && (
                                <span>
                                    <span className="font-medium">Author:</span> {initialScript.author.name}
                                </span>
                            )}
                            {initialScript?.co_authors && initialScript.co_authors.length > 0 && (
                                <span>
                                    <span className="font-medium">Co-authors:</span> {initialScript.co_authors.map((c) => c.name).join(', ')}
                                </span>
                            )}
                            {initialScript?.last_edited_by && (
                                <span>
                                    <span className="font-medium">Last edited by:</span> {initialScript.last_edited_by.name}
                                    {initialScript?.updated_at && (
                                        <span className="ml-1">
                                            ({new Date(initialScript.updated_at).toLocaleDateString(undefined, { dateStyle: 'short' })})
                                        </span>
                                    )}
                                </span>
                            )}
                        </div>
                    )}
                    <div className="flex flex-wrap items-center gap-4">
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
                        <div className="flex items-center gap-2">
                            <Label className="text-muted-foreground shrink-0 text-sm">Scheduled for</Label>
                            <Input
                                type="datetime-local"
                                value={scheduledAt}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                disabled={readOnly}
                                className="w-[190px]"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="text-muted-foreground shrink-0 text-sm">Status</Label>
                            <Select
                                value={workflowStatus}
                                onValueChange={(v) => setWorkflowStatus(v as ScriptWorkflowStatus)}
                                disabled={readOnly}
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="writing">Writing</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="text-muted-foreground shrink-0 text-sm">Production</Label>
                            <Select
                                value={productionStatus}
                                onValueChange={(v) => setProductionStatus(v as ProductionStatus)}
                                disabled={readOnly}
                            >
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="not_shot">Not shot</SelectItem>
                                    <SelectItem value="shot">Shot</SelectItem>
                                    <SelectItem value="editing">Editing</SelectItem>
                                    <SelectItem value="edited">Edited</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {hrTasks && hrTasks.length > 0 && (
                        <div className="mt-3 rounded-md border bg-muted/30 p-3">
                            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">HR tasks linked to this script</p>
                            <ul className="space-y-1.5 text-sm">
                                {hrTasks.map((t) => (
                                    <li key={t.id} className="flex items-center justify-between gap-2">
                                        <a
                                            href={tenantRouter.route('hr.tasks.show', { task: t.id })}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            {t.title}
                                        </a>
                                        <span className="shrink-0 text-muted-foreground">
                                            {t.status}
                                            {t.completed_at
                                                ? ` · Done ${new Date(t.completed_at).toLocaleDateString()}`
                                                : t.due_at
                                                    ? ` · Due ${new Date(t.due_at).toLocaleDateString()}`
                                                    : ''}
                                            {t.assignee ? ` · ${t.assignee}` : ''}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {!readOnly && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    {/* Title ideas: always show both Generate (AI) and View ideas (sidebar for manual add too) */}
                    <Popover
                        open={generatePopoverOpen}
                        onOpenChange={(open) => {
                            setGeneratePopoverOpen(open);
                            if (open) setGenerateError(null);
                        }}
                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                    <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" disabled={isGenerating}>
                                        <Sparkles className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">{isGenerating ? 'Generating…' : 'Generate title ideas'}</TooltipContent>
                        </Tooltip>
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
                    <Sheet
                        open={ideasSheetOpen}
                        onOpenChange={(open) => {
                            setIdeasSheetOpen(open);
                            if (open && displayIdeas.length === 0) setShowManualTitleForm(true);
                        }}
                    >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <SheetTrigger asChild>
                                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 relative">
                                                <List className="h-4 w-4" />
                                                {displayIdeas.length > 0 && (
                                                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-medium">
                                                        {displayIdeas.length}
                                                    </span>
                                                )}
                                            </Button>
                                        </SheetTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        {displayIdeas.length > 0 ? `Title ideas (${displayIdeas.length})` : 'View title ideas'}
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 relative" onClick={() => setReelCaptionsSheetOpen(true)}>
                                            <MessageSquare className="h-4 w-4" />
                                            {reelCaptionsData?.options?.length ? <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-medium">3</span> : null}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">{reelCaptionsData?.options?.length ? 'Reel captions (3)' : 'Reel captions'}</TooltipContent>
                                </Tooltip>
                                <SheetContent side="right" className="w-full sm:max-w-md">
                                    <SheetHeader>
                                        <SheetTitle>Title ideas</SheetTitle>
                                        <SheetDescription>
                                            Checkmark sets one as the current title; the rest stay. Remove only the ones you don’t want. Regenerate adds new ideas below. Edit with the pencil. Changes save with the script.
                                        </SheetDescription>
                                        <div className="flex flex-wrap gap-2 pt-2">
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
                                            <Button
                                                type="button"
                                                variant={showManualTitleForm ? 'secondary' : 'outline'}
                                                size="sm"
                                                onClick={() => {
                                                    setShowManualTitleForm((v) => !v);
                                                    if (showManualTitleForm) setManualTitleDraft({ title: '', thumbnailText: '' });
                                                }}
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                {showManualTitleForm ? 'Cancel' : 'Add title'}
                                            </Button>
                                        </div>
                                    </SheetHeader>
                                <div className="flex flex-1 flex-col gap-2 overflow-auto py-4">
                                    {showManualTitleForm && (
                                        <div className="flex flex-col gap-2 rounded-lg border border-dashed bg-muted/20 p-3">
                                            <Label className="text-xs">Title</Label>
                                            <Input
                                                value={manualTitleDraft.title}
                                                onChange={(e) => setManualTitleDraft((d) => ({ ...d, title: e.target.value }))}
                                                placeholder="Enter your title"
                                                className="h-9"
                                                autoFocus
                                            />
                                            <Label className="text-xs">Thumbnail text (optional)</Label>
                                            <Input
                                                value={manualTitleDraft.thumbnailText}
                                                onChange={(e) => setManualTitleDraft((d) => ({ ...d, thumbnailText: e.target.value }))}
                                                placeholder="Short text for thumbnail"
                                                className="h-9"
                                            />
                                            <Button type="button" size="sm" onClick={handleAddManualTitle} disabled={!manualTitleDraft.title.trim()}>
                                                Add title
                                            </Button>
                                        </div>
                                    )}
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
                    <Sheet open={reelCaptionsSheetOpen} onOpenChange={setReelCaptionsSheetOpen}>
                        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
                            <SheetHeader>
                                <SheetTitle>Reel captions</SheetTitle>
                                <SheetDescription>
                                    Captions for IG Reels, TikTok, Facebook Reels, and X. Generate once — they’re saved with the script. Copy the one you like.
                                </SheetDescription>
                                {(!reelCaptionsData?.options?.length || reelCaptionsData.options.length < 3) && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-2 w-fit"
                                        disabled={reelCaptionsLoading}
                                        onClick={handleGenerateReelCaptions}
                                    >
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        {reelCaptionsLoading ? 'Generating…' : 'Generate 3 options'}
                                    </Button>
                                )}
                            </SheetHeader>
                            <div className="mt-4 flex flex-1 flex-col gap-4 overflow-y-auto">
                                {reelCaptionsData?.options?.length ? (
                                    <>
                                        {reelCaptionsData.options.map((opt, i) => (
                                            <div key={i} className="rounded-lg border bg-muted/20 p-4">
                                                <p className="text-muted-foreground mb-2 text-xs font-medium">Option {i + 1}</p>
                                                <p className="whitespace-pre-wrap text-sm">{opt.caption}</p>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="mt-2 h-8"
                                                    onClick={() => copyToClipboard(opt.caption, 'Caption copied!')}
                                                >
                                                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                                                    Copy
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="w-fit"
                                            disabled={reelCaptionsLoading}
                                            onClick={handleGenerateReelCaptions}
                                        >
                                            {reelCaptionsLoading ? 'Regenerating…' : 'Regenerate'}
                                        </Button>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground text-sm">No captions yet. Click Generate to create 3 options from your script.</p>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                    {generateError && (
                        <p className="text-destructive text-sm" role="alert">{generateError}</p>
                    )}

                    {/* Description: one button opens sheet — write manually or generate with AI inside */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant={descriptionData && (descriptionData.descriptionBlock || descriptionData.metaTags) ? 'ghost' : 'outline'}
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                onClick={() => setDescriptionSheetOpen(true)}
                            >
                                <FileText className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Description & tags</TooltipContent>
                    </Tooltip>
                    {descriptionError && (
                        <p className="text-destructive text-sm" role="alert">{descriptionError}</p>
                    )}
                    {/* Thumbnails: only for existing scripts; view/add/delete images in a side sheet */}
                    {isEdit && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 relative" onClick={() => setThumbnailsSheetOpen(true)}>
                                    <ImagePlus className="h-4 w-4" />
                                    {thumbnails.length > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-medium">
                                            {thumbnails.length}
                                        </span>
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">{thumbnails.length > 0 ? `Thumbnails (${thumbnails.length})` : 'Thumbnails'}</TooltipContent>
                        </Tooltip>
                    )}
                    <Sheet
                        open={descriptionSheetOpen}
                        onOpenChange={(open) => {
                            setDescriptionSheetOpen(open);
                            if (open) {
                                setDescriptionError(null);
                                if (descriptionData === null) setDescriptionData({ descriptionBlock: '', metaTags: '' });
                            }
                        }}
                    >
                        <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-xl">
                            <SheetHeader className="px-6 pt-6 pb-4">
                                <SheetTitle>Description, timestamps & tags</SheetTitle>
                                <SheetDescription>
                                    Edit below — changes are saved automatically with the script. Generate with AI or write your own.
                                </SheetDescription>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    {descriptionData && (descriptionData.descriptionBlock || descriptionData.metaTags) && (
                                        <>
                                            <Button type="button" variant="secondary" size="sm" onClick={() => copyToClipboard(descriptionData.descriptionBlock)}>
                                                <Copy className="mr-2 h-4 w-4" />
                                                Copy description
                                            </Button>
                                            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => copyToClipboard(descriptionData.metaTags, 'Tags copied!')}>
                                                <Copy className="mr-1.5 h-3.5 w-3.5" />
                                                Copy tags
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isGeneratingDescription}
                                        onClick={handleGenerateDescriptionAssets}
                                    >
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        {isGeneratingDescription ? 'Generating…' : descriptionData && (descriptionData.descriptionBlock || descriptionData.metaTags) ? 'Regenerate with AI' : 'Generate with AI'}
                                    </Button>
                                </div>
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

                    {/* Script tools: same row as title ideas / description / thumbnails */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setOutlineOpen(true)}>
                                <BookOpen className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Outline</TooltipContent>
                    </Tooltip>
                    <Popover>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <PopoverTrigger asChild>
                                            <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0">
                                                <ClipboardList className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">Checklist</TooltipContent>
                                </Tooltip>
                                <PopoverContent className="w-72 p-3" align="start" side="bottom">
                                    <p className="text-muted-foreground mb-2 text-xs font-medium">Script checklist</p>
                                    <div className="flex flex-col gap-2">
                                        {checklist.map((item) => (
                                            <label key={item.id} className="flex cursor-pointer items-center gap-2 text-sm">
                                                <Checkbox
                                                    checked={item.checked}
                                                    onCheckedChange={(checked) =>
                                                        setChecklist((prev) =>
                                                            prev.map((i) => (i.id === item.id ? { ...i, checked: !!checked } : i))
                                                        )
                                                    }
                                                />
                                                <span className={item.checked ? 'text-muted-foreground line-through' : ''}>{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                            {(content.length === 0 || (content.length === 1 && !blocksToPlainText(content).trim())) && (
                                <Popover open={templatePickerOpen} onOpenChange={setTemplatePickerOpen}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <PopoverTrigger asChild>
                                                <Button type="button" variant="outline" size="sm" className="h-9 shrink-0">
                                                    <FileStack className="mr-2 h-4 w-4" />
                                                    Start from template
                                                </Button>
                                            </PopoverTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">Script templates</TooltipContent>
                                    </Tooltip>
                                    <PopoverContent className="w-64 p-2" align="start">
                                        {SCRIPT_TEMPLATES.map((t) => (
                                            <Button
                                                key={t.id}
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-start"
                                                onClick={() => {
                                                    setContent(t.content.map((b) => ({ ...b, id: crypto.randomUUID() })));
                                                    setTemplatePickerOpen(false);
                                                    toast.success(`Applied "${t.name}" template`);
                                                }}
                                            >
                                                {t.name}
                                            </Button>
                                        ))}
                                    </PopoverContent>
                                </Popover>
                            )}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => { setSnippetsSheetOpen(true); setSnippetsLoading(true); fetch(tenantRouter.route('script.snippets.index'), { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } }).then((r) => r.json()).then((d) => { setSnippets(d.snippets ?? []); setSnippetsLoading(false); }).catch(() => setSnippetsLoading(false)); }}>
                                        <Quote className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">Snippets</TooltipContent>
                            </Tooltip>
                            <Popover open={analysisPopoverOpen} onOpenChange={setAnalysisPopoverOpen}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <PopoverTrigger asChild>
                                            <Button type="button" variant="outline" size="icon" className="h-9 w-9" disabled={analysisLoading}>
                                                <BarChart2 className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">Analysis</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-9 w-9"
                                            disabled={shortLoading}
                                            onClick={handleGenerateShort}
                                        >
                                            {shortLoading ? <span className="text-xs">…</span> : <Film className="h-4 w-4" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">Generate short from script</TooltipContent>
                                </Tooltip>
                                <PopoverContent className="w-56 p-2" align="start">
                                    <p className="text-muted-foreground mb-2 px-1 text-xs font-medium">What do you want to analyze?</p>
                                    <div className="grid gap-0.5">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="justify-start font-normal"
                                            onClick={() => runAnalysis('retention')}
                                            disabled={analysisLoading}
                                        >
                                            Retention & engagement
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="justify-start font-normal"
                                            onClick={() => runAnalysis('cta')}
                                            disabled={analysisLoading}
                                        >
                                            CTA & conversion
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="justify-start font-normal"
                                            onClick={() => runAnalysis('storytelling')}
                                            disabled={analysisLoading}
                                        >
                                            Storytelling & narrative
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="justify-start font-normal"
                                            onClick={() => runAnalysis('readability')}
                                        >
                                            Readability & repetition
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <span className="text-muted-foreground mx-1 text-xs">|</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9"
                                disabled={!!aiScriptActionLoading}
                                onClick={() => handleAiScriptAction('intro', { insertAt: 'top' })}
                            >
                                {aiScriptActionLoading === 'intro' ? '…' : 'Write intro'}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9"
                                disabled={!!aiScriptActionLoading}
                                onClick={() => handleAiScriptAction('outro', { insertAt: 'bottom' })}
                            >
                                {aiScriptActionLoading === 'outro' ? '…' : 'Write outro'}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-9"
                                disabled={!!aiScriptActionLoading}
                                onClick={() => handleAiScriptAction('hook', { insertAt: 'top' })}
                            >
                                {aiScriptActionLoading === 'hook' ? '…' : 'Suggest hook'}
                            </Button>

                    <Sheet open={outlineOpen} onOpenChange={setOutlineOpen}>
                        <SheetContent side="left" className="w-64">
                            <SheetHeader>
                                <SheetTitle>Outline</SheetTitle>
                                <SheetDescription>Headings in your script</SheetDescription>
                            </SheetHeader>
                            <div className="mt-4 space-y-1">
                                {outlineEntries.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">Add heading blocks to see the outline.</p>
                                ) : (
                                    outlineEntries.map((e) => (
                                        <div key={e.id} className="text-sm" style={{ paddingLeft: (e.level - 1) * 12 }}>
                                            {e.text}
                                        </div>
                                    ))
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>

                    <Sheet open={analysisPanelOpen} onOpenChange={setAnalysisPanelOpen}>
                        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle>
                                    Analysis {analysisResult ? `(${analysisResult.type === 'retention' ? 'Retention & engagement' : analysisResult.type === 'cta' ? 'CTA & conversion' : analysisResult.type === 'storytelling' ? 'Storytelling & narrative' : 'Readability & repetition'})` : ''}
                                </SheetTitle>
                                <SheetDescription>
                                    Reference while editing. Use Apply to insert a suggested version above the original in the script.
                                </SheetDescription>
                            </SheetHeader>
                            {analysisLoading && (
                                <p className="text-muted-foreground mt-4 text-sm">Running analysis…</p>
                            )}
                            {!analysisLoading && analysisResult && (analysisResult.type === 'retention' || analysisResult.type === 'cta' || analysisResult.type === 'storytelling') && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-4"
                                    onClick={() => runAnalysis(analysisResult.type as AnalysisType, true)}
                                >
                                    Regenerate
                                </Button>
                            )}
                            {!analysisLoading && analysisResult && (
                                <div className="mt-4 space-y-6">
                                    {analysisResult.analysis && (
                                        <div className="rounded-md border bg-muted/30 p-4">
                                            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                                                <AnalysisMarkdown text={analysisResult.analysis} />
                                            </div>
                                        </div>
                                    )}
                                    {analysisResult.suggestions.length > 0 && (
                                        <div>
                                            <h4 className="mb-2 text-sm font-semibold">Suggested fixes (insert above original)</h4>
                                            <div className="space-y-3">
                                                {analysisResult.suggestions.map((s, i) => (
                                                    <div key={i} className="rounded-md border bg-card p-3">
                                                        <p className="text-muted-foreground mb-1 text-xs font-medium">{s.label}</p>
                                                        <p className="text-muted-foreground mb-2 line-clamp-2 text-xs">Original: {s.originalSnippet.slice(0, 120)}{s.originalSnippet.length > 120 ? '…' : ''}</p>
                                                        <p className="mb-3 line-clamp-3 text-xs">Suggested: {s.suggestedText.slice(0, 180)}{s.suggestedText.length > 180 ? '…' : ''}</p>
                                                        <Button type="button" variant="secondary" size="sm" onClick={() => applySuggestion(s)}>
                                                            Apply above original
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </SheetContent>
                    </Sheet>

                    <Dialog open={shortDialogOpen} onOpenChange={setShortDialogOpen}>
                        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Short from script</DialogTitle>
                                <DialogDescription>
                                    Edit the short below, then create a new script to save it. The new script will be titled with &quot; SHORT&quot; appended.
                                </DialogDescription>
                            </DialogHeader>
                            <Textarea
                                value={shortScriptText}
                                onChange={(e) => setShortScriptText(e.target.value)}
                                placeholder="Short script will appear here…"
                                className="min-h-[280px] resize-y font-sans text-sm"
                                disabled={shortLoading}
                            />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShortDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    disabled={!shortScriptText.trim() || shortCreating}
                                    onClick={handleCreateScriptFromShort}
                                >
                                    {shortCreating ? 'Creating…' : 'Create new script'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Sheet open={snippetsSheetOpen} onOpenChange={setSnippetsSheetOpen}>
                        <SheetContent side="right" className="w-full sm:max-w-md">
                            <SheetHeader>
                                <SheetTitle>Snippets</SheetTitle>
                                <SheetDescription>Insert saved phrases at the end of your script.</SheetDescription>
                            </SheetHeader>
                            <div className="mt-4 flex flex-col gap-2">
                                {snippetsLoading ? (
                                    <p className="text-muted-foreground text-sm">Loading…</p>
                                ) : (
                                    <>
                                        {snippets.map((s) => (
                                            <div key={s.id} className="flex items-center justify-between gap-2 rounded border p-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-sm">{s.title}</p>
                                                    <p className="text-muted-foreground truncate text-xs">{s.body.slice(0, 60)}{s.body.length > 60 ? '…' : ''}</p>
                                                </div>
                                                <div className="flex shrink-0 gap-1">
                                                    <Button size="sm" variant="outline" onClick={() => { const newBlock = { id: crypto.randomUUID(), type: 'paragraph', content: [{ type: 'text', text: s.body }] } as PartialBlock; setContent((prev) => [...prev, newBlock]); toast.success('Snippet appended'); }}>Insert</Button>
                                                    <Button size="sm" variant="ghost" onClick={async () => { const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''; await fetch(tenantRouter.route('script.snippets.destroy', { id: s.id }), { method: 'DELETE', headers: { 'X-CSRF-TOKEN': csrf, 'X-Requested-With': 'XMLHttpRequest' } }); setSnippets((prev) => prev.filter((x) => x.id !== s.id)); toast.success('Deleted'); }}><X className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="rounded border border-dashed p-3">
                                            <p className="text-muted-foreground mb-2 text-xs font-medium">Add snippet</p>
                                            <SnippetAddForm
                                                tenantRouter={tenantRouter}
                                                onAdded={(s) => setSnippets((prev) => [...prev, s])}
                                            />
                                        </div>
                                    </>
                                )}
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
                        onEditorReady={(e) => { blockNoteEditorRef.current = e; }}
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
                                    <p className="text-muted-foreground text-xs">Only organization members can be added. To share publicly, use Publish above.</p>
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
                                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveCollaborator(c.user_id)} title="Remove from this script">
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {shareData?.access_denied_user_ids && shareData.access_denied_user_ids.length > 0 && shareData.org_members && (
                                        <div className="space-y-1.5">
                                            <p className="text-muted-foreground text-xs font-medium">Removed from this script (can re-add)</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {shareData.org_members
                                                    .filter((m) => shareData.access_denied_user_ids!.includes(m.user_id))
                                                    .map((m) => (
                                                        <span key={m.user_id} className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-xs">
                                                            {m.name}
                                                            <Button type="button" variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={() => handleReAddRemoved(m.email)}>
                                                                Re-add
                                                            </Button>
                                                        </span>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        <Select
                                            value={inviteMemberId === '' ? '' : String(inviteMemberId)}
                                            onValueChange={(v) => {
                                                const id = v === '' ? '' : Number(v);
                                                setInviteMemberId(id);
                                                if (id && shareData?.org_members) {
                                                    const member = shareData.org_members.find((m) => m.user_id === id);
                                                    if (member) setInviteEmail(member.email);
                                                }
                                                setInviteError(null);
                                            }}
                                        >
                                            <SelectTrigger className="max-w-[220px]">
                                                <SelectValue placeholder="Add a team member…" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {shareData?.org_members
                                                    ?.filter(
                                                        (m) =>
                                                            m.user_id !== shareData.owner?.user_id &&
                                                            !(shareData.collaborators || []).some((c) => c.user_id === m.user_id)
                                                    )
                                                    .map((m) => (
                                                        <SelectItem key={m.user_id} value={String(m.user_id)}>
                                                            {m.name} ({m.email})
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
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
                                            {inviteLoading ? '…' : 'Add'}
                                        </Button>
                                    </div>
                                    {inviteError && <p className="text-destructive text-sm">{inviteError}</p>}
                                </section>
                                <section className="space-y-3">
                                    <h4 className="text-sm font-medium">Co-authors</h4>
                                    <p className="text-muted-foreground text-xs">Credit others on this script. Optionally give them edit access when adding.</p>
                                    <ul className="space-y-2">
                                        {coAuthors.map((c) => (
                                            <li key={c.user_id} className="flex items-center justify-between gap-2 rounded-md border p-2">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">{c.name}</p>
                                                    <p className="text-muted-foreground truncate text-xs">{c.email}</p>
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={() => handleRemoveCoAuthor(c.user_id)} disabled={coAuthorRemoving === c.user_id} title="Remove co-author">
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                    {coAuthors.length === 0 && <p className="text-muted-foreground text-xs">No co-authors yet.</p>}
                                    {shareData?.org_members && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Select value={coAuthorPickId === '' ? '' : String(coAuthorPickId)} onValueChange={(v) => setCoAuthorPickId(v === '' ? '' : Number(v))} disabled={coAuthorAdding}>
                                                <SelectTrigger className="max-w-[220px]">
                                                    <SelectValue placeholder="Add co-author…" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {shareData.org_members
                                                        .filter((m) => m.user_id !== shareData.owner?.user_id && !coAuthors.some((c) => c.user_id === m.user_id))
                                                        .map((m) => (
                                                            <SelectItem key={m.user_id} value={String(m.user_id)}>
                                                                {m.name} ({m.email})
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                            <label className="flex items-center gap-1.5 text-sm">
                                                <input type="checkbox" checked={coAuthorAddAsEditor} onChange={(e) => setCoAuthorAddAsEditor(e.target.checked)} className="rounded border-input" />
                                                Also give edit access
                                            </label>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => {
                                                    if (coAuthorPickId && !coAuthors.some((c) => c.user_id === coAuthorPickId)) {
                                                        handleAddCoAuthor(coAuthorPickId, coAuthorAddAsEditor);
                                                        setCoAuthorPickId('');
                                                    }
                                                }}
                                                disabled={coAuthorAdding || !coAuthorPickId}
                                            >
                                                {coAuthorAdding ? '…' : 'Add'}
                                            </Button>
                                        </div>
                                    )}
                                </section>
                            </div>
                        </SheetContent>
                    </Sheet>
                )}
            </div>
        </AppLayout>
    );
}
