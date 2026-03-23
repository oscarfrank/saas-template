import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
    content: string;
    className?: string;
};

/**
 * Renders assistant / agent replies that use Markdown (headings, lists, tables, bold, etc.).
 * Used across Cortex chat UIs for consistent typography.
 */
export function AgentMarkdown({ content, className }: Props) {
    return (
        <div
            className={cn(
                'prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed',
                'prose-headings:scroll-mt-20 prose-p:my-2 prose-ul:my-2 prose-ol:my-2',
                'prose-table:text-sm prose-th:border prose-td:border prose-table:border-border',
                className,
            )}
        >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
    );
}
