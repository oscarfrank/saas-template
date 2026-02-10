import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import type { BlockNoteEditor as BlockNoteEditorType, PartialBlock } from '@blocknote/core';

const ON_CHANGE_DEBOUNCE_MS = 400;

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
}

export function BlockNoteEditor({
    initialContent,
    onChange,
    editable = true,
    className,
    placeholder = 'Start typing...',
    showFormattingToolbar = true,
}: BlockNoteEditorProps) {
    const editor = useCreateBlockNote({
        initialContent,
    });

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

    return (
        <div className={cn('blocknote-editor-wrapper', className)}>
            <BlockNoteView
                editor={editor}
                editable={editable}
                className={cn('blocknote-editor', 'min-h-[60vh]')}
            />
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

