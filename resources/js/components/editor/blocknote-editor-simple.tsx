import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

/**
 * Simple BlockNote editor component for testing
 * Use this if the main BlockNoteEditor has issues
 */
export function BlockNoteEditorSimple() {
    const editor = useCreateBlockNote();

    return (
        <div className="min-h-[400px] rounded-md border p-4">
            <BlockNoteView editor={editor} />
        </div>
    );
}

