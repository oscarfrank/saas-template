import { FormattingToolbarController, useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { BlockNoteEditor as BlockNoteEditorType, PartialBlock } from '@blocknote/core';
import { AiEditProvider, type AiEditResultCardData } from './ai-edit-context';
import { FormattingToolbarWithAi } from './formatting-toolbar-with-ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

const ON_CHANGE_DEBOUNCE_MS = 400;

function AiEditResultCard({
    originalText,
    rewrittenText,
    onDiscard,
    onKeepNew,
    onKeepBoth,
}: {
    originalText: string;
    rewrittenText: string;
    onDiscard: () => void;
    onKeepNew: () => void;
    onKeepBoth: () => void;
}) {
    const preview = (text: string, maxLen: number) =>
        text.length <= maxLen ? text : text.slice(0, maxLen) + '…';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-lg shadow-lg">
                <CardHeader className="pb-2">
                    <h3 className="text-sm font-semibold">AI rewrite</h3>
                    <p className="text-muted-foreground text-xs">Choose an action</p>
                </CardHeader>
                <CardContent className="space-y-3 pb-2">
                    <div>
                        <p className="text-muted-foreground mb-1 text-xs font-medium">Original</p>
                        <p className="rounded border bg-muted/50 p-2 text-sm">{preview(originalText, 200)}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-1 text-xs font-medium">New</p>
                        <p className="rounded border bg-muted/50 p-2 text-sm">{preview(rewrittenText, 200)}</p>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
                    <Button type="button" variant="outline" size="sm" onClick={onDiscard}>
                        Discard
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={onKeepNew}>
                        Keep new
                    </Button>
                    <Button type="button" size="sm" onClick={onKeepBoth}>
                        Keep both
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

interface BlockNoteEditorProps {
    /**
     * Initial content to load into the editor
     */
    initialContent?: PartialBlock[];
    /**
     * Callback when content changes
     */
    onChange?: (content: PartialBlock[]) => void;
    /**
     * Whether the editor is editable
     */
    editable?: boolean;
    /**
     * Additional CSS classes
     */
    className?: string;
    /**
     * Placeholder text
     */
    placeholder?: string;
    /**
     * Whether to show the formatting toolbar
     */
    showFormattingToolbar?: boolean;
    /**
     * When provided, enables AI edit: toolbar gets an AI button; callback receives (selectedText, instruction) and returns rewritten text.
     */
    onAiEditRequest?: (selectedText: string, instruction: string) => Promise<string | null>;
    /**
     * Called when the editor instance is ready. Use to get a ref for programmatic insertion (e.g. intro/outro).
     */
    onEditorReady?: (editor: BlockNoteEditorType) => void;
}

export function BlockNoteEditor({
    initialContent,
    onChange,
    editable = true,
    className,
    placeholder = 'Start typing...',
    showFormattingToolbar = true,
    onAiEditRequest,
    onEditorReady,
}: BlockNoteEditorProps) {
    const editor = useCreateBlockNote({
        initialContent,
    });

    useEffect(() => {
        if (editor && onEditorReady) onEditorReady(editor as BlockNoteEditorType);
    }, [editor, onEditorReady]);

    const [resultCard, setResultCard] = useState<AiEditResultCardData | null>(null);

    const showResultCard = useCallback((data: AiEditResultCardData) => {
        setResultCard(data);
    }, []);

    const applyKeepNew = useCallback(() => {
        if (!resultCard || !editor) return;
        const tiptap = (editor as unknown as { _tiptapEditor?: { chain: () => { focus: () => { deleteRange: (r: { from: number; to: number }) => { insertContentAt: (pos: number, text: string) => { run: () => void } } } } } })._tiptapEditor;
        if (tiptap) {
            tiptap.chain().focus().deleteRange({ from: resultCard.from, to: resultCard.to }).insertContentAt(resultCard.from, resultCard.rewrittenText).run();
        }
        setResultCard(null);
    }, [editor, resultCard]);

    const applyKeepBoth = useCallback(() => {
        if (!resultCard || !editor) return;
        const tiptap = (editor as unknown as { _tiptapEditor?: { chain: () => { focus: () => { insertContentAt: (pos: number, text: string) => { run: () => void } } } } })._tiptapEditor;
        if (tiptap) {
            const insertText = resultCard.rewrittenText.startsWith('\n') ? resultCard.rewrittenText : '\n\n' + resultCard.rewrittenText;
            tiptap.chain().focus().insertContentAt(resultCard.to, insertText).run();
        }
        setResultCard(null);
    }, [editor, resultCard]);

    // Debounce onChange to reduce parent re-renders and avoid ProseMirror selection warnings
    // (e.g. "TextSelection endpoint not pointing into a node with inline content")
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {
        if (!onChange) return;

        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const handleChange = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                timeoutId = null;
                try {
                    const blocks = editor.document;
                    onChangeRef.current?.(blocks);
                } catch (error) {
                    console.error('Error in editor onChange:', error);
                }
            }, ON_CHANGE_DEBOUNCE_MS);
        };

        let unsubscribe: (() => void) | undefined;
        try {
            unsubscribe = editor.onChange(handleChange);
        } catch (error) {
            console.error('Error subscribing to editor changes:', error);
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (unsubscribe && typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [editor]);

    const view = (
        <BlockNoteView
            editor={editor}
            editable={editable}
            className={cn('blocknote-editor', 'min-h-[60vh]')}
            formattingToolbar={onAiEditRequest ? false : showFormattingToolbar}
        >
            {onAiEditRequest && showFormattingToolbar ? (
                <FormattingToolbarController formattingToolbar={FormattingToolbarWithAi} />
            ) : null}
        </BlockNoteView>
    );

    const wrappedView = onAiEditRequest ? (
        <AiEditProvider onAiEditRequest={onAiEditRequest} showResultCard={showResultCard}>
            {view}
            {resultCard &&
                createPortal(
                    <AiEditResultCard
                        originalText={resultCard.originalText}
                        rewrittenText={resultCard.rewrittenText}
                        onDiscard={() => setResultCard(null)}
                        onKeepNew={applyKeepNew}
                        onKeepBoth={applyKeepBoth}
                    />,
                    document.body
                )}
        </AiEditProvider>
    ) : (
        view
    );

    return (
        <div className={cn('blocknote-editor-wrapper', className)}>
            {wrappedView}
            <style>{`
                .blocknote-editor-wrapper .blocknote-editor {
                    font-family: var(--font-sans);
                }
                
                .blocknote-editor-wrapper .bn-container {
                    background: transparent;
                    border: none;
                    box-shadow: none;
                }
                
                .blocknote-editor-wrapper .bn-editor {
                    min-height: 60vh;
                    padding: 0;
                }
                
                .blocknote-editor-wrapper .bn-block-content {
                    color: var(--foreground);
                }
                
                .blocknote-editor-wrapper .bn-inline-content {
                    color: var(--foreground);
                }
                
                .blocknote-editor-wrapper .bn-block[data-content-type="paragraph"] {
                    margin: 0.25rem 0;
                }
                
                .blocknote-editor-wrapper .bn-block[data-content-type="heading"] {
                    margin: 1.5rem 0 0.5rem;
                    font-weight: 600;
                }
                
                .blocknote-editor-wrapper .bn-block[data-content-type="heading"][data-level="1"] {
                    font-size: 2rem;
                    line-height: 2.5rem;
                }
                
                .blocknote-editor-wrapper .bn-block[data-content-type="heading"][data-level="2"] {
                    font-size: 1.5rem;
                    line-height: 2rem;
                }
                
                .blocknote-editor-wrapper .bn-block[data-content-type="heading"][data-level="3"] {
                    font-size: 1.25rem;
                    line-height: 1.75rem;
                }
                
                .blocknote-editor-wrapper .bn-slash-menu {
                    background: var(--popover);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
                }
                
                .blocknote-editor-wrapper .bn-slash-menu-item {
                    color: var(--popover-foreground);
                    padding: 0.5rem 0.75rem;
                }
                
                .blocknote-editor-wrapper .bn-slash-menu-item:hover,
                .blocknote-editor-wrapper .bn-slash-menu-item[data-selected="true"] {
                    background: var(--accent);
                    color: var(--accent-foreground);
                }
                
                .blocknote-editor-wrapper .bn-formatting-toolbar {
                    background: var(--popover);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
                }
                
                .blocknote-editor-wrapper .bn-formatting-toolbar-button {
                    color: var(--popover-foreground);
                    padding: 0.375rem 0.5rem;
                }
                
                .blocknote-editor-wrapper .bn-formatting-toolbar-button:hover,
                .blocknote-editor-wrapper .bn-formatting-toolbar-button[data-selected="true"] {
                    background: var(--accent);
                    color: var(--accent-foreground);
                }
                
                .dark .blocknote-editor-wrapper .bn-slash-menu,
                .dark .blocknote-editor-wrapper .bn-formatting-toolbar {
                    background: var(--popover);
                    border-color: var(--border);
                }
                
                .dark .blocknote-editor-wrapper .bn-block-content,
                .dark .blocknote-editor-wrapper .bn-inline-content {
                    color: var(--foreground);
                }
            `}</style>
        </div>
    );
}

export type { BlockNoteEditor as BlockNoteEditorType, PartialBlock } from '@blocknote/core';

