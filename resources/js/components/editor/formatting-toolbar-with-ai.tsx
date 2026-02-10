import {
    getFormattingToolbarItems,
    useBlockNoteEditor,
    useComponentsContext,
} from '@blocknote/react';
import { useState, useCallback } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAiEdit } from './ai-edit-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * Custom formatting toolbar that adds an AI edit button.
 * Renders default toolbar items plus an AI button that opens an instruction popover,
 * calls the backend, and lets the parent show the result card (original vs new, Discard / Keep new / Keep both).
 */
export function FormattingToolbarWithAi() {
    const Components = useComponentsContext();
    const items = getFormattingToolbarItems();
    if (!Components?.FormattingToolbar?.Root) return null;

    const Root = Components.FormattingToolbar.Root;
    return (
        <Root className={cn('bn-toolbar', 'bn-formatting-toolbar')}>
            {items}
            <AiEditButton />
        </Root>
    );
}

type CapturedSelection = { from: number; to: number; selectedText: string };

function AiEditButton() {
    const editor = useBlockNoteEditor();
    const { onAiEditRequest, showResultCard } = useAiEdit();
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [instruction, setInstruction] = useState('');
    const [loading, setLoading] = useState(false);
    /** Captured when opening the popover so selection is valid after user focuses the textarea */
    const [capturedSelection, setCapturedSelection] = useState<CapturedSelection | null>(null);

    const Components = useComponentsContext();
    const ButtonComponent = Components?.FormattingToolbar?.Button;

    const handleOpen = useCallback(() => {
        if (!editor) return;
        const selectedText = editor.getSelectedText?.()?.trim?.() ?? '';
        if (!selectedText) {
            toast.error('Select some text first');
            return;
        }
        const tiptap = (editor as unknown as { _tiptapEditor?: { state: { selection: { from: number; to: number } } } })._tiptapEditor;
        const from = tiptap?.state?.selection?.from ?? 0;
        const to = tiptap?.state?.selection?.to ?? 0;
        setCapturedSelection({ from, to, selectedText });
        setInstruction('');
        setPopoverOpen(true);
    }, [editor]);

    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (!open) {
                setLoading(false);
                if (capturedSelection && editor) {
                    const tiptap = (editor as unknown as { _tiptapEditor?: { commands: { setTextSelection: (r: { from: number; to: number }) => void }; focus: () => void } })._tiptapEditor;
                    if (tiptap?.commands?.setTextSelection) {
                        tiptap.commands.setTextSelection({ from: capturedSelection.from, to: capturedSelection.to });
                        tiptap.focus?.();
                    }
                }
                setCapturedSelection(null);
            }
            setPopoverOpen(open);
        },
        [editor, capturedSelection]
    );

    const handleSubmit = useCallback(async () => {
        if (!editor || !onAiEditRequest || !showResultCard || !capturedSelection) return;
        if (!instruction.trim()) {
            toast.error('Enter an instruction');
            return;
        }

        const { from, to, selectedText } = capturedSelection;
        setLoading(true);
        try {
            const rewritten = await onAiEditRequest(selectedText, instruction.trim());
            if (rewritten != null && rewritten !== '') {
                setPopoverOpen(false);
                setCapturedSelection(null);
                showResultCard({ from, to, originalText: selectedText, rewrittenText: rewritten });
            } else {
                toast.error('No rewrite returned');
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'AI edit failed');
        } finally {
            setLoading(false);
        }
    }, [editor, onAiEditRequest, showResultCard, instruction, capturedSelection]);

    if (!onAiEditRequest || !showResultCard || !ButtonComponent) return null;

    return (
        <>
            <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    <span>
                        <ButtonComponent
                            mainTooltip="AI edit selection"
                            label="AI edit"
                            icon={<Sparkles className="size-4" />}
                            onClick={handleOpen}
                            isDisabled={loading}
                        />
                    </span>
                </PopoverTrigger>
                <PopoverContent
                    className="w-80"
                    side="bottom"
                    align="end"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <div className="space-y-3">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-4">
                                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Rewriting selection…</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    Describe how you want the selected text rewritten.
                                </p>
                                {capturedSelection && (
                                    <p className="text-muted-foreground rounded border border-border bg-muted/30 p-2 text-xs">
                                        Selected: {capturedSelection.selectedText.length > 80 ? capturedSelection.selectedText.slice(0, 80) + '…' : capturedSelection.selectedText}
                                    </p>
                                )}
                                <Textarea
                                    placeholder="e.g. Make it more conversational and concise"
                                    value={instruction}
                                    onChange={(e) => setInstruction(e.target.value)}
                                    rows={3}
                                    className="resize-none"
                                />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOpenChange(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleSubmit}
                                        disabled={!instruction.trim()}
                                    >
                                        Rewrite
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </>
    );
}
