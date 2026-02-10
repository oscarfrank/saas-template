import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import type { PartialBlock } from '@blocknote/core';
import { useState, useEffect } from 'react';

interface EditorProps {
    initialContent?: PartialBlock[];
    onChange?: (content: PartialBlock[]) => void;
    placeholder?: string;
    editable?: boolean;
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

interface ScriptPayload {
    id: number;
    title: string;
    thumbnail_text: string | null;
    script_type_id: number | null;
    content: PartialBlock[] | null;
    description: string | null;
    meta_tags: string | null;
    status: string;
    read_only?: boolean;
    title_options?: TitleOptionRow[];
    thumbnails?: ThumbnailRow[];
}

interface Props {
    script: ScriptPayload;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Shared script', href: '#' },
];

export default function ScriptSharedView({ script }: Props) {
    const content = script.content?.length ? script.content : [];
    const titleOptions = script.title_options ?? [];
    const thumbnails = script.thumbnails ?? [];
    const hasDescription = (script.description?.trim() ?? '') !== '';
    const hasMetaTags = (script.meta_tags?.trim() ?? '') !== '';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={script.title || 'Shared script'} />
            <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
                <p className="text-muted-foreground mb-4 text-sm">Shared with you (read-only)</p>

                <header className="mb-8">
                    <h1 className="text-2xl font-semibold md:text-3xl">{script.title || 'Untitled script'}</h1>
                    {script.thumbnail_text && (
                        <p className="text-muted-foreground mt-1 text-sm">{script.thumbnail_text}</p>
                    )}
                </header>

                {titleOptions.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-muted-foreground mb-3 text-sm font-medium uppercase tracking-wider">Title options</h2>
                        <ul className="flex flex-wrap gap-2">
                            {titleOptions.map((opt, i) => (
                                <li
                                    key={opt.id ?? i}
                                    className="rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                                >
                                    <span className="font-medium">{opt.title}</span>
                                    {opt.thumbnail_text && (
                                        <span className="text-muted-foreground ml-2 text-xs">— {opt.thumbnail_text}</span>
                                    )}
                                    {opt.is_primary && (
                                        <span className="text-muted-foreground ml-2 text-xs">(current)</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {thumbnails.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-muted-foreground mb-3 text-sm font-medium uppercase tracking-wider">Thumbnails</h2>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {thumbnails.map((thumb) => (
                                <div key={thumb.id} className="overflow-hidden rounded-lg border bg-muted/30">
                                    <img src={thumb.url} alt="" className="aspect-video w-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className="mb-8">
                    <h2 className="text-muted-foreground mb-3 text-sm font-medium uppercase tracking-wider">Script content</h2>
                    <div className="min-h-[60vh] rounded-md border bg-muted/10 p-4">
                        <ClientOnlyBlockNoteEditor
                            initialContent={content.length > 0 ? content : undefined}
                            placeholder="No content."
                            editable={false}
                        />
                    </div>
                </section>

                {(hasDescription || hasMetaTags) && (
                    <section className="rounded-lg border bg-muted/10 p-4">
                        {hasDescription && (
                            <div className={hasMetaTags ? 'mb-4' : ''}>
                                <h2 className="text-muted-foreground mb-2 text-sm font-medium uppercase tracking-wider">Description</h2>
                                <div className="whitespace-pre-wrap text-sm">{script.description}</div>
                            </div>
                        )}
                        {hasMetaTags && (
                            <div>
                                <h2 className="text-muted-foreground mb-2 text-sm font-medium uppercase tracking-wider">Tags</h2>
                                <p className="text-muted-foreground text-sm">{script.meta_tags}</p>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
